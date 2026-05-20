export type StageStatus =
  | "Approved"
  | "Submitted"
  | "Rejected"
  | "Needs Revalidation"
  | "Waiting"
  | "Locked";

export type ProjectTab = "brief" | "pipeline" | "assets" | "approvals" | "handoff";

export type ProjectStatus = "draft" | "in_production" | "complete";

export type ProjectType =
  | "Advertisement"
  | "Social Media Short"
  | "Product Showcase"
  | "Music Video"
  | "Short Film"
  | "Documentary"
  | "Tutorial"
  | "Hybrid Live Action"
  | "Other";

export type AspectRatio = "9:16" | "16:9" | "1:1" | "4:5" | "Other";

export type RuntimeTarget =
  | "<10 sec"
  | "10-20 sec"
  | "20-40 sec"
  | "40-60 sec"
  | "1-3 min"
  | "3-10 min"
  | ">10 min";

export type WorkflowMode =
  | "Solo Production"
  | "Team Production"
  | "Hybrid"
  | "API Assisted";

export type VisualStyle =
  | "AI Generated"
  | "Hybrid AI"
  | "Live Action"
  | "Stylized"
  | "Photoreal"
  | "Animation"
  | "Mixed";

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

export type ProjectBriefInput = {
  ownerName: string;
  projectType: ProjectType;
  aspectRatio: AspectRatio;
  runtimeTarget: RuntimeTarget;
  workflowMode: WorkflowMode;
  visualStyle: VisualStyle;
  conceptSummary: string;
  additionalInfo: string;
};

export type Project = {
  id?: string;
  title: string;
  description: string;
  status: ProjectStatus;
  ownerName: string;
  projectType: ProjectType;
  aspectRatio: AspectRatio;
  runtimeTarget: RuntimeTarget;
  workflowMode: WorkflowMode;
  visualStyle: VisualStyle;
  conceptSummary: string;
  additionalInfo: string;
  stages: Stage[];
  assets: Asset[];
};