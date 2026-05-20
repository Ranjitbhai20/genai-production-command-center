import type { Asset, Stage } from "@/types/pipeline";
import { statusStyle } from "@/lib/statusStyle";
import { blockedReason, isStageBlocked } from "@/lib/pipelineLogic";

export function StageDetailPanel({
  projectStatus,
  stages,
  selectedStageIndex,
  assets,
  feedbackText,
  onFeedbackChange,
  onSubmitNewVersion,
  onApproveStage,
  onRejectLatestVersion,
}: {
  projectStatus?: "draft" | "in_production" | "complete";
  stages: Stage[];
  selectedStageIndex: number;
  assets: Asset[];
  feedbackText: string;
  onFeedbackChange: (value: string) => void;
  onTakeDirectorControl?: () => void;
  onAssignBackToWorker?: () => void;
  onSubmitNewVersion: () => void;
  onApproveStage: () => void;
  onRejectLatestVersion: () => void;
}) {
  const selectedStage = stages[selectedStageIndex];

  if (!selectedStage) {
    return (
      <aside className="sticky top-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <p className="text-sm text-zinc-500">No stage selected.</p>
      </aside>
    );
  }

  const selectedStageBlocked = isStageBlocked(stages, selectedStageIndex);
  const selectedStageApproved = selectedStage.status === "Approved";
  const projectComplete = projectStatus === "complete";

  const stageReadOnly =
    selectedStageBlocked || selectedStageApproved || projectComplete;

  const linkedAssets = assets.filter(
    (asset) => asset.linkedStage === selectedStage.title
  );

  return (
    <aside className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <div className="mb-6">
        <p className="mb-2 text-sm text-zinc-500">Selected Stage</p>

        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-2xl font-bold">{selectedStage.title}</h3>

          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-sm ${statusStyle(
              selectedStage.status
            )}`}
          >
            {selectedStage.status}
          </span>
        </div>

        {projectComplete && (
          <Notice tone="neutral">
            Production is complete. This pipeline is archived and read-only.
          </Notice>
        )}

        {!projectComplete && selectedStageBlocked && (
          <Notice tone="warning">
            {blockedReason(stages, selectedStageIndex)}
          </Notice>
        )}

        {!projectComplete && selectedStageApproved && (
          <Notice tone="success">
            This stage is approved and locked from further changes.
          </Notice>
        )}
      </div>

      <div className="mb-6">
        <p className="mb-2 text-sm text-zinc-500">Task Brief</p>
        <p className="leading-relaxed text-zinc-300">
          {selectedStage.taskBrief}
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-zinc-800 bg-black/30 p-4">
        <p className="mb-3 text-sm text-zinc-500">Actions</p>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={onSubmitNewVersion}
            disabled={stageReadOnly}
            className="rounded-xl border border-purple-800 bg-purple-950 p-3 text-purple-200 hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Submit Version
          </button>

          <button
            onClick={onApproveStage}
            disabled={stageReadOnly}
            className="rounded-xl border border-green-800 bg-green-950 p-3 text-green-200 hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Approve
          </button>

          <button
            onClick={onRejectLatestVersion}
            disabled={stageReadOnly}
            className="rounded-xl border border-red-800 bg-red-950 p-3 text-red-200 hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reject
          </button>
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-2 text-sm text-zinc-500">Feedback Note</p>

        <textarea
          value={feedbackText}
          onChange={(event) => onFeedbackChange(event.target.value)}
          disabled={stageReadOnly}
          placeholder={
            projectComplete
              ? "This production is archived."
              : stageReadOnly
              ? "This stage is locked."
              : "Write approval, rejection, or revision note..."
          }
          className="min-h-24 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="mb-6 border-t border-zinc-800 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-zinc-500">Assets</p>
          <span className="text-xs text-zinc-600">
            {linkedAssets.length} linked
          </span>
        </div>

        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-500">
          Asset upload will connect after stage persistence and Supabase Storage.
        </div>

        {linkedAssets.length > 0 && (
          <div className="mt-3 space-y-3">
            {linkedAssets.map((asset) => (
              <div
                key={asset.name}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{asset.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">{asset.type}</p>
                  </div>

                  <span
                    className={`rounded-full border px-2 py-1 text-xs ${statusStyle(
                      asset.status
                    )}`}
                  >
                    {asset.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <details className="border-t border-zinc-800 pt-5">
        <summary className="cursor-pointer text-sm text-zinc-500">
          Version History
        </summary>

        <div className="mt-4 space-y-3">
          {selectedStage.versions.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-500">
              No versions submitted yet.
            </div>
          )}

          {selectedStage.versions.map((version) => (
            <div
              key={version.label}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="mb-2 flex justify-between">
                <p className="font-semibold">{version.label}</p>

                <span
                  className={`rounded-full border px-2 py-1 text-xs ${statusStyle(
                    version.status
                  )}`}
                >
                  {version.status}
                </span>
              </div>

              <p className="mb-2 text-sm text-zinc-400">
                Submitted by: {version.submittedBy}
              </p>

              <p className="text-sm text-zinc-300">{version.feedback}</p>
            </div>
          ))}
        </div>
      </details>
    </aside>
  );
}

function Notice({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "neutral" | "warning" | "success";
}) {
  const classes = {
    neutral: "border-zinc-700 bg-zinc-900 text-zinc-300",
    warning: "border-yellow-800 bg-yellow-950 text-yellow-200",
    success: "border-green-800 bg-green-950 text-green-200",
  };

  return (
    <div className={`mb-5 rounded-xl border p-4 text-sm ${classes[tone]}`}>
      {children}
    </div>
  );
}