import type { Asset, Stage } from "@/types/pipeline";
import { statusStyle } from "@/lib/statusStyle";
import { blockedReason, isStageBlocked } from "@/lib/pipelineLogic";

export function StageDetailPanel({
  projectStatus,
  stages,
  selectedStageIndex,
  assets,
  feedbackText,
  isUploadingAsset,
  isUpdatingAsset,
  onFeedbackChange,
  onApproveStage,
  onRejectLatestVersion,
  onUploadAsset,
  onApproveAsset,
  onRejectAsset,
  onWithdrawAsset,
  onDeleteDraftAsset,
}: {
  projectStatus?: "draft" | "in_production" | "complete";
  stages: Stage[];
  selectedStageIndex: number;
  assets: Asset[];
  feedbackText: string;
  isUploadingAsset?: boolean;
  isUpdatingAsset?: boolean;
  onFeedbackChange: (value: string) => void;
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

  const directorControlled = selectedStage.owner === "Project Owner";
  const workerControlled = !directorControlled;
  const handledBy = directorControlled ? "Project Owner" : "Worker";

  const stageLocked =
    selectedStageBlocked || selectedStageApproved || projectComplete;

  const canApproveStage = !stageLocked;
  const canRejectAndTakeOver = !stageLocked && workerControlled;
  const canUploadAsset = !stageLocked && Boolean(onUploadAsset);

  const linkedAssets = assets.filter(
    (asset) => asset.linkedStage === selectedStage.title
  );

  const draftAssets = linkedAssets.filter((asset) => asset.status === "Draft");

  const submittedAssets = linkedAssets.filter(
    (asset) => asset.status === "Submitted"
  );

  const approvedAssets = linkedAssets.filter(
    (asset) => asset.status === "Approved"
  );

  const rejectedAssets = linkedAssets.filter(
    (asset) => asset.status === "Rejected"
  );

  const withdrawnAssets = linkedAssets.filter(
    (asset) => asset.status === "Withdrawn"
  );

  const removedAssets = linkedAssets.filter(
    (asset) => asset.status === "Removed"
  );

  function handleAssetUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !onUploadAsset) return;

    onUploadAsset(file);
    event.target.value = "";
  }

  function handleRejectAndTakeOver() {
    const confirmed = window.confirm(
      "Reject this worker handoff and return the stage to director control?"
    );

    if (!confirmed) return;

    onRejectLatestVersion();
  }

  return (
    <aside className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 pb-40">
      <div className="mb-6">
        <p className="mb-2 text-sm text-zinc-500">Director Review Panel</p>

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
          <Notice tone="neutral">Production is archived and read-only.</Notice>
        )}

        {!projectComplete && selectedStageBlocked && (
          <Notice tone="warning">
            {blockedReason(stages, selectedStageIndex)}
          </Notice>
        )}

        {!projectComplete && selectedStageApproved && (
          <Notice tone="success">This stage is approved and locked.</Notice>
        )}

        {!stageLocked && directorControlled && (
          <Notice tone="neutral">
            Director-controlled stage. You can approve it directly or assign it
            to a worker.
          </Notice>
        )}

        {!stageLocked && workerControlled && (
          <Notice tone="neutral">
            Worker-controlled stage. You can approve the stage, review submitted
            assets, or reject the handoff and take control.
          </Notice>
        )}
      </div>

      <div className="mb-6 rounded-2xl border border-zinc-800 bg-black/30 p-4">
        <p className="mb-3 text-sm text-zinc-500">Responsibility</p>

        <div className="space-y-3 text-sm">
          <InfoRow label="Handled By" value={handledBy} />
          <InfoRow label="Access Level" value={selectedStage.accessLevel} />
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-2 text-sm text-zinc-500">Task Brief</p>

        <p className="leading-relaxed text-zinc-300">
          {selectedStage.taskBrief}
        </p>
      </div>

      {selectedStage.notes && (
        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="mb-2 text-sm text-zinc-500">Latest Decision Note</p>

          <p className="text-sm leading-relaxed text-zinc-300">
            {selectedStage.notes}
          </p>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-zinc-800 bg-black/30 p-4">
        <p className="mb-2 text-sm text-zinc-500">Production Note</p>

        <textarea
          value={feedbackText}
          onChange={(event) => onFeedbackChange(event.target.value)}
          disabled={stageLocked}
          placeholder={
            projectComplete
              ? "Production archived."
              : stageLocked
                ? "Stage locked."
                : "Add review notes or approval context..."
          }
          className="min-h-24 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
        />

        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Optional for approval. Recommended for review tracking and production
          memory.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-zinc-800 bg-black/30 p-4">
        <p className="mb-3 text-sm text-zinc-500">Director Review Actions</p>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={onApproveStage}
            disabled={!canApproveStage}
            className="rounded-xl border border-green-800 bg-green-950 p-3 text-green-200 hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Approve Stage
          </button>

          <button
            onClick={handleRejectAndTakeOver}
            disabled={!canRejectAndTakeOver}
            className="rounded-xl border border-red-800 bg-red-950 p-3 text-red-200 hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reject + Take Over
          </button>
        </div>

        {directorControlled && (
          <p className="mt-3 text-xs text-zinc-500">
            Rejection controls activate after this stage is assigned to a
            worker.
          </p>
        )}
      </div>

      <div className="border-t border-zinc-800 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-zinc-500">Assets</p>

          <span className="text-xs text-zinc-600">
            {linkedAssets.length} linked
          </span>
        </div>

        {onUploadAsset && (
          <label
            className={`mb-4 flex cursor-pointer items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 ${
              !canUploadAsset || isUploadingAsset
                ? "pointer-events-none cursor-not-allowed opacity-40"
                : ""
            }`}
          >
            {isUploadingAsset ? "Uploading..." : "Upload Draft Asset"}

            <input
              type="file"
              className="hidden"
              disabled={!canUploadAsset || isUploadingAsset}
              onChange={handleAssetUpload}
            />
          </label>
        )}

        <AssetSection
          title="Draft Uploads"
          emptyText="No draft uploads."
          assets={draftAssets}
          isUpdatingAsset={isUpdatingAsset}
          onDeleteDraftAsset={onDeleteDraftAsset}
        />

        <AssetSection
          title="Submitted Review Queue"
          emptyText="No submitted assets."
          assets={submittedAssets}
          isUpdatingAsset={isUpdatingAsset}
          onApproveAsset={onApproveAsset}
          onRejectAsset={onRejectAsset}
          onWithdrawAsset={onWithdrawAsset}
        />

        <AssetSection
          title="Approved Assets"
          emptyText="No approved assets."
          assets={approvedAssets}
          isUpdatingAsset={isUpdatingAsset}
        />

        <AssetSection
          title="Rejected Assets"
          emptyText="No rejected assets."
          assets={rejectedAssets}
          isUpdatingAsset={isUpdatingAsset}
        />

        {withdrawnAssets.length > 0 && (
          <AssetSection
            title="Withdrawn Assets"
            emptyText="No withdrawn assets."
            assets={withdrawnAssets}
            isUpdatingAsset={isUpdatingAsset}
          />
        )}

        {removedAssets.length > 0 && (
          <AssetSection
            title="Removed Records"
            emptyText="No removed records."
            assets={removedAssets}
            isUpdatingAsset={isUpdatingAsset}
          />
        )}
      </div>
    </aside>
  );
}

function AssetSection({
  title,
  emptyText,
  assets,
  isUpdatingAsset,
  onApproveAsset,
  onRejectAsset,
  onWithdrawAsset,
  onDeleteDraftAsset,
}: {
  title: string;
  emptyText: string;
  assets: Asset[];
  isUpdatingAsset?: boolean;
  onApproveAsset?: (assetId: string) => void;
  onRejectAsset?: (assetId: string) => void;
  onWithdrawAsset?: (assetId: string) => void;
  onDeleteDraftAsset?: (asset: Asset) => void;
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-300">{title}</p>

        <span className="text-xs text-zinc-600">{assets.length}</span>
      </div>

      {assets.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-500">
          {emptyText}
        </div>
      )}

      {assets.length > 0 && (
        <div className="space-y-3">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id ?? asset.name}
              asset={asset}
              isUpdatingAsset={isUpdatingAsset}
              onApproveAsset={onApproveAsset}
              onRejectAsset={onRejectAsset}
              onWithdrawAsset={onWithdrawAsset}
              onDeleteDraftAsset={onDeleteDraftAsset}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AssetCard({
  asset,
  isUpdatingAsset,
  onApproveAsset,
  onRejectAsset,
  onWithdrawAsset,
  onDeleteDraftAsset,
}: {
  asset: Asset;
  isUpdatingAsset?: boolean;
  onApproveAsset?: (assetId: string) => void;
  onRejectAsset?: (assetId: string) => void;
  onWithdrawAsset?: (assetId: string) => void;
  onDeleteDraftAsset?: (asset: Asset) => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
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

      {asset.id && (
        <div className="mt-3 grid grid-cols-1 gap-2">
          {asset.status === "Draft" && onDeleteDraftAsset && (
            <button
              onClick={() => onDeleteDraftAsset(asset)}
              disabled={isUpdatingAsset}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete Draft Upload
            </button>
          )}

          {asset.status === "Submitted" && onApproveAsset && (
            <button
              onClick={() => onApproveAsset(asset.id!)}
              disabled={isUpdatingAsset}
              className="rounded-lg border border-green-800 bg-green-950 px-3 py-2 text-xs text-green-200 hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Approve Asset
            </button>
          )}

          {asset.status === "Submitted" && onRejectAsset && (
            <button
              onClick={() => onRejectAsset(asset.id!)}
              disabled={isUpdatingAsset}
              className="rounded-lg border border-red-800 bg-red-950 px-3 py-2 text-xs text-red-200 hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reject Asset
            </button>
          )}

          {asset.status === "Submitted" && onWithdrawAsset && (
            <button
              onClick={() => onWithdrawAsset(asset.id!)}
              disabled={isUpdatingAsset}
              className="rounded-lg border border-yellow-800 bg-yellow-950 px-3 py-2 text-xs text-yellow-200 hover:bg-yellow-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Withdraw Asset
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-zinc-500">{label}</span>

      <span className="max-w-[55%] text-right font-medium text-zinc-200">
        {value || "—"}
      </span>
    </div>
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