"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PipelineView } from "@/components/pipeline/PipelineView";
import { FinalHandoffConfirmModal } from "@/components/pipeline/FinalHandoffConfirmModal";
import { AssetsView } from "@/components/assets/AssetsView";
import { ApprovalsView } from "@/components/approvals/ApprovalsView";
import { HandoffView } from "@/components/handoff/HandoffView";
import { makeStages } from "@/data/initialProjects";
import type { Project, ProjectTab, Stage } from "@/types/pipeline";
import {
  approveStage as approveStageLogic,
  assignBackToWorker as assignBackToWorkerLogic,
  getFinalHandoffCheck,
  isStageBlocked,
  rejectLatestVersion as rejectLatestVersionLogic,
  submitNewVersion as submitNewVersionLogic,
  takeDirectorControl as takeDirectorControlLogic,
} from "@/lib/pipelineLogic";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [activeProjectTab, setActiveProjectTab] =
    useState<ProjectTab>("pipeline");
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

    const loadedProjects: Project[] = (data ?? []).map((row) => ({
      id: row.id,
      title: row.name,
      description: row.description ?? "",
      director: "Ranjit",
      format: "9:16 Short Ad",
      mode: "Hybrid AI Production",
      stages: makeStages("coffee"),
      assets: [],
    }));

    setProjects(loadedProjects);
    setSelectedProjectIndex(0);
    setSelectedStageIndex(0);
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

  async function testDatabase() {
    const { data, error } = await supabase.from("projects").insert([
      {
        name: "Test Project",
        description: "Supabase connection working",
        status: "active",
      },
    ]);

    console.log("data:", data);
    console.log("error:", error);
  }

  async function createNewProject() {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: "Untitled Project",
        description: "New GenAI video production project",
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create project:", error);
      return;
    }

    const newProject: Project = {
      id: data.id,
      title: data.name,
      description: data.description ?? "",
      director: "Ranjit",
      format: "9:16 Short Ad",
      mode: "Hybrid AI Production",
      stages: makeStages("coffee"),
      assets: [],
    };

    setProjects((currentProjects) => {
      setSelectedProjectIndex(currentProjects.length);
      return [...currentProjects, newProject];
    });

    setSelectedStageIndex(0);
    setActiveProjectTab("pipeline");
  }

  async function deleteCurrentProject() {
    if (!project?.id) return;

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    if (error) {
      console.error("Failed to delete project:", error);
      return;
    }

    setProjects((currentProjects) =>
      currentProjects.filter((item) => item.id !== project.id)
    );

    setSelectedProjectIndex(0);
    setSelectedStageIndex(0);
    setActiveProjectTab("pipeline");
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

  function confirmFinalHandoffApproval() {
    if (!selectedStage) return;

    updateCurrentProjectStages(
      approveStageLogic(stages, selectedStageIndex, feedbackText)
    );
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
    setActiveProjectTab("pipeline");
    setFeedbackText("");
    setShowFinalHandoffModal(false);
  }

  if (isLoadingProjects) {
    return <main className="p-6 text-white">Loading projects...</main>;
  }

  if (!project) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-lg font-semibold">No projects found.</p>
          <button
            onClick={createNewProject}
            className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black"
          >
            Create New Project
          </button>
        </div>
      </main>
    );
  }

  if (!selectedStage) {
    return <main className="p-6 text-white">No stage selected.</main>;
  }

  const activeProject: Project = project;

  function renderProjectTab() {
    if (activeProjectTab === "pipeline") {
      return (
        <PipelineView
          project={activeProject}
          stages={stages}
          assets={activeProject.assets}
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
      return <AssetsView project={activeProject} />;
    }

    if (activeProjectTab === "approvals") {
      return <ApprovalsView project={activeProject} onOpenStage={openStage} />;
    }

    if (activeProjectTab === "handoff") {
      return <HandoffView project={activeProject} />;
    }

    return null;
  }

  return (
    <main className="flex min-h-screen bg-black text-white">
      <Sidebar
        projects={projects}
        selectedProjectIndex={selectedProjectIndex}
        activeProjectTab={activeProjectTab}
        onSwitchProject={switchProject}
        onSetTab={setActiveProjectTab}
      />

      <section className="flex-1 p-6">
        <div className="mb-4 flex gap-3">
          <button
            onClick={testDatabase}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
          >
            Test Database
          </button>

          <button
            onClick={createNewProject}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
          >
            New Project
          </button>

          <button
            onClick={deleteCurrentProject}
            className="rounded-xl bg-red-900 px-4 py-2 text-sm hover:bg-red-800"
          >
            Delete Project
          </button>
        </div>

        {renderProjectTab()}
      </section>

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