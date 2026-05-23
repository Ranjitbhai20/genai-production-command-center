import type { Asset, Project, Stage } from "@/types/pipeline";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { StageList } from "@/components/pipeline/StageList";
import { StageDetailPanel } from "@/components/pipeline/StageDetailPanel";

export function PipelineView({
  project,
  stages,
  assets,
  selectedStageIndex,
  feedbackText,
  isUploadingAsset,
  isUpdatingAsset,
  onSelectStage,
  onFeedbackChange,
  onTakeDirectorControl,
  onAssignBackToWorker,
  onSubmitNewVersion,
  onApproveStage,
  onRejectLatestVersion,
  onUploadAsset,
  onApproveAsset,
  onRejectAsset,
  onResubmitAsset,
  onWithdrawAsset,
  onDeleteDraftAsset,
}: {
  project: Project;
  stages: Stage[];
  assets: Asset[];
  selectedStageIndex: number;
  feedbackText: string;
  isUploadingAsset?: boolean;
  isUpdatingAsset?: boolean;
  onSelectStage: (index: number) => void;
  onFeedbackChange: (value: string) => void;
  onTakeDirectorControl: () => void;
  onAssignBackToWorker: () => void;
  onSubmitNewVersion: () => void;
  onApproveStage: () => void;
  onRejectLatestVersion: () => void;
  onUploadAsset?: (file: File) => void;
  onApproveAsset?: (assetId: string) => void;
  onRejectAsset?: (assetId: string) => void;
  onResubmitAsset?: (assetId: string) => void;
  onWithdrawAsset?: (assetId: string) => void;
  onDeleteDraftAsset?: (asset: Asset) => void;
}) {
  const selectedStage = stages[selectedStageIndex];

  const approvedCount = stages.filter((stage) => stage.status === "Approved").length;
  const submittedCount = stages.filter((stage) => stage.status === "Submitted").length;
  const revalidationCount = stages.filter(
    (stage) => stage.status === "Needs Revalidation"
  ).length;

  const draftAssetCount = assets.filter((asset) => asset.status === "Draft").length;
  const submittedAssetCount = assets.filter(
    (asset) => asset.status === "Submitted"
  ).length;
  const approvedAssetCount = assets.filter(
    (asset) => asset.status === "Approved"
  ).length;
  const rejectedAssetCount = assets.filter(
    (asset) => asset.status === "Rejected"
  ).length;
  const withdrawnAssetCount = assets.filter(
    (asset) => asset.status === "Withdrawn"
  ).length;
  const removedAssetCount = assets.filter(
    (asset) => asset.status === "Removed"
  ).length;

  const archived = project.status === "complete";

  function handleDirectorControl(index: number) {
    onSelectStage(index);
    onTakeDirectorControl();
  }

  function handleAssignToWorker(index: number) {
    onSelectStage(index);
    onAssignBackToWorker();
  }

  return (
    <div>
      <ProjectHeader project={project} />

      {archived && (
        <div className="mb-8 rounded-2xl border border-zinc-700 bg-zinc-900 p-5">
          <p className="text-sm font-semibold text-white">Production Archived</p>
          <p className="mt-2 text-sm text-zinc-400">
            Final handoff is complete. This production is now preserved as a
            read-only database record.
          </p>
        </div>
      )}

      <div className="mb-10 grid grid-cols-4 gap-4">
        <MetricCard label="Stages" value={stages.length} />
        <MetricCard label="Approved" value={approvedCount} />
        <MetricCard label="Submitted" value={submittedCount} />
        <MetricCard label="Revalidation" value={revalidationCount} />
      </div>

      <div className="mb-8 grid grid-cols-4 gap-4">
        <MetricCard label="Assets" value={assets.length} />
        <MetricCard label="Draft Assets" value={draftAssetCount} />
        <MetricCard label="Submitted Assets" value={submittedAssetCount} />
        <MetricCard label="Approved Assets" value={approvedAssetCount} />
      </div>

      {(rejectedAssetCount > 0 ||
        withdrawnAssetCount > 0 ||
        removedAssetCount > 0) && (
        <div className="mb-8 grid grid-cols-3 gap-4">
          <MetricCard label="Rejected Assets" value={rejectedAssetCount} />
          <MetricCard label="Withdrawn Assets" value={withdrawnAssetCount} />
          <MetricCard label="Removed Records" value={removedAssetCount} />
        </div>
      )}

      <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="mb-2 text-sm text-zinc-500">Production Logic</p>
        <p className="text-zinc-300">
          Director controls ownership from the pipeline. Worker assignments
          appear in the Worker Workspace. Review notes, approvals, rejections,
          and submitted assets remain preserved as production memory.
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-6">
        <StageList
          stages={stages}
          selectedStageIndex={selectedStageIndex}
          onSelectStage={onSelectStage}
          onTakeDirectorControl={handleDirectorControl}
          onAssignToWorker={handleAssignToWorker}
        />

        <div className="space-y-5">
          {selectedStage?.assignmentKey &&
            selectedStage.assignmentStatus === "active" && (
              <AssignmentKeyCard stage={selectedStage} />
            )}

          <StageDetailPanel
            projectStatus={project.status}
            stages={stages}
            selectedStageIndex={selectedStageIndex}
            assets={assets}
            feedbackText={feedbackText}
            isUploadingAsset={isUploadingAsset}
            isUpdatingAsset={isUpdatingAsset}
            onFeedbackChange={onFeedbackChange}
            onSubmitNewVersion={onSubmitNewVersion}
            onApproveStage={onApproveStage}
            onRejectLatestVersion={onRejectLatestVersion}
            onUploadAsset={onUploadAsset}
            onApproveAsset={onApproveAsset}
            onRejectAsset={onRejectAsset}
            onResubmitAsset={onResubmitAsset}
            onWithdrawAsset={onWithdrawAsset}
            onDeleteDraftAsset={onDeleteDraftAsset}
          />
        </div>
      </div>
    </div>
  );
}

function AssignmentKeyCard({ stage }: { stage: Stage }) {
  async function copyKey() {
    if (!stage.assignmentKey) return;
    await navigator.clipboard.writeText(stage.assignmentKey);
    window.alert("Assignment key copied.");
  }

  return (
    <div className="rounded-2xl border border-blue-800 bg-blue-950/40 p-5">
      <p className="text-sm font-semibold text-blue-200">
        Worker Assignment Key
      </p>

      <div className="mt-3 flex items-center gap-2">
        <code className="min-w-0 flex-1 rounded-xl border border-blue-900 bg-black px-3 py-2 text-sm text-blue-100">
          {stage.assignmentKey}
        </code>

        <button
          type="button"
          onClick={copyKey}
          className="rounded-xl border border-blue-700 bg-blue-950 px-3 py-2 text-sm text-blue-200 hover:bg-blue-900"
        >
          Copy
        </button>
      </div>

      <p className="mt-3 text-xs text-blue-300/80">
        Expires:{" "}
        {stage.assignmentKeyExpiresAt
          ? new Date(stage.assignmentKeyExpiresAt).toLocaleString()
          : "24 hours after creation"}
      </p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}