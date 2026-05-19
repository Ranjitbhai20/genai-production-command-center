import type { Project } from "@/types/pipeline";
import { ProjectHeaderSmall } from "@/components/project/ProjectHeaderSmall";

export function HandoffView({ project }: { project: Project }) {
  const approvedStages = project.stages.filter((stage) => stage.status === "Approved");

  return (
    <div>
      <ProjectHeaderSmall project={project} title="Final Handoff" />
      <div className="grid grid-cols-[1fr_360px] gap-6">
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h2 className="text-2xl font-semibold mb-4">Editor Package Preview</h2>
          <ul className="text-zinc-400 space-y-2">
            <li>Approved clips</li><li>Real footage plates</li><li>AI stills and generated motion</li><li>Audio / voiceover / SFX notes</li><li>Text overlay and CTA plan</li><li>Director notes</li><li>Prompt and version history</li>
          </ul>
          <button className="mt-6 bg-zinc-800 px-4 py-3 rounded-xl text-sm hover:bg-zinc-700">Prepare Export Package Later</button>
        </div>
        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
          <p className="text-sm text-zinc-500 mb-3">Approved Stages</p>
          <div className="space-y-3">
            {approvedStages.map((stage) => (
              <div key={stage.title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3"><p className="font-semibold">{stage.title}</p><p className="text-sm text-zinc-500">{stage.owner}</p></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
