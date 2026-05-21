"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { DataViewButton } from "@/components/layout/DataViewButton";
import { BriefView } from "@/components/brief/BriefView";
import { PipelineView } from "@/components/pipeline/PipelineView";
import { FinalHandoffConfirmModal } from "@/components/pipeline/FinalHandoffConfirmModal";
import { AssetsView } from "@/components/assets/AssetsView";
import { ApprovalsView } from "@/components/approvals/ApprovalsView";
import { HandoffView } from "@/components/handoff/HandoffView";
import { getFinalHandoffCheck } from "@/lib/pipelineLogic";
import { useProductionProjects } from "@/hooks/useProductionProjects";

export default function Home() {
  const {
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
  } = useProductionProjects();

  const finalHandoffCheck = getFinalHandoffCheck(stages);

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
          isUploadingAsset={isUploadingAsset}
          isUpdatingAsset={isUpdatingAsset}
          onSelectStage={setSelectedStageIndex}
          onFeedbackChange={setFeedbackText}
          onTakeDirectorControl={takeDirectorControl}
          onAssignBackToWorker={assignBackToWorker}
          onSubmitNewVersion={submitNewVersion}
          onApproveStage={approveStage}
          onRejectLatestVersion={rejectLatestVersion}
          onUploadAsset={uploadAsset}
          onApproveAsset={approveSelectedAsset}
          onRejectAsset={rejectSelectedAsset}
          onResubmitAsset={resubmitSelectedAsset}
          onWithdrawAsset={withdrawSelectedAsset}
          onDeleteDraftAsset={deleteSelectedDraftAsset}
          onRemoveUnsafeAsset={removeSelectedUnsafeAsset}
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