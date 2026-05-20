import type { Asset, Project, ProjectStatus, Stage } from "@/types/pipeline";
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

  const finalHandoffApproved = stages.some(
    (stage) =>
      stage.title === "Final Edit Handoff" && stage.status === "Approved"
  );

  const projectIsArchived =
    project.status === "complete" && finalHandoffApproved;

  const panelProjectStatus: ProjectStatus = projectIsArchived
    ? "complete"
    : project.status === "complete"
    ? "in_production"
    : project.status;

  return (
    <div>
      <ProjectHeader project={project} />

      {project.status === "complete" && !finalHandoffApproved && (
        <div className="mb-8 rounded-2xl border border-yellow-800 bg-yellow-950/40 p-5 text-yellow-200">
          <p className="text-sm font-semibold">Status Mismatch Detected</p>
          <p className="mt-2 text-sm text-yellow-300">
            This project is marked complete in the database, but the final
            handoff stage is not approved in the current stage state. The
            pipeline remains editable until stage persistence is added.
          </p>
        </div>
      )}

      {projectIsArchived && (
        <div className="mb-8 rounded-2xl border border-zinc-700 bg-zinc-900 p-5 text-zinc-300">
          <p className="text-sm font-semibold text-white">
            Production Archived
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Final handoff is complete. The production record is now read-only
            and preserved for database lookup.
          </p>
        </div>
      )}

      <div className="mb-10 grid grid-cols-4 gap-4">
        <MetricCard label="Total Stages" value={stages.length} />
        <MetricCard label="Approved" value={approvedCount} />
        <MetricCard label="Submitted" value={submittedCount} />
        <MetricCard label="Needs Revalidation" value={revalidationCount} />
      </div>

      <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="mb-2 text-sm text-zinc-500">Project Logic</p>
        <p className="text-zinc-300">
          The approved brief initializes production. Script approval unlocks the
          production floor. Worker assignment, asset intake, version history,
          approvals, and final handoff are preserved as production memory.
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_420px] items-start gap-6">
        <StageList
          stages={stages}
          selectedStageIndex={selectedStageIndex}
          onSelectStage={onSelectStage}
        />

        <StageDetailPanel
          projectStatus={panelProjectStatus}
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