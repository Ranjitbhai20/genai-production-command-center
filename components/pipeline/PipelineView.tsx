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
  const approvedCount = stages.filter((stage) => stage.status === "Approved").length;
  const submittedCount = stages.filter((stage) => stage.status === "Submitted").length;
  const revalidationCount = stages.filter(
    (stage) => stage.status === "Needs Revalidation"
  ).length;

  return (
    <div>
      <ProjectHeader project={project} />

      <div className="mb-10 grid grid-cols-4 gap-4">
        <MetricCard label="Total Stages" value={stages.length} />
        <MetricCard label="Approved" value={approvedCount} />
        <MetricCard label="Submitted" value={submittedCount} />
        <MetricCard label="Needs Revalidation" value={revalidationCount} />
      </div>

      <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="mb-2 text-sm text-zinc-500">Project Logic</p>
        <p className="text-zinc-300">
          Concept unlocks Script. Script unlocks the production floor. Tools,
          worker assignment, method, manual/API mode, feedback, and version
          history live inside each stage.
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_420px] items-start gap-6">
        <StageList
          stages={stages}
          selectedStageIndex={selectedStageIndex}
          onSelectStage={onSelectStage}
        />

        <StageDetailPanel
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