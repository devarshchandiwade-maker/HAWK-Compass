import { useState, useRef, useEffect } from "react";
import { Settings, LogOut, ChevronDown } from "lucide-react";

function UserMenu({ user, navigate, handleLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile */}
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1 hover:bg-zinc-800 transition border border-zinc-700"
      >
        <img
          src={user.photo}
          alt={user.name}
          className="h-10 w-10 rounded-full"
        />

        <div className="leading-tight">
          <div className="text-sm font-medium hover:text-color-">{user.name}</div>
          <div className="text-xs text-zinc-500">{user.email}</div>
        </div>

        <ChevronDown
          size={18}
          className={`text-zinc-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Dropdown */}
      {open && (
  <div className="absolute top-full right-0 mt-1 w-56 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl py-2 z-50">
    <button
      onClick={() => {
        setOpen(false);
        navigate("/settings");
      }}
      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors"
    >
      <Settings size={18} />
      Settings
    </button>

    <div className="mx-2 border-t border-zinc-700" />

    <button
      onClick={() => {
        setOpen(false);
        handleLogout();
      }}
      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
    >
      <LogOut size={18} />
      Logout
    </button>
  </div>
)}
    </div>
  );
}

export default UserMenu;