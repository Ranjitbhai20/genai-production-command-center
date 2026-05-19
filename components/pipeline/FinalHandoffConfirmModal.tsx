import type { FinalHandoffCheck } from "@/lib/pipelineLogic";

export function FinalHandoffConfirmModal({
  check,
  onCancel,
  onConfirm,
}: {
  check: FinalHandoffCheck;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-700 rounded-2xl p-6 shadow-2xl">
        <p className="text-sm text-zinc-500 mb-2">Final Handoff Check</p>

        <h2 className="text-2xl font-bold mb-4">
          Send to Final Edit Handoff?
        </h2>

        {check.missingStages.length === 0 ? (
          <div className="bg-green-950 border border-green-800 text-green-200 rounded-xl p-4 mb-5 text-sm">
            All required production stages are approved.
          </div>
        ) : (
          <div className="bg-yellow-950 border border-yellow-800 text-yellow-200 rounded-xl p-4 mb-5 text-sm">
            <p className="font-semibold mb-3">
              Some production stages are not approved yet:
            </p>

            <ul className="list-disc pl-5 space-y-1">
              {check.missingStages.map((stage) => (
                <li key={stage}>{stage}</li>
              ))}
            </ul>

            <p className="mt-4">
              Continue only if this is an intentional early/proxy handoff.
            </p>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 text-sm">
          <p className="text-zinc-500 mb-2">Approved visual stages</p>

          {check.approvedVisualStages.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1 text-zinc-300">
              {check.approvedVisualStages.map((stage) => (
                <li key={stage}>{stage}</li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-500">No visual production stages approved.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-zinc-200 hover:bg-zinc-800"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="bg-green-950 border border-green-800 rounded-xl p-3 text-green-200 hover:bg-green-900"
          >
            Confirm Handoff
          </button>
        </div>
      </div>
    </div>
  );
}