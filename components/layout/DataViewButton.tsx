import type { Project } from "@/types/pipeline";

export function DataViewButton({ projects }: { projects: Project[] }) {
  const completed = projects.filter((project) => project.status === "complete");
  const inProduction = projects.filter(
    (project) => project.status === "in_production"
  );
  const drafts = projects.filter((project) => project.status === "draft");

  function openDataView() {
    window.alert(
      [
        "Production Database View",
        "",
        `Total Projects: ${projects.length}`,
        `Drafts: ${drafts.length}`,
        `In Production: ${inProduction.length}`,
        `Completed: ${completed.length}`,
        "",
        "Full analytics dashboard comes later.",
      ].join("\n")
    );
  }

  return (
    <button
      onClick={openDataView}
      className="fixed bottom-6 right-6 z-50 rounded-full border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-medium text-white shadow-2xl transition hover:bg-zinc-800"
    >
      Data View
    </button>
  );
}