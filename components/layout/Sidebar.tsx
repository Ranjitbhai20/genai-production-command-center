import type { Project, ProjectTab } from "@/types/pipeline";

export function Sidebar({
  projects,
  selectedProjectIndex,
  activeProjectTab,
  onSwitchProject,
  onSetTab,
}: {
  projects: Project[];
  selectedProjectIndex: number;
  activeProjectTab: ProjectTab;
  onSwitchProject: (index: number) => void;
  onSetTab: (tab: ProjectTab) => void;
}) {
  const project = projects[selectedProjectIndex];

  return (
    <aside className="w-80 border-r border-zinc-800 p-6">
      <h1 className="text-3xl font-bold mb-8">GenAI Command</h1>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wide text-zinc-500 mb-3">Projects</p>
        <div className="space-y-3">
          {projects.map((item, index) => (
            <button
              key={item.title}
              onClick={() => onSwitchProject(index)}
              className={`w-full text-left px-4 py-3 rounded-xl transition ${selectedProjectIndex === index ? "bg-zinc-900 text-white border border-zinc-700" : "text-zinc-400 hover:bg-zinc-900 border border-transparent"}`}
            >
              <p className="font-semibold">{item.title}</p>
              <p className="text-xs text-zinc-500 mt-1">{item.format}</p>
            </button>
          ))}
          <div className="w-full text-left px-4 py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-400 bg-black">
            <p className="font-semibold">+ New Project</p>
            <p className="text-xs text-zinc-500 mt-1">Backend required to save new projects</p>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-800 pt-6">
        <p className="text-xs uppercase tracking-wide text-zinc-500 mb-3">{project.title}</p>
        <nav className="space-y-3">
          <TabButton label="Pipeline" tab="pipeline" activeTab={activeProjectTab} onSetTab={onSetTab} />
          <TabButton label="Assets" tab="assets" activeTab={activeProjectTab} onSetTab={onSetTab} />
          <TabButton label="Approvals" tab="approvals" activeTab={activeProjectTab} onSetTab={onSetTab} />
          <TabButton label="Final Handoff" tab="handoff" activeTab={activeProjectTab} onSetTab={onSetTab} />
        </nav>
      </div>
    </aside>
  );
}

function TabButton({ label, tab, activeTab, onSetTab }: { label: string; tab: ProjectTab; activeTab: ProjectTab; onSetTab: (tab: ProjectTab) => void }) {
  return (
    <button
      onClick={() => onSetTab(tab)}
      className={`w-full text-left px-4 py-3 rounded-xl transition ${activeTab === tab ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-900"}`}
    >
      {label}
    </button>
  );
}
