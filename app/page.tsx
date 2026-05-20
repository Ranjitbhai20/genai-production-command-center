"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { DataViewButton } from "@/components/layout/DataViewButton";
import { BriefView } from "@/components/brief/BriefView";
import { PipelineView } from "@/components/pipeline/PipelineView";
import { FinalHandoffConfirmModal } from "@/components/pipeline/FinalHandoffConfirmModal";
import { AssetsView } from "@/components/assets/AssetsView";
import { ApprovalsView } from "@/components/approvals/ApprovalsView";
import { HandoffView } from "@/components/handoff/HandoffView";
import { makeStages } from "@/data/initialProjects";
import type { Project, ProjectBriefInput, ProjectTab, Stage } from "@/types/pipeline";
import {
  approveStage as approveStageLogic,
  assignBackToWorker as assignBackToWorkerLogic,
  getFinalHandoffCheck,
  isStageBlocked,
  rejectLatestVersion as rejectLatestVersionLogic,
  submitNewVersion as submitNewVersionLogic,
  takeDirectorControl as takeDirectorControlLogic,
} from "@/lib/pipelineLogic";

function makeProductionStages(): Stage[] {
  return makeStages();
}

function normalizeProjectName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function projectFromRow(row: any): Project {
  return {
    id: row.id,
    title: row.name,
    description: row.description ?? "New GenAI video production project",
    status: row.status ?? "draft",
    ownerName: row.owner_name ?? "",
    projectType: row.project_type ?? "Advertisement",
    aspectRatio: row.aspect_ratio ?? "9:16",
    runtimeTarget: row.runtime_target ?? "10-20 sec",
    visualStyle: row.visual_style ?? "Hybrid AI",
    conceptSummary: row.concept_summary ?? "",
    stages: makeProductionStages(),
    assets: [],
  };
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [activeProjectTab, setActiveProjectTab] =
    useState<ProjectTab>("brief");
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [showFinalHandoffModal, setShowFinalHandoffModal] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  async function loadProjects() {
    setIsLoadingProjects(true);

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load projects:", error);
      setIsLoadingProjects(false);
      return;
    }

    const loadedProjects = (data ?? []).map(projectFromRow);

    setProjects(loadedProjects);
    setSelectedProjectIndex(0);
    setSelectedStageIndex(0);
    setActiveProjectTab("brief");
    setIsLoadingProjects(false);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const project =
    selectedProjectIndex >= 0 && selectedProjectIndex < projects.length
      ? projects[selectedProjectIndex]
      : null;

  const stages = project?.stages ?? [];

  const selectedStage =
    selectedStageIndex >= 0 && selectedStageIndex < stages.length
      ? stages[selectedStageIndex]
      : null;

  const selectedStageBlocked = selectedStage
    ? isStageBlocked(stages, selectedStageIndex)
    : true;

  const finalHandoffCheck = getFinalHandoffCheck(stages);

  function validateProjectName(nextName: string, currentProjectId?: string) {
    const cleanName = normalizeProjectName(nextName);

    if (cleanName.length < 5) {
      window.alert("Project name must be at least 5 characters.");
      return null;
    }

    const duplicate = projects.some(
      (item) =>
        item.id !== currentProjectId &&
        normalizeProjectName(item.title).toLowerCase() ===
          cleanName.toLowerCase()
    );

    if (duplicate) {
      window.alert("A project with this name already exists.");
      return null;
    }

    return cleanName;
  }

  async function createNewProject() {
    const rawName = window.prompt("Enter production name:");

    if (!rawName) return;

    const cleanName = validateProjectName(rawName);

    if (!cleanName) return;

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: cleanName,
        description: "New GenAI video production project",
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create project:", error);
      return;
    }

    const newProject = projectFromRow(data);

    setProjects((currentProjects) => {
      setSelectedProjectIndex(currentProjects.length);
      return [...currentProjects, newProject];
    });

    setSelectedStageIndex(0);
    setActiveProjectTab("brief");
  }

  async function renameCurrentProject() {
    if (!project?.id) {
      console.error("Cannot rename: project has no id", project);
      return;
    }

    const rawName = window.prompt("Production name:", project.title);

    if (!rawName) return;

    const cleanName = validateProjectName(rawName, project.id);

    if (!cleanName) return;

    const { data, error } = await supabase
      .from("projects")
      .update({ name: cleanName })
      .eq("id", project.id)
      .select()
      .single();

    if (error) {
      console.error("Failed to rename project:", error);
      return;
    }

    setProjects((currentProjects) =>
      currentProjects.map((item) =>
        item.id === project.id ? { ...item, title: data.name } : item
      )
    );
  }

  async function deleteCurrentProject() {
    if (!project?.id) {
      console.error("Cannot delete: project has no id", project);
      return;
    }

    const confirmed = window.confirm(
      `Delete "${project.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    if (error) {
      console.error("Failed to delete project:", error);
      return;
    }

    const remainingProjects = projects.filter((item) => item.id !== project.id);

    setProjects(remainingProjects);
    setSelectedProjectIndex(0);
    setSelectedStageIndex(0);
    setActiveProjectTab("brief");
  }

  async function saveBrief(brief: ProjectBriefInput, nextStatus?: Project["status"]) {
    if (!project?.id) return;

    const status = nextStatus ?? project.status;

    const { error } = await supabase
      .from("projects")
      .update({
        owner_name: brief.ownerName,
        project_type: brief.projectType,
        aspect_ratio: brief.aspectRatio,
        runtime_target: brief.runtimeTarget,
        visual_style: brief.visualStyle,
        concept_summary: brief.conceptSummary,
        status,
      })
      .eq("id", project.id);

    if (error) {
      console.error("Failed to save brief:", error);
      return;
    }

    setProjects((currentProjects) =>
      currentProjects.map((item) =>
        item.id === project.id
          ? {
              ...item,
              ...brief,
              status,
              description:
                brief.conceptSummary.trim() ||
                "New GenAI video production project",
            }
          : item
      )
    );
  }

  async function approveBrief(brief: ProjectBriefInput) {
    if (!brief.ownerName.trim()) {
      window.alert("Owner / Director name is required.");
      return;
    }

    if (brief.conceptSummary.trim().length < 20) {
      window.alert("Concept summary must be at least 20 characters.");
      return;
    }

    await saveBrief(brief, "in_production");
    setActiveProjectTab("pipeline");
    setSelectedStageIndex(0);
  }

  async function markProjectComplete() {
    if (!project?.id) return;

    const { error } = await supabase
      .from("projects")
      .update({ status: "complete" })
      .eq("id", project.id);

    if (error) {
      console.error("Failed to mark project complete:", error);
      return;
    }

    setProjects((currentProjects) =>
      currentProjects.map((item) =>
        item.id === project.id ? { ...item, status: "complete" } : item
      )
    );
  }

  function updateCurrentProjectStages(nextStages: Stage[]) {
    setProjects((currentProjects) =>
      currentProjects.map((item, index) =>
        index === selectedProjectIndex ? { ...item, stages: nextStages } : item
      )
    );
  }

  function approveStage() {
    if (!selectedStage || selectedStageBlocked) return;

    if (selectedStage.title === "Final Edit Handoff") {
      setShowFinalHandoffModal(true);
      return;
    }

    updateCurrentProjectStages(
      approveStageLogic(stages, selectedStageIndex, feedbackText)
    );

    setFeedbackText("");
  }

  async function confirmFinalHandoffApproval() {
    if (!selectedStage) return;

    updateCurrentProjectStages(
      approveStageLogic(stages, selectedStageIndex, feedbackText)
    );

    await markProjectComplete();

    setFeedbackText("");
    setShowFinalHandoffModal(false);
  }

  function rejectLatestVersion() {
    if (!selectedStage || selectedStageBlocked) return;

    updateCurrentProjectStages(
      rejectLatestVersionLogic(stages, selectedStageIndex, feedbackText)
    );

    setFeedbackText("");
  }

  function submitNewVersion() {
    if (!selectedStage || selectedStageBlocked) return;

    updateCurrentProjectStages(
      submitNewVersionLogic(stages, selectedStageIndex, feedbackText)
    );

    setFeedbackText("");
  }

  function takeDirectorControl() {
    if (!selectedStage) return;

    updateCurrentProjectStages(
      takeDirectorControlLogic(stages, selectedStageIndex)
    );
  }

  function assignBackToWorker() {
    if (!selectedStage) return;

    updateCurrentProjectStages(
      assignBackToWorkerLogic(stages, selectedStageIndex)
    );
  }

  function openStage(index: number) {
    setSelectedStageIndex(index);
    setActiveProjectTab("pipeline");
  }

  function switchProject(index: number) {
    setSelectedProjectIndex(index);
    setSelectedStageIndex(0);
    setActiveProjectTab("brief");
    setFeedbackText("");
    setShowFinalHandoffModal(false);
  }

  function renderProjectTab() {
    if (!project) return null;

    if (activeProjectTab === "brief") {
      return (
        <BriefView
          project={project}
          onSaveBrief={(brief) => saveBrief(brief)}
          onApproveBrief={approveBrief}
        />
      );
    }

    if (project.status === "draft") {
      return (
        <div className="rounded-2xl border border-yellow-900 bg-yellow-950/30 p-6 text-yellow-200">
          Production pipeline is locked until the concept brief is approved.
        </div>
      );
    }

    if (activeProjectTab === "pipeline") {
      return (
        <PipelineView
          project={project}
          stages={stages}
          assets={project.assets}
          selectedStageIndex={selectedStageIndex}
          feedbackText={feedbackText}
          onSelectStage={setSelectedStageIndex}
          onFeedbackChange={setFeedbackText}
          onTakeDirectorControl={takeDirectorControl}
          onAssignBackToWorker={assignBackToWorker}
          onSubmitNewVersion={submitNewVersion}
          onApproveStage={approveStage}
          onRejectLatestVersion={rejectLatestVersion}
        />
      );
    }

    if (activeProjectTab === "assets") {
      return <AssetsView project={project} />;
    }

    if (activeProjectTab === "approvals") {
      return <ApprovalsView project={project} onOpenStage={openStage} />;
    }

    if (activeProjectTab === "handoff") {
      return <HandoffView project={project} />;
    }

    return null;
  }

  if (isLoadingProjects) {
    return <main className="p-6 text-white">Loading productions...</main>;
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="max-w-2xl text-center">
            <p className="mb-3 text-sm uppercase tracking-[0.35em] text-zinc-500">
              GenAI Production System
            </p>

            <h1 className="mb-4 text-5xl font-bold">
              No active productions initialized.
            </h1>

            <p className="mx-auto mb-8 max-w-xl text-zinc-400">
              Start a new production brief to initialize the project database,
              define creative direction, unlock the workflow pipeline, and
              preserve the final handoff as searchable production memory.
            </p>

            <button
              onClick={createNewProject}
              className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black hover:bg-zinc-200"
            >
              Initialize Production
            </button>
          </div>
        </div>

        <DataViewButton projects={projects} />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-black text-white">
      <Sidebar
        projects={projects}
        selectedProjectIndex={selectedProjectIndex}
        activeProjectTab={activeProjectTab}
        onSwitchProject={switchProject}
        onSetTab={setActiveProjectTab}
        onCreateProject={createNewProject}
      />

      <section className="flex-1 p-6">
        <div className="mb-4 flex gap-3">
          <button
            onClick={createNewProject}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
          >
            New Production
          </button>

          <button
            onClick={renameCurrentProject}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
          >
            Rename
          </button>

          <button
            onClick={deleteCurrentProject}
            className="rounded-xl bg-red-900 px-4 py-2 text-sm hover:bg-red-800"
          >
            Delete
          </button>
        </div>

        {renderProjectTab()}
      </section>

      <DataViewButton projects={projects} />

      {showFinalHandoffModal && (
        <FinalHandoffConfirmModal
          check={finalHandoffCheck}
          onCancel={() => setShowFinalHandoffModal(false)}
          onConfirm={confirmFinalHandoffApproval}
        />
      )}
    </main>
  );
}