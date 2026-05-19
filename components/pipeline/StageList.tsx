import type { Stage } from "@/types/pipeline";
import { statusStyle } from "@/lib/statusStyle";
import { blockedReason, isStageBlocked } from "@/lib/pipelineLogic";

export function StageList({ stages, selectedStageIndex, onSelectStage }: { stages: Stage[]; selectedStageIndex: number; onSelectStage: (index: number) => void }) {
  return (
    <div>
      <h3 className="text-2xl font-semibold mb-4">Production Pipeline</h3>
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const blocked = isStageBlocked(stages, index);
          return (
            <button key={stage.title} onClick={() => onSelectStage(index)} className={`w-full text-left bg-zinc-900 border rounded-2xl p-5 transition hover:border-zinc-500 ${selectedStageIndex === index ? "border-white" : "border-zinc-800"} ${blocked ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-zinc-500 text-sm mb-1">Stage {index + 1}</p>
                  <h4 className="text-xl font-semibold mb-2">{stage.title}</h4>
                  <p className="text-zinc-400 max-w-2xl">{stage.description}</p>
                  <p className="text-sm text-zinc-500 mt-3">Method: {stage.method}</p>
                  <p className="text-sm text-zinc-500 mt-1">Tool: {stage.tool}</p>
                  {blocked && <p className="text-yellow-300 text-sm mt-3">{blockedReason(stages, index)}</p>}
                </div>
                <div className="text-right min-w-56">
                  <span className={`inline-block border rounded-full px-3 py-1 text-sm mb-3 ${statusStyle(stage.status)}`}>{stage.status}</span>
                  <p className="text-sm text-zinc-500">Owner</p>
                  <p className="font-semibold mb-2">{stage.owner}</p>
                  <p className="text-sm text-zinc-500">Approval</p>
                  <p className="font-semibold">{stage.approvalAuthority}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
