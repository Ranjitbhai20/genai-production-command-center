"use client";

import type { Project } from "@/types/pipeline";

type WorkerAccessButtonProps = {
  project: Project | null;
  selectedStageIndex: number;
  onOpenWorkerWorkspace: () => void;
};

export function WorkerAccessButton({
  project,
  selectedStageIndex,
  onOpenWorkerWorkspace,
}: WorkerAccessButtonProps) {
  const selectedStage = project?.stages?.[selectedStageIndex];

  function copyWorkerLink() {
    if (!project?.id || !selectedStage?.id) {
      window.alert("Select a saved project stage first.");
      return;
    }

    const link = `${window.location.origin}/worker/${project.id}/${selectedStage.id}`;
    navigator.clipboard.writeText(link);
    window.alert(`Worker assignment link copied:\n\n${link}`);
  }

  return (
    <div className="fixed bottom-6 right-32 z-50 flex gap-3">
      <button
        onClick={copyWorkerLink}
        className="rounded-full border border-zinc-700 bg-zinc-950 px-5 py-3 text-sm text-zinc-200 shadow-xl hover:bg-zinc-800"
      >
        Copy Worker Link
      </button>

      <button
        onClick={onOpenWorkerWorkspace}
        className="rounded-full border border-blue-700 bg-blue-950 px-5 py-3 text-sm text-blue-200 shadow-xl hover:bg-blue-900"
      >
        Worker View
      </button>
    </div>
  );
}