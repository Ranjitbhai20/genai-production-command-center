import type { Asset, Stage } from "@/types/pipeline";
import { statusStyle } from "@/lib/statusStyle";
import { blockedReason, isStageBlocked } from "@/lib/pipelineLogic";

export function StageDetailPanel({
  stages,
  selectedStageIndex,
  assets,
  feedbackText,
  onFeedbackChange,
  onTakeDirectorControl,
  onAssignBackToWorker,
  onSubmitNewVersion,
  onApproveStage,
  onRejectLatestVersion,
}: {
  stages: Stage[];
  selectedStageIndex: number;
  assets: Asset[];
  feedbackText: string;
  onFeedbackChange: (value: string) => void;
  onTakeDirectorControl: () => void;
  onAssignBackToWorker: () => void;
  onSubmitNewVersion: () => void;
  onApproveStage: () => void;
  onRejectLatestVersion: () => void;
}) {
  const selectedStage = stages[selectedStageIndex];
  const selectedStageBlocked = isStageBlocked(stages, selectedStageIndex);
  const selectedStageApproved = selectedStage.status === "Approved";
  const stageReadOnly = selectedStageBlocked || selectedStageApproved;
  const ownershipLocked = selectedStageBlocked || selectedStageApproved;

  const linkedAssets = assets.filter(
    (asset) => asset.linkedStage === selectedStage.title
  );

  const currentOwner = selectedStage.owner || "Project Owner";

  const assignedWorker =
    selectedStage.assignedWorker &&
    selectedStage.assignedWorker.toLowerCase() !== "ranjit"
      ? selectedStage.assignedWorker
      : "Not assigned";

  const approvalAuthority =
    selectedStage.approvalAuthority &&
    selectedStage.approvalAuthority.toLowerCase() !== "director"
      ? selectedStage.approvalAuthority
      : "Project Owner";

  return (
    <aside className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <div className="mb-6">
        <p className="mb-2 text-sm text-zinc-500">Selected Stage</p>

        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-2xl font-bold">{selectedStage.title}</h3>

          <span
            className={`inline-block rounded-full border px-3 py-1 text-sm ${statusStyle(
              selectedStage.status
            )}`}
          >
            {selectedStage.status}
          </span>
        </div>

        {selectedStageBlocked && (
          <div className="mb-5 rounded-xl border border-yellow-800 bg-yellow-950 p-4 text-sm text-yellow-200">
            {blockedReason(stages, selectedStageIndex)}
          </div>
        )}

        {selectedStageApproved && (
          <div className="mb-5 rounded-xl border border-green-800 bg-green-950 p-4 text-sm text-green-200">
            This stage is approved and locked from further changes.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <Info label="Current Owner" value={currentOwner} />
          <Info label="Assigned Worker" value={assignedWorker} />
          <Info label="Approval Authority" value={approvalAuthority} />
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-zinc-800 bg-black/30 p-4">
        <p className="mb-3 text-sm text-zinc-500">Stage Actions</p>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={onSubmitNewVersion}
            disabled={stageReadOnly}
            className="rounded-xl border border-purple-800 bg-purple-950 p-3 text-purple-200 hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Submit New Version
          </button>

          <button
            onClick={onApproveStage}
            disabled={stageReadOnly}
            className="rounded-xl border border-green-800 bg-green-950 p-3 text-green-200 hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Approve Latest Version
          </button>

          <button
            onClick={onRejectLatestVersion}
            disabled={stageReadOnly}
            className="rounded-xl border border-red-800 bg-red-950 p-3 text-red-200 hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reject Latest Version
          </button>
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-3 text-sm text-zinc-500">Feedback / Revision Note</p>

        <textarea
          value={feedbackText}
          onChange={(event) => onFeedbackChange(event.target.value)}
          disabled={stageReadOnly}
          placeholder={
            stageReadOnly
              ? "This stage is locked from edits."
              : "Write feedback, revision note, approval note, or submission note..."
          }
          className="min-h-28 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="mb-6 border-t border-zinc-800 pt-5">
        <p className="mb-3 text-sm text-zinc-500">Task Brief</p>
        <p className="leading-relaxed text-zinc-300">
          {selectedStage.taskBrief}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 border-t border-zinc-800 pt-5">
        <Info label="Execution Mode" value={selectedStage.executionMode} />
        <Info label="Access Level" value={selectedStage.accessLevel} />
        <Info label="Tool" value={selectedStage.tool} />
        <Info label="Method" value={selectedStage.method} />
      </div>

      <div className="mb-6 border-t border-zinc-800 pt-5">
        <p className="mb-3 text-sm text-zinc-500">Stage Asset Intake</p>

        <div className="space-y-3">
          <div className="w-full rounded-xl border border-dashed border-zinc-700 bg-zinc-900 p-4 text-left">
            <p className="font-medium">Upload Asset</p>
            <p className="mt-1 text-xs text-zinc-500">
              Backend storage required for real file upload
            </p>
          </div>

          <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left">
            <p className="font-medium">Generate via API Later</p>
            <p className="mt-1 text-xs text-zinc-500">
              Connect Runway, Kling, DALL-E, ElevenLabs, etc. later
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 border-t border-zinc-800 pt-5">
        <p className="mb-3 text-sm text-zinc-500">
          Linked Assets For This Stage
        </p>

        <div className="space-y-3">
          {linkedAssets.map((asset) => (
            <div
              key={asset.name}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{asset.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">{asset.type}</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Source: {asset.source}
                  </p>
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

          {linkedAssets.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-500">
              No assets linked to this stage yet.
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 border-t border-zinc-800 pt-5">
        <p className="mb-3 text-sm text-zinc-500">Version History</p>

        <div className="space-y-3">
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
      </div>

      <div className="border-t border-zinc-800 pt-5">
        <p className="mb-3 text-sm text-zinc-500">Ownership Controls</p>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={onTakeDirectorControl}
            disabled={ownershipLocked}
            className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Project Owner Takeover
          </button>

          <button
            onClick={onAssignBackToWorker}
            disabled={ownershipLocked}
            className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Assign / Reassign Worker
          </button>
        </div>

        {ownershipLocked && (
          <p className="mt-3 text-xs text-zinc-500">
            Ownership controls are disabled while this stage is locked or already
            approved.
          </p>
        )}
      </div>
    </aside>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}