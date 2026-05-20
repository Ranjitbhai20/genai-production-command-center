import type { Project, ProjectTab } from "@/types/pipeline";

type SidebarProps = {
  projects: Project[];
  selectedProjectIndex: number;
  activeProjectTab: ProjectTab;
  onSwitchProject: (index: number) => void;
  onSetTab: (tab: ProjectTab) => void;
  onCreateProject: () => void;
};

export function Sidebar({
  projects,
  selectedProjectIndex,
  activeProjectTab,
  onSwitchProject,
  onSetTab,
  onCreateProject,
}: SidebarProps) {
  const project =
    selectedProjectIndex >= 0 && selectedProjectIndex < projects.length
      ? projects[selectedProjectIndex]
      : null;

  const productionUnlocked = project?.status !== "draft";

  return (
    <aside className="w-80 border-r border-zinc-800 p-6">
      <h1 className="mb-8 text-3xl font-bold">GenAI Command</h1>

      <div className="mb-8">
        <p className="mb-3 text-xs uppercase tracking-wide text-zinc-500">
          Productions
        </p>

        <div className="space-y-3">
          {projects.map((item, index) => (
            <button
              key={item.id ?? `${item.title}-${index}`}
              onClick={() => onSwitchProject(index)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                selectedProjectIndex === index
                  ? "border-zinc-700 bg-zinc-900 text-white"
                  : "border-transparent text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              <p className="font-semibold">{item.title}</p>

              <p className="mt-1 text-xs text-zinc-500">
                {item.status === "draft"
                  ? "Brief draft"
                  : item.description || "Production initialized"}
              </p>
            </button>
          ))}

          <button
            onClick={onCreateProject}
            className="w-full rounded-xl border border-dashed border-zinc-700 bg-black px-4 py-3 text-left text-zinc-400 transition hover:border-zinc-500 hover:bg-zinc-900"
          >
            <p className="font-semibold">+ New Production</p>

            <p className="mt-1 text-xs text-zinc-500">
              Start with project name and concept brief
            </p>
          </button>
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-6">
        <p className="mb-3 text-xs uppercase tracking-wide text-zinc-500">
          {project?.title ?? "No Production"}
        </p>

        <nav className="space-y-3">
          <TabButton
            label="Brief"
            tab="brief"
            activeTab={activeProjectTab}
            onSetTab={onSetTab}
          />

          <TabButton
            label="Pipeline"
            tab="pipeline"
            activeTab={activeProjectTab}
            onSetTab={onSetTab}
            disabled={!productionUnlocked}
          />

          <TabButton
            label="Assets"
            tab="assets"
            activeTab={activeProjectTab}
            onSetTab={onSetTab}
            disabled={!productionUnlocked}
          />

          <TabButton
            label="Approvals"
            tab="approvals"
            activeTab={activeProjectTab}
            onSetTab={onSetTab}
            disabled={!productionUnlocked}
          />

          <TabButton
            label="Final Handoff"
            tab="handoff"
            activeTab={activeProjectTab}
            onSetTab={onSetTab}
            disabled={!productionUnlocked}
          />
        </nav>

        {!productionUnlocked && project && (
          <p className="mt-4 rounded-xl border border-yellow-900 bg-yellow-950/40 p-3 text-xs text-yellow-300">
            Pipeline unlocks after the concept brief is approved.
          </p>
        )}
      </div>
    </aside>
  );
}

function TabButton({
  label,
  tab,
  activeTab,
  onSetTab,
  disabled = false,
}: {
  label: string;
  tab: ProjectTab;
  activeTab: ProjectTab;
  onSetTab: (tab: ProjectTab) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => onSetTab(tab)}
      disabled={disabled}
      className={`w-full rounded-xl px-4 py-3 text-left transition ${
        activeTab === tab
          ? "bg-zinc-800 text-white"
          : "text-zinc-400 hover:bg-zinc-900"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {label}
    </button>
  );
}