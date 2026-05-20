import type { Stage } from "@/types/pipeline";

const VISUAL_PRODUCTION_STAGE_TITLES = [
  "Reference Assets",
  "Generated Still",
  "Video Generation",
];

const REQUIRED_PRODUCTION_STAGE_TITLES = [
  "Reference Assets",
  "Generated Still",
  "Video Generation",
  "Audio + Text",
];

export type FinalHandoffCheck = {
  approvedVisualStages: string[];
  missingStages: string[];
  canAttemptHandoff: boolean;
};

export function isStageBlocked(stages: Stage[], index: number) {
  const stage = stages[index];
  const scriptApproved = stages[0]?.status === "Approved";

  if (!stage) return true;
  if (index === 0) return false;

  if (stage.title === "Final Edit Handoff") {
    const check = getFinalHandoffCheck(stages);
    return !check.canAttemptHandoff;
  }

  if (index >= 1 && !scriptApproved) {
    return true;
  }

  return false;
}

export function blockedReason(stages: Stage[], index: number) {
  const stage = stages[index];
  const scriptApproved = stages[0]?.status === "Approved";

  if (!stage) return "Blocked: stage does not exist.";

  if (stage.title === "Final Edit Handoff") {
    const check = getFinalHandoffCheck(stages);

    if (!check.canAttemptHandoff) {
      return "Blocked: Final Edit Handoff requires at least one approved visual production stage.";
    }
  }

  if (index >= 1 && !scriptApproved) {
    return "Blocked: Script must be approved before production floor unlocks.";
  }

  return "";
}

export function getFinalHandoffCheck(stages: Stage[]): FinalHandoffCheck {
  const approvedVisualStages = stages
    .filter(
      (stage) =>
        VISUAL_PRODUCTION_STAGE_TITLES.includes(stage.title) &&
        stage.status === "Approved"
    )
    .map((stage) => stage.title);

  const missingStages = stages
    .filter(
      (stage) =>
        REQUIRED_PRODUCTION_STAGE_TITLES.includes(stage.title) &&
        stage.status !== "Approved"
    )
    .map((stage) => stage.title);

  return {
    approvedVisualStages,
    missingStages,
    canAttemptHandoff: approvedVisualStages.length > 0,
  };
}

export function approveStage(
  stages: Stage[],
  selectedStageIndex: number,
  feedbackText: string
) {
  return stages.map((stage, index) => {
    if (index === selectedStageIndex) {
      const feedback =
        feedbackText.trim() || "Project owner approved the latest version.";

      const versions =
        stage.versions.length > 0
          ? stage.versions.map((version, versionIndex) =>
              versionIndex === stage.versions.length - 1
                ? { ...version, status: "Approved" as const, feedback }
                : version
            )
          : [
              {
                label: "v1",
                status: "Approved" as const,
                feedback,
                submittedBy: stage.assignedWorker || "Project Owner",
              },
            ];

      return {
        ...stage,
        status: "Approved" as const,
        versions,
      };
    }

    if (
      selectedStageIndex === 0 &&
      index >= 1 &&
      (stage.status === "Locked" || stage.status === "Needs Revalidation")
    ) {
      return {
        ...stage,
        status: "Waiting" as const,
        notes:
          "Script is approved. Project owner can now assign, review, approve, revise, or continue this stage.",
      };
    }

    return stage;
  });
}

export function rejectLatestVersion(
  stages: Stage[],
  selectedStageIndex: number,
  feedbackText: string
) {
  const feedback =
    feedbackText.trim() || "Project owner rejected this version. Revision needed.";

  return stages.map((stage, index) => {
    if (index === selectedStageIndex) {
      const versions =
        stage.versions.length > 0
          ? stage.versions.map((version, versionIndex) =>
              versionIndex === stage.versions.length - 1
                ? { ...version, status: "Rejected" as const, feedback }
                : version
            )
          : [
              {
                label: "v1",
                status: "Rejected" as const,
                feedback,
                submittedBy: stage.assignedWorker || "Project Owner",
              },
            ];

      return {
        ...stage,
        status: "Rejected" as const,
        versions,
      };
    }

    if (selectedStageIndex === 0 && index >= 1) {
      return {
        ...stage,
        status: "Needs Revalidation" as const,
        notes:
          "Script changed or was rejected. Existing work is saved, but project owner must revalidate before continuing.",
      };
    }

    return stage;
  });
}

export function submitNewVersion(
  stages: Stage[],
  selectedStageIndex: number,
  feedbackText: string
) {
  return stages.map((stage, index) => {
    if (index !== selectedStageIndex) return stage;

    const nextVersionNumber = stage.versions.length + 1;

    return {
      ...stage,
      status: "Submitted" as const,
      versions: [
        ...stage.versions,
        {
          label: `v${nextVersionNumber}`,
          status: "Submitted" as const,
          feedback:
            feedbackText.trim() || "New version submitted for project owner review.",
          submittedBy: stage.assignedWorker || "Project Owner",
        },
      ],
    };
  });
}

export function takeDirectorControl(stages: Stage[], selectedStageIndex: number) {
  return stages.map((stage, index) =>
    index === selectedStageIndex
      ? {
          ...stage,
          owner: "Project Owner",
          executionMode: "Self-managed",
          assignedWorker: "Not assigned",
          accessLevel: "Full control",
          taskBrief:
            "Project owner has taken control of this stage while preserving all previous worker submissions.",
        }
      : stage
  );
}

export function assignBackToWorker(stages: Stage[], selectedStageIndex: number) {
  return stages.map((stage, index) =>
    index === selectedStageIndex
      ? {
          ...stage,
          owner: stage.defaultWorker,
          executionMode: "Assigned to worker",
          assignedWorker: "Not assigned",
          accessLevel:
            stage.defaultWorker === "AI Operator"
              ? "Upload + comment only"
              : "Submit versions only",
          taskBrief: `Ready to assign to ${stage.defaultWorker}. Worker can submit versions; project owner keeps approval authority.`,
        }
      : stage
  );
}