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
  onSelectStage,
  onFeedbackChange,
  onTakeDirectorControl,
  onAssignBackToWorker,
  onSubmitNewVersion,
  onApproveStage,
  onRejectLatestVersion,
}: {
  project: Project;
  stages: Stage[];
  assets: Asset[];
  selectedStageIndex: number;
  feedbackText: string;
  onSelectStage: (index: number) => void;
  onFeedbackChange: (value: string) => void;
  onTakeDirectorControl: () => void;
  onAssignBackToWorker: () => void;
  onSubmitNewVersion: () => void;
  onApproveStage: () => void;
  onRejectLatestVersion: () => void;
}) {
  const approvedCount = stages.filter(
    (stage) => stage.status === "Approved"
  ).length;

  const submittedCount = stages.filter(
    (stage) => stage.status === "Submitted"
  ).length;

  const revalidationCount = stages.filter(
    (stage) => stage.status === "Needs Revalidation"
  ).length;

  const archived = project.status === "complete";

  return (
    <div>
      <ProjectHeader project={project} />

      {archived && (
        <div className="mb-8 rounded-2xl border border-zinc-700 bg-zinc-900 p-5">
          <p className="text-sm font-semibold text-white">
            Production Archived
          </p>
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

      <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="mb-2 text-sm text-zinc-500">Production Logic</p>
        <p className="text-zinc-300">
          Brief approval unlocks the pipeline. Script approval unlocks the
          production floor. Stage submissions, approvals, rejections, and final
          handoff are preserved as production memory.
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-6">
        <StageList
          stages={stages}
          selectedStageIndex={selectedStageIndex}
          onSelectStage={onSelectStage}
        />

        <StageDetailPanel
          projectStatus={project.status}
          stages={stages}
          selectedStageIndex={selectedStageIndex}
          assets={assets}
          feedbackText={feedbackText}
          onFeedbackChange={onFeedbackChange}
          onTakeDirectorControl={onTakeDirectorControl}
          onAssignBackToWorker={onAssignBackToWorker}
          onSubmitNewVersion={onSubmitNewVersion}
          onApproveStage={onApproveStage}
          onRejectLatestVersion={onRejectLatestVersion}
        />
      </div>
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