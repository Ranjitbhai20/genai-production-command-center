import type { Stage } from "@/types/pipeline";
import { statusStyle } from "@/lib/statusStyle";
import { blockedReason, isStageBlocked } from "@/lib/pipelineLogic";

export function StageList({
  stages,
  selectedStageIndex,
  onSelectStage,
  onTakeDirectorControl,
  onAssignToWorker,
}: {
  stages: Stage[];
  selectedStageIndex: number;
  onSelectStage: (index: number) => void;
  onTakeDirectorControl?: (index: number) => void;
  onAssignToWorker?: (index: number) => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold">Production Pipeline</h3>

          <p className="mt-1 text-sm text-zinc-500">
            Director controls stage ownership here. Review details appear in the
            right panel.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const blocked = isStageBlocked(stages, index);
          const selected = selectedStageIndex === index;
          const approved = stage.status === "Approved";

          return (
            <div
              key={stage.id ?? stage.title}
              className={`rounded-2xl border bg-zinc-900 p-5 transition ${
                selected ? "border-white" : "border-zinc-800"
              } ${blocked ? "opacity-60" : ""}`}
            >
              <button
                onClick={() => onSelectStage(index)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="mb-1 text-sm text-zinc-500">
                      Stage {index + 1}
                    </p>

                    <h4 className="mb-2 text-xl font-semibold">
                      {stage.title}
                    </h4>

                    <p className="max-w-2xl text-zinc-400">
                      {stage.description}
                    </p>

                    <p className="mt-3 text-sm text-zinc-500">
                      Method: {stage.method}
                    </p>

                    {blocked && (
                      <p className="mt-3 text-sm text-yellow-300">
                        {blockedReason(stages, index)}
                      </p>
                    )}
                  </div>

                  <div className="min-w-56 text-right">
                    <span
                      className={`mb-3 inline-block rounded-full border px-3 py-1 text-sm ${statusStyle(
                        stage.status
                      )}`}
                    >
                      {stage.status}
                    </span>

                    <p className="text-sm text-zinc-500">Owner</p>

                    <p className="mb-2 font-semibold">
                      {stage.owner || "Project Owner"}
                    </p>

                    <p className="text-sm text-zinc-500">Assigned Worker</p>

                    <p className="font-semibold">
                      {stage.assignedWorker || "Not assigned"}
                    </p>
                  </div>
                </div>
              </button>

              <div className="mt-5 grid grid-cols-1 gap-3 border-t border-zinc-800 pt-4 sm:grid-cols-2">
                <button
                  onClick={() => {
                    onSelectStage(index);
                    onTakeDirectorControl?.(index);
                  }}
                  disabled={approved}
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Director Control
                </button>

                <button
                  onClick={() => {
                    onSelectStage(index);
                    onAssignToWorker?.(index);
                  }}
                  disabled={approved}
                  className="rounded-xl border border-blue-800 bg-blue-950 px-4 py-3 text-sm text-blue-200 hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Assign to Worker
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}