import type { Project } from "@/types/pipeline";
import { ProjectHeaderSmall } from "@/components/project/ProjectHeaderSmall";
import { statusStyle } from "@/lib/statusStyle";

function formatFileSize(size?: number) {
  if (!size) return "—";

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(date?: string) {
  if (!date) return "—";

  return new Date(date).toLocaleString();
}

export function AssetsView({ project }: { project: Project }) {
  return (
    <div>
      <ProjectHeaderSmall project={project} title="Assets" />

      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div>
            <p className="text-zinc-500">Total Assets</p>
            <p className="mt-1 text-xl font-semibold">
              {project.assets.length}
            </p>
          </div>

          <div>
            <p className="text-zinc-500">Project Status</p>
            <p className="mt-1 font-medium capitalize">
              {project.status.replace("_", " ")}
            </p>
          </div>

          <div>
            <p className="text-zinc-500">Production</p>
            <p className="mt-1 font-medium">{project.title}</p>
          </div>
        </div>
      </div>

      {project.assets.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-8 text-center">
          <p className="mb-2 text-lg font-semibold">
            No assets uploaded yet.
          </p>

          <p className="text-sm text-zinc-500">
            Uploaded production files, generated visuals, edit exports,
            references, and review assets will appear here.
          </p>
        </div>
      )}

      {project.assets.length > 0 && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {project.assets.map((asset) => (
            <div
              key={asset.id ?? asset.name}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="mb-2 text-xl font-semibold">
                    {asset.name}
                  </h2>

                  <p className="text-sm text-zinc-400">
                    {asset.type}
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs ${statusStyle(
                    asset.status
                  )}`}
                >
                  {asset.status}
                </span>
              </div>

              <div className="space-y-4 text-sm">
                <InfoRow
                  label="Asset ID"
                  value={asset.id ?? "Pending"}
                />

                <InfoRow
                  label="Linked Stage"
                  value={asset.linkedStage}
                />

                <InfoRow
                  label="Stage ID"
                  value={asset.stageId ?? "—"}
                />

                <InfoRow
                  label="Uploaded By"
                  value={asset.uploadedBy ?? "—"}
                />

                <InfoRow
                  label="File Size"
                  value={formatFileSize(asset.sizeBytes)}
                />

                <InfoRow
                  label="Created"
                  value={formatDate(asset.createdAt)}
                />

                <InfoRow
                  label="Updated"
                  value={formatDate(asset.updatedAt)}
                />

                <InfoRow
                  label="Storage Path"
                  value={asset.storagePath ?? "Not connected"}
                />

                <InfoRow
                  label="Source"
                  value={asset.source}
                />
              </div>

              {asset.publicUrl && (
                <div className="mt-5">
                  <a
                    href={asset.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm hover:bg-zinc-800"
                  >
                    Open Asset
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-3 last:border-b-0 last:pb-0">
      <span className="text-zinc-500">{label}</span>

      <span className="max-w-[60%] text-right font-medium text-zinc-200 break-all">
        {value}
      </span>
    </div>
  );
}