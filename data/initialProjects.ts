import type { Project, Stage } from "@/types/pipeline";

export const initialProjects: Project[] = [];

export function makeStages(): Stage[] {
  return [
    {
      title: "Script",
      owner: "Project Owner",
      defaultWorker: "Script",
      approvalAuthority: "Project Owner",
      status: "Waiting",
      tool: "",
      method: "Text Generation",
      executionMode: "Director Controlled",
      assignedWorker: "Not assigned",
      accessLevel: "Project owner access",
      taskBrief:
        "Create hook, beat structure, dialogue or voiceover plan, CTA, and timing plan from the approved concept brief.",
      description:
        "Hook, scene beats, dialogue, CTA, and timing.",
      notes:
        "Script begins after the concept brief is approved.",
      versions: [],
    },

    {
      title: "Reference Assets",
      owner: "Project Owner",
      defaultWorker: "Reference Assets",
      approvalAuthority: "Project Owner",
      status: "Locked",
      tool: "",
      method: "Asset Ingestion",
      executionMode: "Manual Upload or External Source",
      assignedWorker: "Not assigned",
      accessLevel: "Upload + comment only",
      taskBrief:
        "Upload product photos, footage plates, references, brand files, character references, or style references.",
      description:
        "Product images, real footage, character refs, brand files.",
      notes:
        "Locked until Script is approved.",
      versions: [],
    },

    {
      title: "Generated Still",
      owner: "Project Owner",
      defaultWorker: "Generated Still",
      approvalAuthority: "Project Owner",
      status: "Locked",
      tool: "",
      method: "Image Generation",
      executionMode: "Manual Upload or API Generation",
      assignedWorker: "Not assigned",
      accessLevel: "Submit versions only",
      taskBrief:
        "Generate still plates using approved references, aspect ratio, runtime intent, and production style.",
      description:
        "Approved image plates and visual frames.",
      notes:
        "Locked until Script is approved.",
      versions: [],
    },

    {
      title: "Video Generation",
      owner: "Project Owner",
      defaultWorker: "Video Generation",
      approvalAuthority: "Project Owner",
      status: "Locked",
      tool: "",
      method: "Motion Generation",
      executionMode: "Manual Upload or API Generation",
      assignedWorker: "Not assigned",
      accessLevel: "Submit versions only",
      taskBrief:
        "Generate motion clips from approved stills, motion prompts, or uploaded footage plates.",
      description:
        "Motion generation from approved stills and prompts.",
      notes:
        "Locked until Script is approved.",
      versions: [],
    },

    {
      title: "Audio + Text",
      owner: "Project Owner",
      defaultWorker: "Audio + Text",
      approvalAuthority: "Project Owner",
      status: "Locked",
      tool: "",
      method: "Audio Processing and Text Overlay",
      executionMode: "Manual Upload or External Processing",
      assignedWorker: "Not assigned",
      accessLevel: "Submit versions only",
      taskBrief:
        "Prepare voiceover, SFX, captions, hook text, CTA, and audio notes.",
      description:
        "Voiceover, SFX, music, subtitles, CTA, and on-screen text.",
      notes:
        "Locked until Script is approved.",
      versions: [],
    },

    {
      title: "Final Edit Handoff",
      owner: "Project Owner",
      defaultWorker: "Final Edit",
      approvalAuthority: "Project Owner",
      status: "Locked",
      tool: "",
      method: "Final Assembly",
      executionMode: "Editor Handoff or Export Package",
      assignedWorker: "Not assigned",
      accessLevel: "Editor package access",
      taskBrief:
        "Prepare approved clips, audio, text plan, notes, and final edit package.",
      description:
        "Approved clips, notes, assets, and edit package.",
      notes:
        "Locked until at least one visual production stage is approved.",
      versions: [],
    },
  ];
}