"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Asset, Stage } from "@/types/pipeline";
import {
  assetFromRow,
  deleteDraftAsset,
  submitDraftAssetsForStage,
  uploadAssetForStage,
} from "@/lib/assetPersistence";
import { stageFromRow } from "@/lib/stagePersistence";
import { statusStyle } from "@/lib/statusStyle";

export default function WorkerStagePage({
  params,
}: {
  params: { projectId: string; stageId: string };
}) {
  const { projectId, stageId } = params;

  const [projectName, setProjectName] = useState("");
  const [stage, setStage] = useState<Stage | null>(null);
  const [allStages, setAllStages] = useState<Stage[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStageAssets = assets.filter(
    (asset) => asset.stageId === stageId || asset.linkedStage === stage?.title
  );

  const draftAssets = currentStageAssets.filter(
    (asset) => asset.status === "Draft"
  );

  const submittedOrReviewedAssets = currentStageAssets.filter(
    (asset) => asset.status !== "Draft"
  );

  const currentStageIndex = allStages.findIndex((item) => item.id === stageId);

  const previousStageTitles = allStages
    .slice(0, Math.max(currentStageIndex, 0))
    .map((item) => item.title);

  const referenceAssets = assets.filter(
    (asset) =>
      asset.status === "Approved" &&
      previousStageTitles.includes(asset.linkedStage)
  );

  const locked =
    stage?.status === "Submitted" ||
    stage?.status === "Approved" ||
    stage?.status === "Rejected";

  async function loadWorkerWorkspace() {
    setIsLoading(true);

    const { data: projectRow } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    const { data: stageRows } = await supabase
      .from("stages")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    const { data: assetRows } = await supabase
      .from("assets")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    const loadedStages = (stageRows ?? []).map(stageFromRow);
    const selectedStage = loadedStages.find((item) => item.id === stageId);

    setProjectName(projectRow?.name ?? "Production");
    setAllStages(loadedStages);
    setStage(selectedStage ?? null);
    setAssets((assetRows ?? []).map(assetFromRow));
    setIsLoading(false);
  }

  useEffect(() => {
    loadWorkerWorkspace();
  }, []);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !stage || locked) return;

    setIsUploading(true);

    await uploadAssetForStage({
      projectId,
      stageId,
      stageTitle: stage.title,
      file,
      uploadedBy: stage.assignedWorker || stage.defaultWorker,
    });

    event.target.value = "";
    await loadWorkerWorkspace();

    setIsUploading(false);
  }

  async function handleDeleteDraft(asset: Asset) {
    if (locked || asset.status !== "Draft") return;

    const confirmed = window.confirm(
      `Delete draft upload "${asset.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    await deleteDraftAsset(asset);
    await loadWorkerWorkspace();
  }

  async function handleSubmitForReview() {
    if (!stage || locked) return;

    if (draftAssets.length === 0) {
      window.alert("Upload at least one draft asset before submitting.");
      return;
    }

    const confirmed = window.confirm(
      "Submit this stage for director review? After submission, you cannot modify or delete these uploads."
    );

    if (!confirmed) return;

    setIsSubmitting(true);

    await submitDraftAssetsForStage({
      projectId,
      stageId,
      stageTitle: stage.title,
    });

    await supabase
      .from("stages")
      .update({
        status: "Submitted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", stageId);

    await loadWorkerWorkspace();

    setIsSubmitting(false);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        Loading worker workspace...
      </main>
    );
  }

  if (!stage) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        Worker stage not found.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-zinc-500">
            Worker Stage Workspace
          </p>

          <h1 className="text-4xl font-bold">{stage.title}</h1>

          <p className="mt-2 text-zinc-400">{projectName}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Badge label="Status" value={stage.status} />
            <Badge label="Assigned Worker" value={stage.assignedWorker} />
            <Badge label="Tool" value={stage.tool} />
            <Badge label="Method" value={stage.method} />
          </div>
        </div>

        {locked && (
          <div className="mb-8 rounded-2xl border border-yellow-800 bg-yellow-950/40 p-5 text-yellow-200">
            This stage has been submitted. Your workspace is now read-only.
          </div>
        )}

        <div className="grid grid-cols-[1fr_420px] gap-6">
          <section className="space-y-6">
            <Panel title="Task Brief">
              <p className="leading-relaxed text-zinc-300">{stage.taskBrief}</p>
            </Panel>

            <Panel title="Reference Assets From Previous Approved Stages">
              {referenceAssets.length === 0 && (
                <Empty>No approved reference assets available yet.</Empty>
              )}

              <div className="grid grid-cols-1 gap-3">
                {referenceAssets.map((asset) => (
                  <AssetCard key={asset.id ?? asset.name} asset={asset} />
                ))}
              </div>
            </Panel>

            <Panel title="My Submitted / Reviewed Work">
              {submittedOrReviewedAssets.length === 0 && (
                <Empty>No submitted work yet.</Empty>
              )}

              <div className="grid grid-cols-1 gap-3">
                {submittedOrReviewedAssets.map((asset) => (
                  <AssetCard key={asset.id ?? asset.name} asset={asset} />
                ))}
              </div>
            </Panel>
          </section>

          <aside className="sticky top-8 h-fit rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="mb-4 text-2xl font-bold">My Draft Uploads</h2>

            <p className="mb-5 text-sm leading-relaxed text-zinc-500">
              Upload, review, delete, and reupload files here. Once you submit
              for review, these files become locked production records.
            </p>

            <label
              className={`mb-5 flex cursor-pointer items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm hover:bg-zinc-800 ${
                locked || isUploading ? "pointer-events-none opacity-40" : ""
              }`}
            >
              {isUploading ? "Uploading..." : "Upload File"}

              <input
                type="file"
                className="hidden"
                disabled={locked || isUploading}
                onChange={handleUpload}
              />
            </label>

            <div className="mb-5 space-y-3">
              {draftAssets.length === 0 && <Empty>No draft files uploaded.</Empty>}

              {draftAssets.map((asset) => (
                <div
                  key={asset.id ?? asset.name}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
                >
                  <AssetCard asset={asset} compact />

                  {!locked && (
                    <button
                      onClick={() => handleDeleteDraft(asset)}
                      className="mt-3 w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                    >
                      Delete Draft
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmitForReview}
              disabled={locked || isSubmitting || draftAssets.length === 0}
              className="w-full rounded-xl border border-purple-800 bg-purple-950 px-4 py-3 text-sm text-purple-200 hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? "Submitting..." : "Submit for Director Review"}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-500">
      {children}
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-sm font-semibold">{value || "—"}</p>
    </div>
  );
}

function AssetCard({
  asset,
  compact,
}: {
  asset: Asset;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? ""
          : "rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">{asset.name}</p>

          <p className="mt-1 text-xs text-zinc-500">{asset.type}</p>

          {asset.createdAt && (
            <p className="mt-1 text-xs text-zinc-600">
              {new Date(asset.createdAt).toLocaleString()}
            </p>
          )}
        </div>

        <span
          className={`rounded-full border px-2 py-1 text-xs ${statusStyle(
            asset.status
          )}`}
        >
          {asset.status}
        </span>
      </div>

      {asset.publicUrl && (
        <a
          href={asset.publicUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-xs text-zinc-400 underline hover:text-zinc-200"
        >
          Open / Download
        </a>
      )}
    </div>
  );
}