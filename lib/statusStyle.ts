import type { StageStatus } from "@/types/pipeline";

export function statusStyle(status: StageStatus | string) {
  if (status === "Approved") return "bg-green-950 text-green-300 border-green-800";
  if (status === "Submitted") return "bg-purple-950 text-purple-300 border-purple-800";
  if (status === "Rejected") return "bg-red-950 text-red-300 border-red-800";
  if (status === "Needs Revalidation") return "bg-orange-950 text-orange-300 border-orange-800";
  if (status === "Waiting") return "bg-yellow-950 text-yellow-300 border-yellow-800";
  if (status === "Locked") return "bg-zinc-800 text-zinc-400 border-zinc-700";
  return "bg-blue-950 text-blue-300 border-blue-800";
}
