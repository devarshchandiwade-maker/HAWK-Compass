import Spinner from "./Spinner";

// Full-page blocking overlay shown while a month is importing/parsing.
// Sits above everything (including the header controls) so the user can't
// fire a second import or navigate away mid-upload.
export default function ImportOverlay({ label = "Importing month…" }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/90 px-8 py-7 shadow-2xl shadow-black/40">
        <Spinner size={28} className="text-[#48ca02]" />
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        <p className="text-xs text-zinc-500">Parsing the sheet and updating brand totals…</p>
      </div>
    </div>
  );
}