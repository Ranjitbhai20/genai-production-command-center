import type { Project } from "@/types/pipeline";

export function ProjectHeader({ project }: { project: Project }) {
  return (
    <div className="mb-10">
      <p className="text-sm text-zinc-500 mb-2">Current Project</p>

      <h2 className="text-5xl font-bold mb-4">
        {project.title}
      </h2>

      <p className="text-zinc-400 max-w-3xl">
        {project.description}
      </p>
    </div>
  );
}