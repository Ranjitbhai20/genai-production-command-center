"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Asset, Project, Stage } from "@/types/pipeline";
import { statusStyle } from "@/lib/statusStyle";
import {
  deleteDraftAsset,
  submitDraftAssetsForStage,
  uploadAssetForStage,
} from "@/lib/assetPersistence";

type ActiveAssignment = {
  project: Project;
  stage: Stage;
};

function isExpired(expiresAt?: string) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

export function WorkerWorkspaceView({ projects }: { projects: Project[] }) {
  const [assets, setAssets] = useState<Asset[]>(
    projects.flatMap((project) => project.assets)
  );
  const [assignmentInput, setAssignmentInput] = useState("");
  const [activatedStageKeys, setActivatedStageKeys] = useState<string[]>([]);
  const [uploadingStageKey, setUploadingStageKey] = useState<string | null>(
    null
  );
  const [submittingStageKey, setSubmittingStageKey] = useState<string | null>(
    null
  );

  const assignmentRegistry = useMemo(() => {
    return projects.flatMap((project) =>
      project.stages
        .filter(
          (stage) =>
            project.id &&
            stage.id &&
            stage.assignmentKey &&
            stage.assignmentStatus === "active"
        )
        .map((stage) => ({
          project,
          stage,
          key: `${project.id}:${stage.id}`,
          assignmentKey: stage.assignmentKey,
        }))
    );
  }, [projects]);

  const activeAssignments: ActiveAssignment[] = assignmentRegistry
    .filter((item) => {
      const activated = activatedStageKeys.includes(item.key);

      const stillEditable =
        item.stage.status !== "Submitted" &&
        item.stage.status !== "Approved" &&
        item.stage.status !== "Rejected" &&
        item.stage.assignmentStatus === "active" &&
        !isExpired(item.stage.assignmentKeyExpiresAt);

      return activated && stillEditable;
    })
    .map((item) => ({
      project: item.project,
      stage: item.stage,
    }));

  const submittedAssets = assets.filter((asset) => asset.status !== "Draft");

  async function refreshAssets() {
    const { data } = await supabase
      .from("assets")
      .select("*")
      .order("created_at", { ascending: false });

    setAssets(
      (data ?? []).map((row) => ({
        id: row.id,
        projectId: row.project_id,
        stageId: row.stage_id,
        linkedStage: row.stage_title,
        name: row.name,
        type: row.type,
        status: row.status,
        source: row.source,
        uploadedBy: row.uploaded_by,
        storagePath: row.storage_path,
        publicUrl: row.public_url,
        sizeBytes: row.size_bytes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
    );
  }

  function normalizeAssignmentInput(value: string) {
    return value.trim().toUpperCase();
  }

  async function activateAssignment() {
    const normalized = normalizeAssignmentInput(assignmentInput);

    const match = assignmentRegistry.find(
    (item) => item.assignmentKey?.toUpperCase() === normalized
);

    if (!match) {
      window.alert("Assignment key not recognized.");
      return;
    }

    if (isExpired(match.stage.assignmentKeyExpiresAt)) {
      await supabase
        .from("stages")
        .update({
          assignment_key: null,
          assignment_status: "expired",
          updated_at: new Date().toISOString(),
        })
        .eq("id", match.stage.id);

      window.alert("Assignment key expired.");
      window.location.reload();
      return;
    }

    await supabase
      .from("stages")
      .update({
        assignment_activated_at:
          match.stage.assignmentActivatedAt ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", match.stage.id);

    setActivatedStageKeys((current) => {
      if (current.includes(match.key)) return current;
      return [...current, match.key];
    });

    setAssignmentInput("");
  }

  async function handleUpload(project: Project, stage: Stage, file: File) {
    if (!project.id || !stage.id) return;

    if (isExpired(stage.assignmentKeyExpiresAt)) {
      window.alert("Assignment key expired. Ask the director for a new key.");
      return;
    }

    const stageKey = `${project.id}:${stage.id}`;

    setUploadingStageKey(stageKey);

    await uploadAssetForStage({
      projectId: project.id,
      stageId: stage.id,
      stageTitle: stage.title,
      file,
      uploadedBy: "Worker User",
    });

    await refreshAssets();

    setUploadingStageKey(null);
  }

  async function handleDelete(asset: Asset) {
    const confirmed = window.confirm(`Delete "${asset.name}"?`);

    if (!confirmed) return;

    await deleteDraftAsset(asset);
    await refreshAssets();
  }

  async function handleSubmit(project: Project, stage: Stage) {
    if (!project.id || !stage.id) return;

    if (isExpired(stage.assignmentKeyExpiresAt)) {
      window.alert("Assignment key expired. Ask the director for a new key.");
      return;
    }

    const stageKey = `${project.id}:${stage.id}`;

    const stageDrafts = assets.filter(
      (asset) =>
        asset.projectId === project.id &&
        asset.status === "Draft" &&
        (asset.stageId === stage.id || asset.linkedStage === stage.title)
    );

    if (stageDrafts.length === 0) {
      window.alert("Upload at least one file before submitting.");
      return;
    }

    const confirmed = window.confirm(
      "Submit this assignment? After submission, files become read-only."
    );

    if (!confirmed) return;

    setSubmittingStageKey(stageKey);

    await submitDraftAssetsForStage({
      projectId: project.id,
      stageId: stage.id,
      stageTitle: stage.title,
    });

    await supabase
      .from("stages")
      .update({
        status: "Submitted",
        assignment_status: "submitted",
        assignment_submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", stage.id);

    window.location.reload();
  }

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-sm uppercase tracking-[0.35em] text-zinc-500">
          Worker Workspace
        </p>

        <h1 className="text-4xl font-bold">Assignments & Work History</h1>

        <p className="mt-3 max-w-3xl text-zinc-400">
          Paste a valid 24-hour assignment key to activate pending work.
          Submitted work becomes read-only history.
        </p>
      </div>

      <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="mb-2 text-2xl font-semibold">Enter Assignment Key</h2>

        <p className="mb-4 text-sm text-zinc-500">
          Assignment keys are generated by the director and expire after 24
          hours.
        </p>

        <div className="grid grid-cols-[minmax(0,1fr)_180px] gap-3">
          <input
            value={assignmentInput}
            onChange={(event) => setAssignmentInput(event.target.value)}
            placeholder="Paste assignment key..."
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-zinc-500"
          />

          <button
            type="button"
            onClick={activateAssignment}
            disabled={!assignmentInput.trim()}
            className="rounded-xl border border-blue-800 bg-blue-950 px-4 py-3 text-sm text-blue-200 hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Activate
          </button>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Active Assignments</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Upload, delete drafts, and submit activated work here.
            </p>
          </div>

          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-sm text-zinc-400">
            {activeAssignments.length} active
          </span>
        </div>

        {activeAssignments.length === 0 && (
          <EmptyState>No active worker assignments.</EmptyState>
        )}

        <div className="space-y-5">
          {activeAssignments.map(({ project, stage }) => {
            const stageKey = `${project.id}:${stage.id}`;

            return (
              <ActiveAssignmentCard
                key={stageKey}
                project={project}
                stage={stage}
                stages={project.stages}
                assets={assets}
                isUploading={uploadingStageKey === stageKey}
                isSubmitting={submittingStageKey === stageKey}
                onUpload={handleUpload}
                onDelete={handleDelete}
                onSubmit={handleSubmit}
              />
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Past Submissions</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Read-only submitted work grouped by project and stage.
            </p>
          </div>

          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-sm text-zinc-400">
            {submittedAssets.length} records
          </span>
        </div>

        <PastSubmissions projects={projects} assets={submittedAssets} />
      </section>
    </div>
  );
}

function ActiveAssignmentCard({
  project,
  stage,
  stages,
  assets,
  isUploading,
  isSubmitting,
  onUpload,
  onDelete,
  onSubmit,
}: {
  project: Project;
  stage: Stage;
  stages: Stage[];
  assets: Asset[];
  isUploading: boolean;
  isSubmitting: boolean;
  onUpload: (project: Project, stage: Stage, file: File) => void;
  onDelete: (asset: Asset) => void;
  onSubmit: (project: Project, stage: Stage) => void;
}) {
  const currentAssets = assets.filter(
    (asset) =>
      asset.projectId === project.id &&
      (asset.stageId === stage.id || asset.linkedStage === stage.title)
  );

  const draftAssets = currentAssets.filter((asset) => asset.status === "Draft");

  const stageIndex = stages.findIndex((item) => item.id === stage.id);

  const previousStageTitles = stages
    .slice(0, Math.max(stageIndex, 0))
    .map((item) => item.title);

  const referenceAssets = assets.filter(
    (asset) =>
      asset.projectId === project.id &&
      asset.status === "Approved" &&
      previousStageTitles.includes(asset.linkedStage)
  );

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    onUpload(project, stage, file);

    event.target.value = "";
  }

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
      <div className="mb-6 flex items-start justify-between gap-6">
        <div>
          <p className="mb-2 text-sm text-zinc-500">{project.title}</p>

          <h3 className="text-2xl font-bold">{stage.title}</h3>

          <p className="mt-2 max-w-3xl text-zinc-400">{stage.taskBrief}</p>

          {stage.assignmentKeyExpiresAt && (
            <p className="mt-2 text-xs text-zinc-600">
              Key expires:{" "}
              {new Date(stage.assignmentKeyExpiresAt).toLocaleString()}
            </p>
          )}
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-sm ${statusStyle(
            stage.status
          )}`}
        >
          {stage.status}
        </span>
      </div>

      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="mb-3 text-sm font-medium text-zinc-300">
          Read-only Reference Assets
        </p>

        {referenceAssets.length === 0 && (
          <EmptyState>No previous approved assets available.</EmptyState>
        )}

        <div className="space-y-3">
          {referenceAssets.map((asset) => (
            <AssetRecord key={asset.id ?? asset.name} asset={asset} readOnly />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-300">Draft Uploads</p>

          <span className="text-xs text-zinc-500">{draftAssets.length}</span>
        </div>

        <label className="mb-4 flex cursor-pointer items-center justify-center rounded-xl border border-zinc-700 bg-black px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800">
          {isUploading ? "Uploading..." : "Upload Asset"}

          <input
            type="file"
            className="hidden"
            disabled={isUploading}
            onChange={handleFile}
          />
        </label>

        {draftAssets.length === 0 && (
          <EmptyState>No draft files yet.</EmptyState>
        )}

        <div className="space-y-3">
          {draftAssets.map((asset) => (
            <div key={asset.id ?? asset.name}>
              <AssetRecord asset={asset} />

              <button
                type="button"
                onClick={() => onDelete(asset)}
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
              >
                Delete Draft
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onSubmit(project, stage)}
          disabled={isSubmitting || draftAssets.length === 0}
          className="mt-5 w-full rounded-xl border border-purple-800 bg-purple-950 px-4 py-3 text-sm text-purple-200 hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? "Submitting..." : "Submit Assignment"}
        </button>
      </div>
    </div>
  );
}

function PastSubmissions({
  projects,
  assets,
}: {
  projects: Project[];
  assets: Asset[];
}) {
  const projectGroups = projects
    .map((project) => {
      const stageGroups = project.stages
        .map((stage) => ({
          stage,
          assets: assets.filter(
            (asset) =>
              asset.projectId === project.id &&
              (asset.stageId === stage.id || asset.linkedStage === stage.title)
          ),
        }))
        .filter((item) => item.assets.length > 0);

      return {
        project,
        stageGroups,
      };
    })
    .filter((item) => item.stageGroups.length > 0);

  if (projectGroups.length === 0) {
    return <EmptyState>No submitted work history yet.</EmptyState>;
  }

  return (
    <div className="space-y-5">
      {projectGroups.map(({ project, stageGroups }) => (
        <div
          key={project.id ?? project.title}
          className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
        >
          <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-500">Project Folder</p>

            <h3 className="mt-1 text-2xl font-bold">{project.title}</h3>
          </div>

          <div className="space-y-4">
            {stageGroups.map(({ stage, assets }) => (
              <details
                key={stage.id ?? stage.title}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <summary className="cursor-pointer font-semibold">
                  {stage.title} — {assets.length} file
                  {assets.length === 1 ? "" : "s"}
                </summary>

                <div className="mt-4 space-y-3">
                  {assets.map((asset) => (
                    <AssetRecord
                      key={asset.id ?? asset.name}
                      asset={asset}
                      readOnly
                    />
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AssetRecord({
  asset,
  readOnly,
}: {
  asset: Asset;
  readOnly?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">{asset.name}</p>

          <p className="mt-1 text-xs text-zinc-500">{asset.type}</p>

          <p className="mt-1 text-xs text-zinc-600">
            Uploaded:{" "}
            {asset.createdAt
              ? new Date(asset.createdAt).toLocaleString()
              : "Unknown"}
          </p>

          {readOnly && (
            <p className="mt-1 text-xs text-zinc-600">Read-only record</p>
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
          Open Asset
        </a>
      )}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-500">
      {children}
    </div>
  );
}