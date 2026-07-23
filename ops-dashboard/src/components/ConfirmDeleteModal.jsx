import { AlertTriangle, Trash2, X } from "lucide-react";

export default function ConfirmDeleteModal({
  open,
  title,
  message,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">

      <div className="w-[420px] rounded-2xl border border-zinc-800 bg-[#111113] shadow-2xl">

        <div className="flex items-start gap-4 p-6">

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15">
            <AlertTriangle className="text-red-500" size={24} />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">
              {title}
            </h3>

            <p className="mt-2 text-sm text-zinc-400">
              {message}
            </p>
          </div>

          <button
            onClick={onCancel}
            className="rounded-md p-1 text-zinc-500 hover:text-white"
          >
            <X size={18} />
          </button>

        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-800 px-6 py-4">

          <button
            onClick={onCancel}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <Trash2 size={16} />
            Delete
          </button>

        </div>

      </div>

    </div>
  );
}