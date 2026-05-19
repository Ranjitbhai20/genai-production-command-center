import type { Project } from "@/types/pipeline";

export function ProjectHeader({ project }: { project: Project }) {
  return (
    <div className="mb-10">
      <p className="text-sm text-zinc-500 mb-2">Current Project</p>
      <h2 className="text-5xl font-bold mb-4">{project.title}</h2>
      <p className="text-zinc-400 max-w-3xl mb-6">{project.description}</p>
      <div className="flex gap-3 text-sm flex-wrap">
        <span className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full">Director: {project.director}</span>
        <span className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full">Format: {project.format}</span>
        <span className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full">Mode: {project.mode}</span>
      </div>
    </div>
  );
}
