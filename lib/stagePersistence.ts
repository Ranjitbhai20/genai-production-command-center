import { supabase } from "@/lib/supabase";
import { makeStages } from "@/data/initialProjects";
import type { Stage } from "@/types/pipeline";

export function makeProductionStages(): Stage[] {
  return makeStages();
}

export function stageFromRow(row: any): Stage {
  return {
    id: row.id,

    title: row.title,
    owner: row.owner ?? "Project Owner",
    defaultWorker: row.default_worker ?? "",

    status: row.status,

    tool: row.tool ?? "",
    method: row.method ?? "",
    executionMode: row.execution_mode ?? "",

    assignedWorker: row.assigned_worker ?? "Not assigned",
    accessLevel: row.access_level ?? "Full control",

    taskBrief: row.task_brief ?? "",
    description: row.description ?? "",

    notes: row.notes ?? "",

    versions: row.versions ?? [],

    assignmentKey: row.assignment_key ?? undefined,
    assignmentStatus: row.assignment_status ?? undefined,
    assignmentKeyCreatedAt: row.assignment_key_created_at ?? undefined,
    assignmentKeyExpiresAt: row.assignment_key_expires_at ?? undefined,
    assignmentActivatedAt: row.assignment_activated_at ?? undefined,
    assignmentSubmittedAt: row.assignment_submitted_at ?? undefined,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function stageToRow(stage: Stage, projectId: string, position: number) {
  return {
    project_id: projectId,
    position,

    title: stage.title,
    owner: stage.owner ?? "Project Owner",
    default_worker: stage.defaultWorker ?? "",

    approval_authority: "Project Owner",

    status: stage.status,

    tool: stage.tool ?? "",
    method: stage.method ?? "",
    execution_mode: stage.executionMode ?? "",

    assigned_worker: stage.assignedWorker ?? "Not assigned",
    access_level: stage.accessLevel ?? "Full control",

    task_brief: stage.taskBrief ?? "",
    description: stage.description ?? "",

    notes: stage.notes ?? "",

    versions: stage.versions ?? [],

    assignment_key: stage.assignmentKey ?? null,
    assignment_status: stage.assignmentStatus ?? null,
    assignment_key_created_at: stage.assignmentKeyCreatedAt ?? null,
    assignment_key_expires_at: stage.assignmentKeyExpiresAt ?? null,
    assignment_activated_at: stage.assignmentActivatedAt ?? null,
    assignment_submitted_at: stage.assignmentSubmittedAt ?? null,

    updated_at: new Date().toISOString(),
  };
}

function logSupabaseError(label: string, error: unknown) {
  console.error(label, JSON.stringify(error, null, 2));
}

export async function loadStagesForProject(
  projectId: string,
  projectStatus: string
) {
  const { data, error } = await supabase
    .from("stages")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (error) {
    logSupabaseError("Failed to load stages:", error);
    return [];
  }

  let stages = (data ?? []).map(stageFromRow);

  if (projectStatus !== "draft" && stages.length === 0) {
    const defaultStages = makeProductionStages();
    const saved = await saveStagesForProject(projectId, defaultStages);

    if (!saved) {
      return [];
    }

    const { data: backfilledRows, error: backfillLoadError } = await supabase
      .from("stages")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (backfillLoadError) {
      logSupabaseError("Failed to reload backfilled stages:", backfillLoadError);
      return defaultStages;
    }

    stages = (backfilledRows ?? []).map(stageFromRow);
  }

  return stages;
}

export async function saveStagesForProject(projectId: string, stages: Stage[]) {
  const rows = stages.map((stage, index) =>
    stageToRow(stage, projectId, index)
  );

  const { error } = await supabase
    .from("stages")
    .upsert(rows, { onConflict: "project_id,position" });

  if (error) {
    logSupabaseError("Failed to save stages:", error);
    return false;
  }

  return true;
}