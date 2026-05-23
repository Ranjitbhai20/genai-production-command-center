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

const ASSIGNMENT_KEY_TTL_HOURS = 24;

export type FinalHandoffCheck = {
  approvedVisualStages: string[];
  missingStages: string[];
  canAttemptHandoff: boolean;
};

export function generateAssignmentKey() {
  const randomValue =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
      : Math.random().toString(36).slice(2, 12);

  return `WORKER-${randomValue.toUpperCase()}`;
}

function getAssignmentExpiry(createdAtIso: string) {
  const expiresAt = new Date(createdAtIso);
  expiresAt.setHours(expiresAt.getHours() + ASSIGNMENT_KEY_TTL_HOURS);
  return expiresAt.toISOString();
}

export function isAssignmentExpired(stage: Stage) {
  if (!stage.assignmentKeyExpiresAt) return false;
  return new Date(stage.assignmentKeyExpiresAt).getTime() <= Date.now();
}

export function expireAssignmentIfNeeded(stage: Stage): Stage {
  if (
    stage.assignmentStatus === "active" &&
    isAssignmentExpired(stage)
  ) {
    return {
      ...stage,
      assignmentStatus: "expired",
      assignmentKey: undefined,
      notes: "Assignment key expired after 24 hours.",
    };
  }

  return stage;
}

export function autoExpireAssignments(stages: Stage[]) {
  return stages.map(expireAssignmentIfNeeded);
}

function clearAssignmentFields(stage: Stage): Stage {
  return {
    ...stage,
    assignmentKey: undefined,
    assignmentKeyCreatedAt: undefined,
    assignmentKeyExpiresAt: undefined,
    assignmentActivatedAt: undefined,
    assignmentSubmittedAt: undefined,
  };
}

export function isStageBlocked(stages: Stage[], index: number) {
  const stage = stages[index];
  const scriptApproved = stages[0]?.status === "Approved";

  if (!stage) return true;
  if (index === 0) return false;

  if (stage.title === "Final Edit Handoff") {
    const check = getFinalHandoffCheck(stages);
    return !check.canAttemptHandoff;
  }

  if (index >= 1 && !scriptApproved) return true;

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
        feedbackText.trim() ||
        "Project owner approved the latest version.";

      const versions =
        stage.versions.length > 0
          ? stage.versions.map((version, versionIndex) =>
              versionIndex === stage.versions.length - 1
                ? {
                    ...version,
                    status: "Approved" as const,
                    feedback,
                  }
                : version
            )
          : [
              {
                label: "v1",
                status: "Approved" as const,
                feedback,
                submittedBy: stage.owner,
              },
            ];

      return {
        ...clearAssignmentFields(stage),
        status: "Approved" as const,
        assignmentStatus: "approved" as const,
        versions,
        notes: feedback,
      };
    }

    if (
      selectedStageIndex === 0 &&
      index >= 1 &&
      (stage.status === "Locked" ||
        stage.status === "Needs Revalidation")
    ) {
      return {
        ...stage,
        status: "Waiting" as const,
        notes: "Script approved. Production stages unlocked.",
      };
    }

    return stage;
  });
}

export function requestRevision(
  stages: Stage[],
  selectedStageIndex: number,
  feedbackText: string
) {
  const feedback =
    feedbackText.trim() ||
    "Revision requested by project owner.";

  return stages.map((stage, index) => {
    if (index !== selectedStageIndex) return stage;

    const versions =
      stage.versions.length > 0
        ? stage.versions.map((version, versionIndex) =>
            versionIndex === stage.versions.length - 1
              ? {
                  ...version,
                  status: "Rejected" as const,
                  feedback,
                }
              : version
          )
        : [
            {
              label: "v1",
              status: "Rejected" as const,
              feedback,
              submittedBy: stage.owner,
            },
          ];

    return {
      ...stage,
      status: "Rejected" as const,
      assignmentStatus: "rejected" as const,
      versions,
      notes: feedback,
    };
  });
}

export function rejectAndTakeDirectorControl(
  stages: Stage[],
  selectedStageIndex: number,
  feedbackText: string
) {
  const feedback =
    feedbackText.trim() ||
    "Worker submission rejected. Director has taken back control.";

  return stages.map((stage, index) => {
    if (index !== selectedStageIndex) return stage;

    const versions =
      stage.versions.length > 0
        ? stage.versions.map((version, versionIndex) =>
            versionIndex === stage.versions.length - 1
              ? {
                  ...version,
                  status: "Rejected" as const,
                  feedback,
                }
              : version
          )
        : [];

    return {
      ...clearAssignmentFields(stage),
      owner: "Project Owner",
      status: "Waiting" as const,
      executionMode: "Director Controlled",
      accessLevel: "Full control",
      assignmentStatus: "rejected" as const,
      versions,
      notes: feedback,
    };
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
            feedbackText.trim() ||
            "New version submitted for review.",
          submittedBy: stage.owner,
        },
      ],
    };
  });
}

export function submitAssignment(
  stages: Stage[],
  selectedStageIndex: number,
  feedbackText: string
) {
  return stages.map((stage, index) => {
    if (index !== selectedStageIndex) return stage;

    const checkedStage = expireAssignmentIfNeeded(stage);

    if (checkedStage.assignmentStatus === "expired") {
      return checkedStage;
    }

    const nextVersionNumber = checkedStage.versions.length + 1;
    const submittedAt = new Date().toISOString();

    return {
      ...checkedStage,
      status: "Submitted" as const,
      assignmentStatus: "submitted" as const,
      assignmentSubmittedAt: submittedAt,
      versions: [
        ...checkedStage.versions,
        {
          label: `v${nextVersionNumber}`,
          status: "Submitted" as const,
          feedback:
            feedbackText.trim() ||
            "Worker assignment submitted for director review.",
          submittedBy: "Worker",
        },
      ],
      notes: "Worker assignment submitted for director review.",
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
          ...clearAssignmentFields(stage),
          owner: "Project Owner",
          executionMode: "Director Controlled",
          accessLevel: "Full control",
          assignmentStatus: "revoked" as const,
          notes:
            "Director has taken control while preserving worker history.",
        }
      : stage
  );
}

export function assignBackToWorker(
  stages: Stage[],
  selectedStageIndex: number
) {
  const createdAt = new Date().toISOString();

  return stages.map((stage, index) =>
    index === selectedStageIndex
      ? {
          ...stage,
          owner: "Worker",
          executionMode: "Assigned to Worker",
          accessLevel: "Submit versions only",
          assignmentKey: generateAssignmentKey(),
          assignmentStatus: "active" as const,
          assignmentKeyCreatedAt: createdAt,
          assignmentKeyExpiresAt: getAssignmentExpiry(createdAt),
          assignmentActivatedAt: undefined,
          assignmentSubmittedAt: undefined,
          notes:
            "Stage assigned to worker. Assignment key generated and valid for 24 hours.",
        }
      : stage
  );
}