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
  const conceptApproved = stages[0]?.status === "Approved";
  const scriptApproved = stages[1]?.status === "Approved";
  const stage = stages[index];

  if (index === 0) return false;

  if (index === 1) {
    return !conceptApproved;
  }

  if (index >= 2 && !scriptApproved) {
    return true;
  }

  if (stage.title === "Final Edit Handoff") {
    const check = getFinalHandoffCheck(stages);
    return !check.canAttemptHandoff;
  }

  return false;
}

export function blockedReason(stages: Stage[], index: number) {
  const conceptApproved = stages[0]?.status === "Approved";
  const scriptApproved = stages[1]?.status === "Approved";
  const stage = stages[index];

  if (index === 1 && !conceptApproved) {
    return "Blocked: Concept must be approved before Script unlocks.";
  }

  if (index >= 2 && !scriptApproved) {
    return "Blocked: Script must be approved before production floor unlocks.";
  }

  if (stage.title === "Final Edit Handoff") {
    const check = getFinalHandoffCheck(stages);

    if (!check.canAttemptHandoff) {
      return "Blocked: Final Edit Handoff requires at least one approved visual production stage. Audio + Text alone is not enough.";
    }
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
        feedbackText.trim() || "Director approved this latest version.";

      const versions = stage.versions.map((version, versionIndex) =>
        versionIndex === stage.versions.length - 1
          ? { ...version, status: "Approved" as const, feedback }
          : version
      );

      return { ...stage, status: "Approved" as const, versions };
    }

    if (
      selectedStageIndex === 0 &&
      index === 1 &&
      stage.status !== "Approved"
    ) {
      return {
        ...stage,
        status: "Waiting" as const,
        notes: "Concept is approved. Script can now be revised or submitted.",
      };
    }

    if (
      selectedStageIndex === 1 &&
      index >= 2 &&
      (stage.status === "Locked" || stage.status === "Needs Revalidation")
    ) {
      return {
        ...stage,
        status: "Waiting" as const,
        notes:
          "Script is approved. Director can now review, approve, revise, or continue this stage.",
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
    feedbackText.trim() || "Director rejected this version. Revision needed.";

  return stages.map((stage, index) => {
    if (index === selectedStageIndex) {
      const versions = stage.versions.map((version, versionIndex) =>
        versionIndex === stage.versions.length - 1
          ? { ...version, status: "Rejected" as const, feedback }
          : version
      );

      return { ...stage, status: "Rejected" as const, versions };
    }

    if (selectedStageIndex === 0 && index >= 1) {
      return {
        ...stage,
        status: "Needs Revalidation" as const,
        notes:
          "Concept changed or was rejected. Existing work is saved, but director must revalidate before continuing.",
      };
    }

    if (selectedStageIndex === 1 && index >= 2) {
      return {
        ...stage,
        status: "Needs Revalidation" as const,
        notes:
          "Script changed or was rejected. Existing work is saved, but director must revalidate before continuing.",
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
            feedbackText.trim() || "New version submitted for director review.",
          submittedBy: stage.assignedWorker,
        },
      ],
    };
  });
}

export function takeDirectorControl(
  stages: Stage[],
  selectedStageIndex: number
) {
  return stages.map((stage, index) =>
    index === selectedStageIndex
      ? {
          ...stage,
          owner: "Director",
          executionMode: "Self-managed",
          assignedWorker: "Ranjit",
          accessLevel: "Full control",
          taskBrief:
            "Director has taken control of this stage while preserving all previous worker submissions.",
        }
      : stage
  );
}

export function assignBackToWorker(
  stages: Stage[],
  selectedStageIndex: number
) {
  return stages.map((stage, index) =>
    index === selectedStageIndex
      ? {
          ...stage,
          owner: stage.defaultWorker,
          executionMode: "Assigned to worker",
          assignedWorker: stage.defaultWorker,
          accessLevel:
            stage.defaultWorker === "AI Operator"
              ? "Upload + comment only"
              : "Submit versions only",
          taskBrief: `Assigned to ${stage.defaultWorker}. Worker can submit versions; director keeps approval authority.`,
        }
      : stage
  );
}