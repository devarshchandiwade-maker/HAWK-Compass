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
        className="flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1 hover:bg-zinc-100 transition"
      >
        <img
          src={user.photo}
          alt={user.name}
          className="h-10 w-10 rounded-full"
        />

        <div className="leading-tight">
          <div className="text-sm font-medium">{user.name}</div>
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
        <div className="absolute right-0 mt-2 w-52 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden z-50">
          <button
            onClick={() => {
              setOpen(false);
              navigate("/settings");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-zinc-100 transition"
          >
            <Settings size={18} />
            Settings
          </button>

          <button
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
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