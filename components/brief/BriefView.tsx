"use client";

import { useEffect, useState } from "react";
import type {
  AspectRatio,
  Project,
  ProjectBriefInput,
  ProjectType,
  RuntimeTarget,
  VisualStyle,
} from "@/types/pipeline";

const PROJECT_TYPES: ProjectType[] = [
  "Advertisement",
  "Social Media Short",
  "Product Showcase",
  "Music Video",
  "Short Film",
  "Documentary",
  "Tutorial",
  "Hybrid Live Action",
  "Other",
];

const ASPECT_RATIOS: AspectRatio[] = ["9:16", "16:9", "1:1", "4:5", "Other"];

const RUNTIME_TARGETS: RuntimeTarget[] = [
  "<10 sec",
  "10-20 sec",
  "20-40 sec",
  "40-60 sec",
  "1-3 min",
  "3-10 min",
  ">10 min",
];

const VISUAL_STYLES: VisualStyle[] = [
  "AI Generated",
  "Hybrid AI",
  "Live Action",
  "Stylized",
  "Photoreal",
  "Animation",
  "Mixed",
];

export function BriefView({
  project,
  onSaveBrief,
  onApproveBrief,
}: {
  project: Project;
  onSaveBrief: (brief: ProjectBriefInput) => void;
  onApproveBrief: (brief: ProjectBriefInput) => void;
}) {
  const [ownerName, setOwnerName] = useState(project.ownerName);
  const [projectType, setProjectType] = useState<ProjectType>(
    project.projectType
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
    project.aspectRatio
  );
  const [runtimeTarget, setRuntimeTarget] = useState<RuntimeTarget>(
    project.runtimeTarget
  );
  const [visualStyle, setVisualStyle] = useState<VisualStyle>(
    project.visualStyle
  );
  const [conceptSummary, setConceptSummary] = useState(project.conceptSummary);

  useEffect(() => {
    setOwnerName(project.ownerName);
    setProjectType(project.projectType);
    setAspectRatio(project.aspectRatio);
    setRuntimeTarget(project.runtimeTarget);
    setVisualStyle(project.visualStyle);
    setConceptSummary(project.conceptSummary);
  }, [project]);

  const brief: ProjectBriefInput = {
    ownerName,
    projectType,
    aspectRatio,
    runtimeTarget,
    visualStyle,
    conceptSummary,
  };

  const conceptApproved = project.status !== "draft";

  return (
    <div>
      <div className="mb-10">
        <p className="mb-2 text-sm text-zinc-500">Project Foundation</p>

        <h2 className="mb-4 text-5xl font-bold">{project.title}</h2>

        <p className="max-w-3xl text-zinc-400">
          Complete the concept brief to initialize the production database and
          unlock the production pipeline.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <StatusCard label="Lifecycle" value={project.status} />
        <StatusCard label="Aspect Ratio" value={aspectRatio} />
        <StatusCard label="Runtime" value={runtimeTarget} />
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="mb-6 flex items-start justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold">Concept / Brief</h3>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
              This is the production intake layer. Once approved, the project
              moves into production and pipeline stages become active.
            </p>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-sm ${
              conceptApproved
                ? "border-green-800 bg-green-950 text-green-300"
                : "border-yellow-800 bg-yellow-950 text-yellow-300"
            }`}
          >
            {conceptApproved ? "Approved" : "Draft"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <Field label="Owner / Director Name">
            <input
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              disabled={conceptApproved}
              placeholder="Project owner"
              className="Input"
            />
          </Field>

          <Field label="Project Type">
            <select
              value={projectType}
              onChange={(event) =>
                setProjectType(event.target.value as ProjectType)
              }
              disabled={conceptApproved}
              className="Input"
            >
              {PROJECT_TYPES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Field>

          <Field label="Aspect Ratio">
            <select
              value={aspectRatio}
              onChange={(event) =>
                setAspectRatio(event.target.value as AspectRatio)
              }
              disabled={conceptApproved}
              className="Input"
            >
              {ASPECT_RATIOS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Field>

          <Field label="Runtime Target">
            <select
              value={runtimeTarget}
              onChange={(event) =>
                setRuntimeTarget(event.target.value as RuntimeTarget)
              }
              disabled={conceptApproved}
              className="Input"
            >
              {RUNTIME_TARGETS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Field>

          <Field label="Visual Style">
            <select
              value={visualStyle}
              onChange={(event) =>
                setVisualStyle(event.target.value as VisualStyle)
              }
              disabled={conceptApproved}
              className="Input"
            >
              {VISUAL_STYLES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Field>

          <div className="col-span-2">
            <Field label="Concept Summary">
              <textarea
                value={conceptSummary}
                onChange={(event) => setConceptSummary(event.target.value)}
                disabled={conceptApproved}
                placeholder="Write the core creative idea, product/message, target feeling, and production direction."
                className="min-h-32 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </Field>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => onSaveBrief(brief)}
            disabled={conceptApproved}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save Brief Draft
          </button>

          <button
            onClick={() => onApproveBrief(brief)}
            disabled={conceptApproved}
            className="rounded-xl border border-green-800 bg-green-950 px-4 py-3 text-sm font-medium text-green-200 hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Approve Concept & Initialize Production
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <p className="mb-2 text-sm text-zinc-500">{label}</p>
      {children}
    </label>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-bold capitalize">{value}</p>
    </div>
  );
}