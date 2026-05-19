import type { Project, ProjectType, Stage } from "@/types/pipeline";

export const initialProjects: Project[] = [
  {
    title: "Talking Coffee Cup Ad",
    description:
      "Director-controlled AI video production pipeline with approval gates, version tracking, asset memory, and editor handoff.",
    director: "Ranjit",
    format: "9:16 Short Ad",
    mode: "Hybrid AI Production",
    stages: makeStages("coffee"),
    assets: [
      { name: "desk_plate_camera_a.mp4", type: "Real Footage", linkedStage: "Reference Assets", status: "Approved", source: "Manual Upload" },
      { name: "talking_cup_master_front.png", type: "AI Still", linkedStage: "Generated Still", status: "Submitted", source: "DALL-E" },
      { name: "coffee_cup_lipsync_v2.mov", type: "Generated Clip", linkedStage: "Video Generation", status: "Waiting", source: "Runway" },
      { name: "kitchen_ambient_sfx.wav", type: "Audio Asset", linkedStage: "Audio + Text", status: "Approved", source: "ElevenLabs" },
    ],
  },
  {
    title: "Judicial Custody Monologue",
    description:
      "Cinematic hybrid production pipeline for a controlled neo-noir monologue scene with real footage, AI enhancement, and staged review.",
    director: "Ranjit",
    format: "16:9 Short Film",
    mode: "Real Footage + GenAI Transformation",
    stages: makeStages("custody"),
    assets: [
      { name: "custody_room_plate_a.mp4", type: "Real Footage", linkedStage: "Reference Assets", status: "Submitted", source: "Manual Upload" },
      { name: "actor_closeup_take_02.mov", type: "Real Footage", linkedStage: "Video Generation", status: "Waiting", source: "Manual Upload" },
      { name: "custody_room_style_ref.png", type: "AI Still", linkedStage: "Generated Still", status: "Approved", source: "DALL-E" },
    ],
  },
];

export function makeStages(projectType: ProjectType): Stage[] {
  return [
    {
      title: "Concept", owner: "Director", defaultWorker: "Director", approvalAuthority: "Director", status: "Approved", tool: "Manual", method: "Creative Direction", executionMode: "Self-managed", assignedWorker: "Ranjit", accessLevel: "Full control",
      taskBrief: projectType === "coffee" ? "Define 9:16 talking coffee cup ad, hybrid AI style, length, product tone, and creative spine." : "Define 16:9 cinematic custody-room monologue, real footage + GenAI transformation, tone, length, and visual style.",
      description: "Project type, format, style, length, AR, and core direction.", notes: "Concept locks the project constitution before script begins.",
      versions: [{ label: "v1", status: "Approved", feedback: projectType === "coffee" ? "9:16 hybrid AI ad concept approved." : "16:9 neo-noir monologue concept approved.", submittedBy: "Director" }],
    },
    {
      title: "Script", owner: "Scriptwriter", defaultWorker: "Scriptwriter", approvalAuthority: "Director", status: "Submitted", tool: "ChatGPT / Gemini", method: "Text Generation", executionMode: "Assigned to worker", assignedWorker: "Creative Writer", accessLevel: "Submit versions only",
      taskBrief: "Create hook, beat structure, dialogue/VO, CTA, and timing plan.", description: "Hook, scene beats, dialogue, CTA, and timing.", notes: "Once script is approved, the production floor unlocks for parallel work.",
      versions: [{ label: "v1", status: "Submitted", feedback: "Initial script draft submitted for timing review.", submittedBy: "Creative Writer" }],
    },
    ...[
      ["Reference Assets", "AI Operator", "Manual Upload", "Asset Ingestion", "Upload product photos, footage plates, references, and brand files.", "Product images, real footage, character refs, brand files.", "Upload + comment only"],
      ["Generated Still", "Visual Artist", "DALL-E / Midjourney / Imagen", "Manual Upload or API Generation", "Generate still plates using approved references.", "Approved image plates and visual frames.", "Submit versions only"],
      ["Video Generation", "AI Video Operator", "Runway / Kling / Veo / Pika", "Manual Upload or API Generation", "Generate motion clips from approved stills and motion prompts.", "Motion generation from approved stills and prompts.", "Submit versions only"],
      ["Audio + Text", "Audio Artist", "ElevenLabs / Manual", "Voice, SFX, Captions, CTA", "Prepare voiceover, SFX, captions, hook text, CTA, and audio notes.", "Voiceover, SFX, music, subtitles, CTA, and on-screen text.", "Submit versions only"],
      ["Final Edit Handoff", "Editor", "Resolve / Premiere / FFmpeg", "Auto Assembly or Pro Editor Handoff", "Prepare approved clips, audio, text plan, notes, and final edit package.", "Approved clips, notes, assets, and edit package.", "Editor package access"],
    ].map(([title, worker, tool, method, taskBrief, description, accessLevel]) => ({
      title, owner: worker, defaultWorker: worker, approvalAuthority: "Director", status: "Locked" as const, tool, method, executionMode: "Assigned to worker", assignedWorker: worker, accessLevel, taskBrief, description,
      notes: title === "Final Edit Handoff" ? "Locked until Script is approved." : "Locked until Script is approved.",
      versions: [{ label: "v1", status: "Locked" as const, feedback: title === "Final Edit Handoff" ? "Waiting for production assets before editor handoff." : `Waiting for script approval before ${title === "Reference Assets" ? "asset intake" : title === "Generated Still" ? "image generation" : title === "Video Generation" ? "motion generation" : "audio/text production"}.`, submittedBy: worker }],
    })),
  ];
}
