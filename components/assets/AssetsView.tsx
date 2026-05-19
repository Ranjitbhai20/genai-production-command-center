import type { Project } from "@/types/pipeline";
import { ProjectHeaderSmall } from "@/components/project/ProjectHeaderSmall";
import { statusStyle } from "@/lib/statusStyle";

export function AssetsView({ project }: { project: Project }) {
  return (
    <div>
      <ProjectHeaderSmall project={project} title="Assets" />
      <div className="grid grid-cols-2 gap-6">
        {project.assets.map((asset) => (
          <div key={asset.name} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <div className="flex items-start justify-between mb-4">
              <div><h2 className="text-xl font-semibold mb-2">{asset.name}</h2><p className="text-zinc-400 text-sm">{asset.type}</p></div>
              <span className={`border rounded-full px-3 py-1 text-xs ${statusStyle(asset.status)}`}>{asset.status}</span>
            </div>
            <p className="text-sm text-zinc-500">Linked Stage</p>
            <p className="font-medium mb-3">{asset.linkedStage}</p>
            <p className="text-sm text-zinc-500">Source</p>
            <p className="font-medium">{asset.source}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
