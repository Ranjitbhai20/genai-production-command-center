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
const [projects, setProjects] = useState<Project[]>([]);  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [activeProjectTab, setActiveProjectTab] =
    useState<ProjectTab>("pipeline");
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [showFinalHandoffModal, setShowFinalHandoffModal] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const project = projects[selectedProjectIndex];
  const stages = project.stages;
  const selectedStage = stages[selectedStageIndex];
  const selectedStageBlocked = isStageBlocked(stages, selectedStageIndex);
  const finalHandoffCheck = getFinalHandoffCheck(stages);
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
  setIsLoadingProjects(false);
useEffect(() => {
  loadProjects();
}, []);
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

  setProjects((currentProjects) => [...currentProjects, newProject]);
  setSelectedProjectIndex(projects.length);
  setSelectedStageIndex(0);
  setActiveProjectTab("pipeline");
}
async function deleteCurrentProject() {
  const currentProject = projects[selectedProjectIndex];

  if (!currentProject?.id) {
    return;
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", currentProject.id);

  if (error) {
    console.error("Failed to delete project:", error);
    return;
  }

  const remainingProjects = projects.filter(
    (_, index) => index !== selectedProjectIndex
  );

  setProjects(remainingProjects);
  setSelectedProjectIndex(0);
  setSelectedStageIndex(0);
}
  function updateCurrentProjectStages(nextStages: Stage[]) {
    setProjects((currentProjects) =>
      currentProjects.map((item, index) =>
        index === selectedProjectIndex ? { ...item, stages: nextStages } : item
      )
    );
  }

  function approveStage() {
    if (selectedStageBlocked) return;

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
    updateCurrentProjectStages(
      approveStageLogic(stages, selectedStageIndex, feedbackText)
    );
    setFeedbackText("");
    setShowFinalHandoffModal(false);
  }

  function rejectLatestVersion() {
    if (selectedStageBlocked) return;

    updateCurrentProjectStages(
      rejectLatestVersionLogic(stages, selectedStageIndex, feedbackText)
    );
    setFeedbackText("");
  }

  function submitNewVersion() {
    if (selectedStageBlocked) return;

    updateCurrentProjectStages(
      submitNewVersionLogic(stages, selectedStageIndex, feedbackText)
    );
    setFeedbackText("");
  }

  function takeDirectorControl() {
    updateCurrentProjectStages(
      takeDirectorControlLogic(stages, selectedStageIndex)
    );
  }

  function assignBackToWorker() {
    updateCurrentProjectStages(assignBackToWorkerLogic(stages, selectedStageIndex));
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

  function renderProjectTab() {
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

  return (
    <main className="min-h-screen bg-black text-white flex">
      <Sidebar
        projects={projects}
        selectedProjectIndex={selectedProjectIndex}
        activeProjectTab={activeProjectTab}
        onSwitchProject={switchProject}
        onSetTab={setActiveProjectTab}
      />
<button
  onClick={testDatabase}
  className="fixed bottom-6 right-6 z-50 bg-green-900 border border-green-700 px-4 py-3 rounded-xl"
>
  Test Database
</button>
      <section className="flex-1 p-10">{renderProjectTab()}</section>

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