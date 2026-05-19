import type { Project } from "@/types/pipeline";

export function ProjectHeaderSmall({ project, title }: { project: Project; title: string }) {
  return (
    <div className="mb-8">
      <p className="text-sm text-zinc-500 mb-2">{project.title}</p>
      <h1 className="text-4xl font-bold mb-3">{title}</h1>
      <p className="text-zinc-400">Project-scoped {title.toLowerCase()} for {project.format}.</p>
    </div>
  );
}
