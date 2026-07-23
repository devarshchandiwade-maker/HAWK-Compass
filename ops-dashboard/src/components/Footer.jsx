export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#09090b]">
      <div className="mx-auto max-w-6xl px-6 py-5">
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-1.5">
          <div
            className="h-1 w-1 rounded-full sm:hidden"
            style={{ background: "linear-gradient(135deg, #78c84d, #48ca02)" }}
          />
          <p className="text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Compass Dashboard. All rights reserved.
          </p>
          <span className="hidden text-slate-700 sm:inline">&middot;</span>
          <p className="text-center text-xs text-slate-500">
            Powered by{" "}
            <span
              className="font-semibold"
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Gozoop
            </span>{" "}
            <span className="font-semibold text-white">Group</span>
          </p>
        </div>
      </div>
    </footer>
  );
}