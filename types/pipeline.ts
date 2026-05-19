export type StageStatus =
  | "Approved"
  | "Submitted"
  | "Rejected"
  | "Needs Revalidation"
  | "Waiting"
  | "Locked";

export type ProjectTab = "pipeline" | "assets" | "approvals" | "handoff" | "projects";

export type ProjectType = "coffee" | "custody";

export type Version = {
  label: string;
  status: StageStatus;
  feedback: string;
  submittedBy: string;
};

export type Stage = {
  title: string;
  owner: string;
  defaultWorker: string;
  approvalAuthority: string;
  status: StageStatus;
  tool: string;
  method: string;
  executionMode: string;
  assignedWorker: string;
  accessLevel: string;
  taskBrief: string;
  description: string;
  notes: string;
  versions: Version[];
};

export type Asset = {
  name: string;
  type: string;
  linkedStage: string;
  status: StageStatus;
  source: string;
};

export type Project = {
  title: string;
  description: string;
  director: string;
  format: string;
  mode: string;
  stages: Stage[];
  assets: Asset[];
};
