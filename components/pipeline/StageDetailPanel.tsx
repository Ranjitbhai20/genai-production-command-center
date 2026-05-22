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

  const selectedStageApproved =
    selectedStage.status === "Approved";

  const projectComplete =
    projectStatus === "complete";

  const stageReadOnly =
    selectedStageBlocked ||
    selectedStageApproved ||
    projectComplete;

  const linkedAssets = assets.filter(
    (asset) => asset.linkedStage === selectedStage.title
  );

  const draftAssets = linkedAssets.filter(
    (asset) => asset.status === "Draft"
  );

  const submittedAssets = linkedAssets.filter(
    (asset) => asset.status === "Submitted"
  );

  const reviewedAssets = linkedAssets.filter(
    (asset) =>
      asset.status !== "Draft" &&
      asset.status !== "Submitted" &&
      asset.status !== "Removed"
  );

  const removedAssets = linkedAssets.filter(
    (asset) => asset.status === "Removed"
  );

  function handleAssetUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file || !onUploadAsset) return;

    onUploadAsset(file);

    event.target.value = "";
  }

  return (
    <aside className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <div className="mb-6">
        <p className="mb-2 text-sm text-zinc-500">
          Director Review Panel
        </p>

        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-2xl font-bold">
            {selectedStage.title}
          </h3>

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
            Production is archived and read-only.
          </Notice>
        )}

        {!projectComplete && selectedStageBlocked && (
          <Notice tone="warning">
            {blockedReason(stages, selectedStageIndex)}
          </Notice>
        )}

        {!projectComplete && selectedStageApproved && (
          <Notice tone="success">
            This stage is approved and locked.
          </Notice>
        )}
      </div>

      <div className="mb-6 rounded-2xl border border-zinc-800 bg-black/30 p-4">
        <p className="mb-3 text-sm text-zinc-500">
          Responsibility
        </p>

        <div className="space-y-3 text-sm">
          <InfoRow
            label="Owner"
            value={selectedStage.owner}
          />

          <InfoRow
            label="Assigned Worker"
            value={selectedStage.assignedWorker}
          />

          <InfoRow
            label="Default Worker"
            value={selectedStage.defaultWorker}
          />

          <InfoRow
            label="Approval Authority"
            value={selectedStage.approvalAuthority}
          />

          <InfoRow
            label="Access Level"
            value={selectedStage.accessLevel}
          />
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-2 text-sm text-zinc-500">
          Task Brief
        </p>

        <p className="leading-relaxed text-zinc-300">
          {selectedStage.taskBrief}
        </p>
      </div>

      {selectedStage.notes && (
        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="mb-2 text-sm text-zinc-500">
            Latest Decision Note
          </p>

          <p className="text-sm leading-relaxed text-zinc-300">
            {selectedStage.notes}
          </p>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-zinc-800 bg-black/30 p-4">
        <p className="mb-2 text-sm text-zinc-500">
          Production Note
        </p>

        <textarea
          value={feedbackText}
          onChange={(event) =>
            onFeedbackChange(event.target.value)
          }
          disabled={stageReadOnly}
          placeholder={
            projectComplete
              ? "Production archived."
              : stageReadOnly
              ? "Stage locked."
              : "Add review notes or revision context..."
          }
          className="min-h-24 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
        />

        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Optional for approval. Recommended for revision
          tracking and production memory.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-zinc-800 bg-black/30 p-4">
        <p className="mb-3 text-sm text-zinc-500">
          Stage Actions
        </p>

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
            Approve Stage
          </button>

          <button
            onClick={onRejectLatestVersion}
            disabled={stageReadOnly}
            className="rounded-xl border border-red-800 bg-red-950 p-3 text-red-200 hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Request Revision
          </button>
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Assets
          </p>

          <span className="text-xs text-zinc-600">
            {linkedAssets.length} linked
          </span>
        </div>

        {onUploadAsset && (
          <label
            className={`mb-4 flex cursor-pointer items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 ${
              stageReadOnly || isUploadingAsset
                ? "pointer-events-none cursor-not-allowed opacity-40"
                : ""
            }`}
          >
            {isUploadingAsset
              ? "Uploading..."
              : "Upload Draft Asset"}

            <input
              type="file"
              className="hidden"
              disabled={
                stageReadOnly || isUploadingAsset
              }
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
          title="Review History"
          emptyText="No review history."
          assets={reviewedAssets}
          isUpdatingAsset={isUpdatingAsset}
          onResubmitAsset={onResubmitAsset}
        />

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
  onResubmitAsset,
  onWithdrawAsset,
  onDeleteDraftAsset,
}: any) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-300">
          {title}
        </p>

        <span className="text-xs text-zinc-600">
          {assets.length}
        </span>
      </div>

      {assets.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-500">
          {emptyText}
        </div>
      )}

      {assets.length > 0 && (
        <div className="space-y-3">
          {assets.map((asset: Asset) => (
            <AssetCard
              key={asset.id ?? asset.name}
              asset={asset}
              isUpdatingAsset={isUpdatingAsset}
              onApproveAsset={onApproveAsset}
              onRejectAsset={onRejectAsset}
              onResubmitAsset={onResubmitAsset}
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
  onResubmitAsset,
  onWithdrawAsset,
  onDeleteDraftAsset,
}: any) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">{asset.name}</p>

          <p className="mt-1 text-xs text-zinc-500">
            {asset.type}
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
          {asset.status === "Draft" &&
            onDeleteDraftAsset && (
              <button
                onClick={() =>
                  onDeleteDraftAsset(asset)
                }
                disabled={isUpdatingAsset}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Delete Draft Upload
              </button>
            )}

          {asset.status === "Submitted" &&
            onApproveAsset && (
              <button
                onClick={() =>
                  onApproveAsset(asset.id!)
                }
                disabled={isUpdatingAsset}
                className="rounded-lg border border-green-800 bg-green-950 px-3 py-2 text-xs text-green-200 hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Approve Asset
              </button>
            )}

          {asset.status === "Submitted" &&
            onRejectAsset && (
              <button
                onClick={() =>
                  onRejectAsset(asset.id!)
                }
                disabled={isUpdatingAsset}
                className="rounded-lg border border-red-800 bg-red-950 px-3 py-2 text-xs text-red-200 hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reject Asset
              </button>
            )}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
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
    neutral:
      "border-zinc-700 bg-zinc-900 text-zinc-300",

    warning:
      "border-yellow-800 bg-yellow-950 text-yellow-200",

    success:
      "border-green-800 bg-green-950 text-green-200",
  };

  return (
    <div
      className={`mb-5 rounded-xl border p-4 text-sm ${classes[tone]}`}
    >
      {children}
    </div>
  );
}