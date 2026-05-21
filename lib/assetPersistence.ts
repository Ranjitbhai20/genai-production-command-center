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
      status: "Draft",
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

export async function submitDraftAssetsForStage({
  projectId,
  stageId,
  stageTitle,
}: {
  projectId: string;
  stageId?: string;
  stageTitle: string;
}) {
  let query = supabase
    .from("assets")
    .update({
      status: "Submitted",
      updated_at: new Date().toISOString(),
    })
    .eq("project_id", projectId)
    .eq("status", "Draft");

  if (stageId) {
    query = query.eq("stage_id", stageId);
  } else {
    query = query.eq("stage_title", stageTitle);
  }

  const { error } = await query;

  if (error) {
    console.error("Failed to submit draft assets:", error);
    return false;
  }

  return true;
}

export async function deleteDraftAsset(asset: Asset) {
  if (!asset.id) return false;

  if (asset.status !== "Draft") {
    console.error("Only draft assets can be deleted.");
    return false;
  }

  if (asset.storagePath) {
    const { error: storageError } = await supabase.storage
      .from(ASSET_BUCKET)
      .remove([asset.storagePath]);

    if (storageError) {
      console.error("Failed to delete asset file:", storageError);
      return false;
    }
  }

  const { error: deleteError } = await supabase
    .from("assets")
    .delete()
    .eq("id", asset.id);

  if (deleteError) {
    console.error("Failed to delete draft asset row:", deleteError);
    return false;
  }

  return true;
}

export async function removeUnsafeAsset(asset: Asset) {
  if (!asset.id) return false;

  if (asset.storagePath) {
    const { error: storageError } = await supabase.storage
      .from(ASSET_BUCKET)
      .remove([asset.storagePath]);

    if (storageError) {
      console.error("Failed to remove unsafe asset file:", storageError);
      return false;
    }
  }

  const { error } = await supabase
    .from("assets")
    .update({
      status: "Removed",
      storage_path: null,
      public_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", asset.id);

  if (error) {
    console.error("Failed to mark asset removed:", error);
    return false;
  }

  return true;
}

export async function withdrawAsset(assetId: string) {
  return updateAssetStatus({
    assetId,
    status: "Withdrawn",
  });
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