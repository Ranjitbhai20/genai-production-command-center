import { supabase } from "@/lib/supabase";
import type { Asset, StageStatus } from "@/types/pipeline";

const ASSET_BUCKET = "production-assets";

export function assetFromRow(row: any): Asset {
  return {
    id: row.id,
    projectId: row.project_id,
    stageId: row.stage_id,
    linkedStage: row.stage_title,
    name: row.name,
    type: row.type,
    status: row.status as StageStatus,
    source: row.source,
    uploadedBy: row.uploaded_by,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadAssetsForProject(projectId: string) {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load assets:", error);
    return [];
  }

  return (data ?? []).map(assetFromRow);
}

export async function uploadAssetForStage({
  projectId,
  stageId,
  stageTitle,
  file,
  uploadedBy,
}: {
  projectId: string;
  stageId?: string;
  stageTitle: string;
  file: File;
  uploadedBy?: string;
}) {
  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${
    projectId
  }/${stageId ?? "unlinked"}/${timestamp}_${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(ASSET_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Failed to upload asset:", uploadError);
    return null;
  }

  const { data: publicUrlData } = supabase.storage
    .from(ASSET_BUCKET)
    .getPublicUrl(storagePath);

  const publicUrl = publicUrlData.publicUrl;

  const { data: assetRow, error: insertError } = await supabase
    .from("assets")
    .insert({
      project_id: projectId,
      stage_id: stageId ?? null,
      stage_title: stageTitle,
      name: file.name,
      type: file.type || "unknown",
      status: "Submitted",
      source: "Uploaded Asset",
      uploaded_by: uploadedBy ?? "Project User",
      storage_path: storagePath,
      public_url: publicUrl,
      size_bytes: file.size,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error("Failed to create asset row:", insertError);
    return null;
  }

  return assetFromRow(assetRow);
}

export async function updateAssetStatus({
  assetId,
  status,
}: {
  assetId: string;
  status: StageStatus;
}) {
  const { data, error } = await supabase
    .from("assets")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assetId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update asset status:", error);
    return null;
  }

  return assetFromRow(data);
}

export async function approveAsset(assetId: string) {
  return updateAssetStatus({
    assetId,
    status: "Approved",
  });
}

export async function rejectAsset(assetId: string) {
  return updateAssetStatus({
    assetId,
    status: "Rejected",
  });
}

export async function resubmitAsset(assetId: string) {
  return updateAssetStatus({
    assetId,
    status: "Submitted",
  });
}