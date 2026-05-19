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
  return (
    <div>
      <ProjectHeader project={project} />

      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          ["Total Stages", stages.length],
          ["Approved", stages.filter((s) => s.status === "Approved").length],
          ["Submitted", stages.filter((s) => s.status === "Submitted").length],
          ["Needs Revalidation", stages.filter((s) => s.status === "Needs Revalidation").length],
        ].map(([label, value]) => (
          <div key={label} className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <p className="text-zinc-500 text-sm">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 mb-8">
        <p className="text-sm text-zinc-500 mb-2">Project Logic</p>
        <p className="text-zinc-300">Concept unlocks Script. Script unlocks the production floor. Tools, worker assignment, method, manual/API mode, feedback, and version history live inside each stage.</p>
      </div>

      <div className="grid grid-cols-[1fr_420px] gap-6">
        <StageList stages={stages} selectedStageIndex={selectedStageIndex} onSelectStage={onSelectStage} />
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
