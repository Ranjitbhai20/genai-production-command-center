import { supabase } from "@/lib/supabase";
import { makeStages } from "@/data/initialProjects";
import type { Stage } from "@/types/pipeline";

export function makeProductionStages(): Stage[] {
  return makeStages();
}

export function stageFromRow(row: any): Stage {
  return {
    title: row.title,
    owner: row.owner,
    defaultWorker: row.default_worker,
    approvalAuthority: row.approval_authority,
    status: row.status,
    tool: row.tool,
    method: row.method,
    executionMode: row.execution_mode,
    assignedWorker: row.assigned_worker,
    accessLevel: row.access_level,
    taskBrief: row.task_brief,
    description: row.description,
    notes: row.notes,
    versions: row.versions ?? [],
  };
}

export function stageToRow(stage: Stage, projectId: string, position: number) {
  return {
    project_id: projectId,
    position,
    title: stage.title,
    owner: stage.owner,
    default_worker: stage.defaultWorker,
    approval_authority: stage.approvalAuthority,
    status: stage.status,
    tool: stage.tool,
    method: stage.method,
    execution_mode: stage.executionMode,
    assigned_worker: stage.assignedWorker,
    access_level: stage.accessLevel,
    task_brief: stage.taskBrief,
    description: stage.description,
    notes: stage.notes,
    versions: stage.versions ?? [],
    updated_at: new Date().toISOString(),
  };
}

export async function loadStagesForProject(projectId: string, projectStatus: string) {
  const { data, error } = await supabase
    .from("stages")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (error) {
    console.error("Failed to load stages:", error);
    return [];
  }

  let stages = (data ?? []).map(stageFromRow);

  if (projectStatus !== "draft" && stages.length === 0) {
    stages = makeProductionStages();
    await saveStagesForProject(projectId, stages);
  }

  return stages;
}

export async function saveStagesForProject(projectId: string, stages: Stage[]) {
  const { error } = await supabase.from("stages").upsert(
    stages.map((stage, index) => stageToRow(stage, projectId, index)),
    { onConflict: "project_id,position" }
  );

  if (error) {
    console.error("Failed to save stages:", error);
    return false;
  }

  return true;
}