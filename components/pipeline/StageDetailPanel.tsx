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
  const linkedAssets = assets.filter((asset) => asset.linkedStage === selectedStage.title);

  return (
    <aside className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 h-fit sticky top-8">
      <p className="text-sm text-zinc-500 mb-2">Selected Stage</p>
      <h3 className="text-2xl font-bold mb-4">{selectedStage.title}</h3>
      <span className={`inline-block border rounded-full px-3 py-1 text-sm mb-6 ${statusStyle(selectedStage.status)}`}>{selectedStage.status}</span>
      {selectedStageBlocked && <div className="bg-yellow-950 border border-yellow-800 text-yellow-200 rounded-xl p-4 mb-6 text-sm">{blockedReason(stages, selectedStageIndex)}</div>}

      <div className="space-y-5">
        <Info label="Current Owner" value={selectedStage.owner} />
        <Info label="Assigned Worker" value={selectedStage.assignedWorker} />
        <Info label="Approval Authority" value={selectedStage.approvalAuthority} />
        <Info label="Execution Mode" value={selectedStage.executionMode} />
        <Info label="Access Level" value={selectedStage.accessLevel} />
        <div><p className="text-sm text-zinc-500">Task Brief</p><p className="text-zinc-300 leading-relaxed">{selectedStage.taskBrief}</p></div>
        <Info label="Tool" value={selectedStage.tool} />
        <Info label="Method" value={selectedStage.method} />

        <div className="border-t border-zinc-800 pt-5">
          <p className="text-sm text-zinc-500 mb-3">Stage Asset Intake</p>
          <div className="space-y-3">
            <div className="w-full bg-zinc-900 border border-dashed border-zinc-700 rounded-xl p-4 text-left"><p className="font-medium">Upload Asset</p><p className="text-xs text-zinc-500 mt-1">Backend storage required for real file upload</p></div>
            <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left"><p className="font-medium">Generate via API Later</p><p className="text-xs text-zinc-500 mt-1">Connect Runway, Kling, DALL-E, ElevenLabs, etc. later</p></div>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-5">
          <p className="text-sm text-zinc-500 mb-3">Linked Assets For This Stage</p>
          <div className="space-y-3">
            {linkedAssets.map((asset) => (
              <div key={asset.name} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="font-medium">{asset.name}</p><p className="text-sm text-zinc-500 mt-1">{asset.type}</p><p className="text-xs text-zinc-600 mt-1">Source: {asset.source}</p></div>
                  <span className={`border rounded-full px-2 py-1 text-xs ${statusStyle(asset.status)}`}>{asset.status}</span>
                </div>
              </div>
            ))}
            {linkedAssets.length === 0 && <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-4 text-sm text-zinc-500">No assets linked to this stage yet.</div>}
          </div>
        </div>

        <div>
          <p className="text-sm text-zinc-500 mb-3">Version History</p>
          <div className="space-y-3">
            {selectedStage.versions.map((version) => (
              <div key={version.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex justify-between mb-2"><p className="font-semibold">{version.label}</p><span className={`border rounded-full px-2 py-1 text-xs ${statusStyle(version.status)}`}>{version.status}</span></div>
                <p className="text-sm text-zinc-400 mb-2">Submitted by: {version.submittedBy}</p>
                <p className="text-sm text-zinc-300">{version.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-zinc-800 pt-5">
        <p className="text-sm text-zinc-500 mb-3">Ownership Controls</p>
        <div className="grid grid-cols-1 gap-3">
          <button onClick={onTakeDirectorControl} className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-zinc-200 hover:bg-zinc-800">Director Takeover</button>
          <button onClick={onAssignBackToWorker} className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-zinc-200 hover:bg-zinc-800">Assign Back to Worker</button>
        </div>
      </div>

      <div className="mt-8 border-t border-zinc-800 pt-5">
        <p className="text-sm text-zinc-500 mb-3">Director / Worker Feedback</p>
        <textarea value={feedbackText} onChange={(event) => onFeedbackChange(event.target.value)} disabled={selectedStageBlocked} placeholder={selectedStageBlocked ? "This stage is blocked by system gate logic." : "Write feedback, revision note, approval note, or submission note..."} className="w-full min-h-28 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none focus:border-zinc-500 disabled:opacity-50" />
      </div>

      <div className="mt-5">
        <p className="text-sm text-zinc-500 mb-3">Director Gate</p>
        <div className="grid grid-cols-1 gap-3">
          <button onClick={onSubmitNewVersion} disabled={selectedStageBlocked} className="bg-purple-950 border border-purple-800 rounded-xl p-3 text-purple-200 hover:bg-purple-900 disabled:opacity-40">Submit New Version</button>
          <button onClick={onApproveStage} disabled={selectedStageBlocked} className="bg-green-950 border border-green-800 rounded-xl p-3 text-green-200 hover:bg-green-900 disabled:opacity-40">Approve Latest Version</button>
          <button onClick={onRejectLatestVersion} disabled={selectedStageBlocked} className="bg-red-950 border border-red-800 rounded-xl p-3 text-red-200 hover:bg-red-900 disabled:opacity-40">Reject Latest Version</button>
        </div>
      </div>
    </aside>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-sm text-zinc-500">{label}</p><p className="font-semibold">{value}</p></div>;
}
