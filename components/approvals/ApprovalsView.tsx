import type { Project } from "@/types/pipeline";
import { ProjectHeaderSmall } from "@/components/project/ProjectHeaderSmall";
import { blockedReason, isStageBlocked } from "@/lib/pipelineLogic";
import { statusStyle } from "@/lib/statusStyle";

export function ApprovalsView({ project, onOpenStage }: { project: Project; onOpenStage: (index: number) => void }) {
  const reviewStages = project.stages.slice(1);

  return (
    <div>
      <ProjectHeaderSmall project={project} title="Approvals" />
      <div className="space-y-4">
        {reviewStages.map((stage, offsetIndex) => {
          const realIndex = offsetIndex + 1;
          const blocked = isStageBlocked(project.stages, realIndex);
          return (
            <div key={stage.title} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <div className="flex justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-semibold">{stage.title}</h2>
                  <p className="text-zinc-400 mt-2">{stage.notes}</p>
                  {blocked && <p className="text-yellow-300 mt-3 text-sm">{blockedReason(project.stages, realIndex)}</p>}
                  {!blocked && stage.status !== "Approved" && <p className="text-purple-300 mt-3 text-sm">Action available. Open stage to review.</p>}
                  {!blocked && stage.status === "Approved" && <p className="text-green-300 mt-3 text-sm">Approved. No immediate action required.</p>}
                </div>
                <div className="text-right">
                  <span className={`inline-block border rounded-full px-3 py-1 text-sm mb-4 ${statusStyle(stage.status)}`}>{stage.status}</span>
                  <button onClick={() => onOpenStage(realIndex)} className="block bg-zinc-800 px-4 py-2 rounded-xl text-sm hover:bg-zinc-700">Open Stage</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
