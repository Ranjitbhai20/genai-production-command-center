"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  Asset,
  Project,
  ProjectBriefInput,
  ProjectTab,
  Stage,
} from "@/types/pipeline";
import {
  approveStage as approveStageLogic,
  assignBackToWorker as assignBackToWorkerLogic,
  isStageBlocked,
  rejectLatestVersion as rejectLatestVersionLogic,
  submitNewVersion as submitNewVersionLogic,
  takeDirectorControl as takeDirectorControlLogic,
} from "@/lib/pipelineLogic";
import {
  loadStagesForProject,
  makeProductionStages,
  saveStagesForProject,
} from "@/lib/stagePersistence";
import {
  approveAsset,
  deleteDraftAsset,
  loadAssetsForProject,
  rejectAsset,
  removeUnsafeAsset,
  resubmitAsset,
  submitDraftAssetsForStage,
  uploadAssetForStage,
  withdrawAsset,
} from "@/lib/assetPersistence";

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
    workflowMode: row.workflow_mode ?? "Solo Production",
    visualStyle: row.visual_style ?? "Hybrid AI",
    conceptSummary: row.concept_summary ?? "",
    additionalInfo: row.additional_info ?? "",
    stages: [],
    assets: [],
  };
}

function withStageNote(
  stages: Stage[],
  selectedStageIndex: number,
  note: string
) {
  return stages.map((stage, index) =>
    index === selectedStageIndex ? { ...stage, notes: note } : stage
  );
}

export function useProductionProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [activeProjectTab, setActiveProjectTab] = useState<ProjectTab>("brief");
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [showFinalHandoffModal, setShowFinalHandoffModal] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const [isUpdatingAsset, setIsUpdatingAsset] = useState(false);

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

    const loadedProjects = await Promise.all(
      (data ?? []).map(async (row) => {
        const baseProject = projectFromRow(row);

        const loadedStages = await loadStagesForProject(
          row.id,
          baseProject.status
        );

        const loadedAssets = await loadAssetsForProject(row.id);

        return {
          ...baseProject,
          stages: loadedStages,
          assets: loadedAssets,
        };
      })
    );

    setProjects(loadedProjects);
    setSelectedProjectIndex(0);
    setSelectedStageIndex(0);
    setActiveProjectTab("brief");
    setIsLoadingProjects(false);
  }

  useEffect(() => {
    loadProjects();
  }, []);

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
    if (!project?.id) return;

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
    if (!project?.id) return;

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

    setProjects(projects.filter((item) => item.id !== project.id));
    setSelectedProjectIndex(0);
    setSelectedStageIndex(0);
    setActiveProjectTab("brief");
  }

  async function saveBrief(
    brief: ProjectBriefInput,
    nextStatus?: Project["status"]
  ) {
    if (!project?.id) return false;

    const status = nextStatus ?? project.status;
    const description =
      brief.conceptSummary.trim() || "New GenAI video production project";

    const { error } = await supabase
      .from("projects")
      .update({
        owner_name: brief.ownerName,
        project_type: brief.projectType,
        aspect_ratio: brief.aspectRatio,
        runtime_target: brief.runtimeTarget,
        workflow_mode: brief.workflowMode,
        visual_style: brief.visualStyle,
        concept_summary: brief.conceptSummary,
        additional_info: brief.additionalInfo,
        description,
        status,
      })
      .eq("id", project.id);

    if (error) {
      console.error("Failed to save brief:", error);
      return false;
    }

    setProjects((currentProjects) =>
      currentProjects.map((item) =>
        item.id === project.id
          ? { ...item, ...brief, description, status }
          : item
      )
    );

    return true;
  }

  async function approveBrief(brief: ProjectBriefInput) {
    if (!project?.id) return;

    if (!brief.ownerName.trim()) {
      window.alert("Owner / Director name is required.");
      return;
    }

    if (brief.conceptSummary.trim().length < 20) {
      window.alert("Concept summary must be at least 20 characters.");
      return;
    }

    const saved = await saveBrief(brief, "in_production");
    if (!saved) return;

    const defaultStages = makeProductionStages();
    const stagesSaved = await saveStagesForProject(project.id, defaultStages);
    if (!stagesSaved) return;

    const loadedStages = await loadStagesForProject(
      project.id,
      "in_production"
    );

    setProjects((currentProjects) =>
      currentProjects.map((item) =>
        item.id === project.id
          ? {
              ...item,
              ...brief,
              status: "in_production",
              stages: loadedStages,
              description:
                brief.conceptSummary.trim() ||
                "New GenAI video production project",
            }
          : item
      )
    );

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

  async function updateCurrentProjectStages(nextStages: Stage[]) {
    if (!project?.id) return;

    const saved = await saveStagesForProject(project.id, nextStages);
    if (!saved) return;

    const reloadedStages = await loadStagesForProject(
      project.id,
      project.status
    );

    setProjects((currentProjects) =>
      currentProjects.map((item, index) =>
        index === selectedProjectIndex
          ? { ...item, stages: reloadedStages }
          : item
      )
    );
  }

  async function reloadCurrentProjectAssets() {
    if (!project?.id) return;

    const loadedAssets = await loadAssetsForProject(project.id);

    setProjects((currentProjects) =>
      currentProjects.map((item, index) =>
        index === selectedProjectIndex
          ? { ...item, assets: loadedAssets }
          : item
      )
    );
  }

  async function uploadAsset(file: File) {
    if (!project?.id || !selectedStage) return;

    setIsUploadingAsset(true);

    const uploadedAsset = await uploadAssetForStage({
      projectId: project.id,
      stageId: selectedStage.id,
      stageTitle: selectedStage.title,
      file,
      uploadedBy: selectedStage.assignedWorker || project.ownerName,
    });

    if (uploadedAsset) {
      await reloadCurrentProjectAssets();
    }

    setIsUploadingAsset(false);
  }

  async function approveSelectedAsset(assetId: string) {
    setIsUpdatingAsset(true);

    const updatedAsset = await approveAsset(assetId);

    if (updatedAsset) {
      await reloadCurrentProjectAssets();
    }

    setIsUpdatingAsset(false);
  }

  async function rejectSelectedAsset(assetId: string) {
    setIsUpdatingAsset(true);

    const updatedAsset = await rejectAsset(assetId);

    if (updatedAsset) {
      await reloadCurrentProjectAssets();
    }

    setIsUpdatingAsset(false);
  }

  async function resubmitSelectedAsset(assetId: string) {
    setIsUpdatingAsset(true);

    const updatedAsset = await resubmitAsset(assetId);

    if (updatedAsset) {
      await reloadCurrentProjectAssets();
    }

    setIsUpdatingAsset(false);
  }

  async function withdrawSelectedAsset(assetId: string) {
    setIsUpdatingAsset(true);

    const updatedAsset = await withdrawAsset(assetId);

    if (updatedAsset) {
      await reloadCurrentProjectAssets();
    }

    setIsUpdatingAsset(false);
  }

  async function deleteSelectedDraftAsset(asset: Asset) {
    const confirmed = window.confirm(
      `Delete draft upload "${asset.name}"? This removes the file before submission.`
    );

    if (!confirmed) return;

    setIsUpdatingAsset(true);

    const deleted = await deleteDraftAsset(asset);

    if (deleted) {
      await reloadCurrentProjectAssets();
    }

    setIsUpdatingAsset(false);
  }

  async function removeSelectedUnsafeAsset(asset: Asset) {
    const confirmed = window.confirm(
      `Remove "${asset.name}" from storage? This keeps an audit row but deletes the uploaded file.`
    );

    if (!confirmed) return;

    setIsUpdatingAsset(true);

    const removed = await removeUnsafeAsset(asset);

    if (removed) {
      await reloadCurrentProjectAssets();
    }

    setIsUpdatingAsset(false);
  }

  async function submitDraftAssetsForSelectedStage() {
    if (!project?.id || !selectedStage) return true;

    return submitDraftAssetsForStage({
      projectId: project.id,
      stageId: selectedStage.id,
      stageTitle: selectedStage.title,
    });
  }

  async function approveStage() {
    if (!selectedStage || selectedStageBlocked) return;

    if (selectedStage.title === "Final Edit Handoff") {
      setShowFinalHandoffModal(true);
      return;
    }

    const approvalNote = feedbackText.trim() || "Approved";

    const approvedStages = approveStageLogic(
      stages,
      selectedStageIndex,
      approvalNote
    );

    await updateCurrentProjectStages(
      withStageNote(approvedStages, selectedStageIndex, approvalNote)
    );

    setFeedbackText("");
  }

  async function confirmFinalHandoffApproval() {
    if (!selectedStage) return;

    const approvalNote = feedbackText.trim() || "Final handoff approved";

    const approvedStages = approveStageLogic(
      stages,
      selectedStageIndex,
      approvalNote
    );

    await updateCurrentProjectStages(
      withStageNote(approvedStages, selectedStageIndex, approvalNote)
    );

    await markProjectComplete();

    setFeedbackText("");
    setShowFinalHandoffModal(false);
  }

  async function rejectLatestVersion() {
    if (!selectedStage || selectedStageBlocked) return;

    const revisionNote = feedbackText.trim();

    if (revisionNote.length < 2) {
      window.alert("Please add a short revision note before requesting changes.");
      return;
    }

    const rejectedStages = rejectLatestVersionLogic(
      stages,
      selectedStageIndex,
      revisionNote
    );

    await updateCurrentProjectStages(
      withStageNote(rejectedStages, selectedStageIndex, revisionNote)
    );

    setFeedbackText("");
  }

  async function submitNewVersion() {
    if (!selectedStage || selectedStageBlocked) return;

    const assetsSubmitted = await submitDraftAssetsForSelectedStage();

    if (!assetsSubmitted) {
      window.alert("Draft assets could not be submitted. Please try again.");
      return;
    }

    await reloadCurrentProjectAssets();

    const versionNote = feedbackText.trim() || "Version submitted";

    const submittedStages = submitNewVersionLogic(
      stages,
      selectedStageIndex,
      versionNote
    );

    await updateCurrentProjectStages(
      withStageNote(submittedStages, selectedStageIndex, versionNote)
    );

    setFeedbackText("");
  }

  async function takeDirectorControl() {
    if (!selectedStage) return;

    await updateCurrentProjectStages(
      takeDirectorControlLogic(stages, selectedStageIndex)
    );
  }

  async function assignBackToWorker() {
    if (!selectedStage) return;

    await updateCurrentProjectStages(
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

  return {
    projects,
    project,
    stages,
    selectedStageIndex,
    activeProjectTab,
    selectedProjectIndex,
    feedbackText,
    showFinalHandoffModal,
    isLoadingProjects,
    isUploadingAsset,
    isUpdatingAsset,
    setActiveProjectTab,
    setSelectedStageIndex,
    setFeedbackText,
    setShowFinalHandoffModal,
    createNewProject,
    renameCurrentProject,
    deleteCurrentProject,
    saveBrief,
    approveBrief,
    approveStage,
    rejectLatestVersion,
    submitNewVersion,
    takeDirectorControl,
    assignBackToWorker,
    confirmFinalHandoffApproval,
    uploadAsset,
    approveSelectedAsset,
    rejectSelectedAsset,
    resubmitSelectedAsset,
    withdrawSelectedAsset,
    deleteSelectedDraftAsset,
    removeSelectedUnsafeAsset,
    openStage,
    switchProject,
  };
}