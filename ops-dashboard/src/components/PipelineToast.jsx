import { useEffect } from "react";
import { CheckCircle2, X, Plus, Pencil, Trash2, Upload } from "lucide-react";

export default function PipelineToast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const icons = {
    add: <Plus size={16} className="text-white" />,
    edit: <Pencil size={16} className="text-white" />,
    delete: <Trash2 size={16} className="text-white" />,
    import: <Upload size={16} className="text-white" />,
  };

  return (
    <div className="fixed bottom-5 right-5 z-[100] w-96 max-w-[calc(100vw-2rem)] animate-[toast-in_0.2s_ease-out]">
      <style>{`
        @keyframes toast-in{
          from{opacity:0;transform:translateY(10px)}
          to{opacity:1;transform:translateY(0)}
        }
      `}</style>

      <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#111113] p-4 shadow-2xl shadow-black/40">

        <div
          className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full"
          style={{
            background:
              toast.type === "delete"
                ? "linear-gradient(135deg,#ef4444,#dc2626)"
                : "linear-gradient(135deg,#78c84d,#48ca02)",
          }}
        >
          {icons[toast.type]}
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-white">
            {toast.title}
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {toast.message}
          </p>
        </div>

        <button
          onClick={onClose}
          className="rounded-md p-1 text-zinc-500 hover:bg-white/5 hover:text-white"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}