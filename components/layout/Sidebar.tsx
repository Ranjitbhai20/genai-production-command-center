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
    <aside className="w-80 border-r border-zinc-800 bg-black p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">GenAI Command</h1>

        <p className="mt-2 text-sm text-zinc-500">
          Production orchestration system
        </p>
      </div>

      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Productions
          </p>

          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-500">
            {projects.length}
          </span>
        </div>

        <div className="space-y-3">
          {projects.map((item, index) => {
            const selected = selectedProjectIndex === index;

            return (
              <button
                key={item.id ?? `${item.title}-${index}`}
                onClick={() => onSwitchProject(index)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  selected
                    ? "border-zinc-700 bg-zinc-900 text-white"
                    : "border-transparent text-zinc-400 hover:bg-zinc-900"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{item.title}</p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {item.status === "draft"
                        ? "Brief draft"
                        : item.description || "Production initialized"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide ${
                      item.status === "complete"
                        ? "border-green-800 bg-green-950 text-green-200"
                        : item.status === "in_production"
                        ? "border-blue-800 bg-blue-950 text-blue-200"
                        : "border-yellow-800 bg-yellow-950 text-yellow-200"
                    }`}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                </div>
              </button>
            );
          })}

          <button
            onClick={onCreateProject}
            className="w-full rounded-2xl border border-dashed border-zinc-700 bg-black px-4 py-4 text-left text-zinc-400 transition hover:border-zinc-500 hover:bg-zinc-900"
          >
            <p className="font-semibold">+ New Production</p>

            <p className="mt-1 text-xs text-zinc-500">
              Start with project name and concept brief
            </p>
          </button>
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-6">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {project?.title ?? "No Production"}
          </p>

          {project && (
            <p className="mt-2 text-xs leading-relaxed text-zinc-600">
              Director workspace controls production orchestration, approvals,
              asset review, and final handoff.
            </p>
          )}
        </div>

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
          <div className="mt-5 rounded-2xl border border-yellow-900 bg-yellow-950/40 p-4">
            <p className="text-xs leading-relaxed text-yellow-300">
              Production pipeline unlocks after the concept brief is approved.
            </p>
          </div>
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
  const active = activeTab === tab;

  return (
    <button
      onClick={() => onSetTab(tab)}
      disabled={disabled}
      className={`w-full rounded-2xl px-4 py-3 text-left transition ${
        active
          ? "border border-zinc-700 bg-zinc-800 text-white"
          : "border border-transparent text-zinc-400 hover:bg-zinc-900"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <div className="flex items-center justify-between gap-4">
        <span>{label}</span>

        {active && (
          <span className="h-2 w-2 rounded-full bg-white opacity-80" />
        )}
      </div>
    </button>
  );
}