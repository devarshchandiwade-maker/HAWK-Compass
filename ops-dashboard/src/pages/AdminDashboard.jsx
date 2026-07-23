import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  Users,
  LayoutGrid,
  LogOut,
  Save,
  CheckCircle2,
  X,
  UserPlus,
  User,
  ChevronDown 
} from "lucide-react";

import { getUsers, updatePermissions, addUser } from "../api/adminApi";
import { useNavigate } from "react-router-dom";

const FIELDS = [
  { key: "task_tracker", label: "Task Tracker" },
  { key: "retainers", label: "Retainers" },
  { key: "pipeline", label: "Pipeline" },
  { key: "sal_ret", label: "Sal / Ret" },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#78c84d] focus:ring-offset-2 focus:ring-offset-[#09090b] cursor-pointer ${
        checked ? "" : "bg-slate-700"
      }`}
      style={
        checked
          ? { background: "linear-gradient(135deg, #78c84d, #48ca02)" }
          : undefined
      }
    >
      <span
        className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow transition-all duration-200 ${
          checked ? "left-[18px]" : "left-[2px]"
        }`}
      />
    </button>
  );
}

function PermissionToast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] w-80 max-w-[calc(100vw-2.5rem)] animate-[toast-in_0.2s_ease-out]">
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#111113] p-4 shadow-2xl shadow-black/40">
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{ background: "linear-gradient(135deg, #78c84d, #48ca02)" }}
        >
          <CheckCircle2 size={16} className="text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">
            {toast.name} was allowed the following permissions
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {toast.granted.length > 0
              ? toast.granted.join(", ")
              : "No permissions are currently enabled"}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}



export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [toast, setToast] = useState(null);

  const [showModal, setShowModal] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "",
    email: ""
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to load users");
    }
  };

  const handleToggle = (index, field) => {
    const updated = [...users];
    updated[index][field] = updated[index][field] ? 0 : 1;
    setUsers(updated);
  };

  const saveUser = async (user) => {
    setSavingId(user.id);
    try {
      await updatePermissions(user.id, {
        task_tracker: user.task_tracker,
        retainers: user.retainers,
        pipeline: user.pipeline,
        sal_ret: user.sal_ret,
      });

      const granted = FIELDS.filter((f) => user[f.key] === 1).map(
        (f) => f.label
      );

      setToast({ id: Date.now(), name: user.name, granted });
    } catch (err) {
      console.error(err);
      alert("Failed to update permissions.");
    } finally {
      setSavingId(null);
    }
  };

  const handleLogout = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("admin");
  navigate("/admin");
};

const handleAddUser = async () => {

  try {

    await addUser(newUser);

    setShowModal(false);

    setNewUser({
      name: "",
      email: ""
    });

    loadUsers();

    alert("User added successfully.");

  } catch (err) {

    alert(
      err.response?.data?.message ||
      "Failed to add user."
    );

    console.log(err);
    console.log(err.response);

  }

};



const COMPASS_MARK =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgcm9sZT0iaW1nIiBhcmlhLWxhYmVsPSJDb21wYXNzIGljb24iPgogIDxkZWZzPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJuQiIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMyRDZDRjYiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMxRTRGRDYiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9Im5UIiB4MT0iMCIgeTE9IjEiIHgyPSIxIiB5Mj0iMCI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzE5QzZBNiIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzBFOUI4NiIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIHJ4PSI5NiIgZmlsbD0iIzE1Mjk0RCIvPgogIDxnPgogICAgPHBhdGggZD0iTSAyNzguNjkgNzEuMTkgQSAxODYuMjAgMTg2LjIwIDAgMCAxIDQ0MC44MSAyMzMuMzEgTSA0NDAuODEgMjc4LjY5IEEgMTg2LjIwIDE4Ni4yMCAwIDAgMSAyNzguNjkgNDQwLjgxIE0gMjMzLjMxIDQ0MC44MSBBIDE4Ni4yMCAxODYuMjAgMCAwIDEgNzEuMTkgMjc4LjY5IE0gNzEuMTkgMjMzLjMxIEEgMTg2LjIwIDE4Ni4yMCAwIDAgMSAyMzMuMzEgNzEuMTkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0U0RTlGMiIgc3Ryb2tlLXdpZHRoPSIxNC4yNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgICA8Y2lyY2xlIGN4PSIzODcuNjYiIGN5PSIxMjQuMzQiIHI9IjUuMjIiIGZpbGw9IiNFNEU5RjIiLz4KICAgIDxjaXJjbGUgY3g9IjM4Ny42NiIgY3k9IjM4Ny42NiIgcj0iNS4yMiIgZmlsbD0iI0U0RTlGMiIvPgogICAgPGNpcmNsZSBjeD0iMTI0LjM0IiBjeT0iMzg3LjY2IiByPSI1LjIyIiBmaWxsPSIjRTRFOUYyIi8+CiAgICA8Y2lyY2xlIGN4PSIxMjQuMzQiIGN5PSIxMjQuMzQiIHI9IjUuMjIiIGZpbGw9IiNFNEU5RjIiLz4KICAgIDxwYXRoIGQ9Ik0gMzM2LjYxIDE3NS4zOSBMIDI3MS40NSAyNjMuMzkgTCAyNjAuMDMgMjUxLjk3IFoiIGZpbGw9IiNEOERFRTgiLz4KICAgIDxwYXRoIGQ9Ik0gMzM2LjYxIDE3NS4zOSBMIDI2MC4wMyAyNTEuOTcgTCAyNDguNjEgMjQwLjU1IFoiIGZpbGw9IiNBRUI3QzciLz4KICAgIDxwYXRoIGQ9Ik0gMzM2LjYxIDMzNi42MSBMIDI0OC42MSAyNzEuNDUgTCAyNjAuMDMgMjYwLjAzIFoiIGZpbGw9IiNEOERFRTgiLz4KICAgIDxwYXRoIGQ9Ik0gMzM2LjYxIDMzNi42MSBMIDI2MC4wMyAyNjAuMDMgTCAyNzEuNDUgMjQ4LjYxIFoiIGZpbGw9IiNBRUI3QzciLz4KICAgIDxwYXRoIGQ9Ik0gMTc1LjM5IDMzNi42MSBMIDI0MC41NSAyNDguNjEgTCAyNTEuOTcgMjYwLjAzIFoiIGZpbGw9IiNEOERFRTgiLz4KICAgIDxwYXRoIGQ9Ik0gMTc1LjM5IDMzNi42MSBMIDI1MS45NyAyNjAuMDMgTCAyNjMuMzkgMjcxLjQ1IFoiIGZpbGw9IiNBRUI3QzciLz4KICAgIDxwYXRoIGQ9Ik0gMTc1LjM5IDE3NS4zOSBMIDI2My4zOSAyNDAuNTUgTCAyNTEuOTcgMjUxLjk3IFoiIGZpbGw9IiNEOERFRTgiLz4KICAgIDxwYXRoIGQ9Ik0gMTc1LjM5IDE3NS4zOSBMIDI1MS45NyAyNTEuOTcgTCAyNDAuNTUgMjYzLjM5IFoiIGZpbGw9IiNBRUI3QzciLz4KICAgIDxwYXRoIGQ9Ik0gMjU2LjAwIDM1LjYwIEwgMjgwLjcwIDI0OC40MCBMIDI1Ni4wMCAyNDguNDAgWiIgZmlsbD0iI0Q4REVFOCIvPgogICAgPHBhdGggZD0iTSAyNTYuMDAgMzUuNjAgTCAyNTYuMDAgMjQ4LjQwIEwgMjMxLjMwIDI0OC40MCBaIiBmaWxsPSIjQUVCN0M3Ii8+CiAgICA8cGF0aCBkPSJNIDQ3Ni40MCAyNTYuMDAgTCAyNjMuNjAgMjgwLjcwIEwgMjYzLjYwIDI1Ni4wMCBaIiBmaWxsPSIjRDhERUU4Ii8+CiAgICA8cGF0aCBkPSJNIDQ3Ni40MCAyNTYuMDAgTCAyNjMuNjAgMjU2LjAwIEwgMjYzLjYwIDIzMS4zMCBaIiBmaWxsPSIjQUVCN0M3Ii8+CiAgICA8cGF0aCBkPSJNIDI1Ni4wMCA0NzYuNDAgTCAyMzEuMzAgMjYzLjYwIEwgMjU2LjAwIDI2My42MCBaIiBmaWxsPSIjRDhERUU4Ii8+CiAgICA8cGF0aCBkPSJNIDI1Ni4wMCA0NzYuNDAgTCAyNTYuMDAgMjYzLjYwIEwgMjgwLjcwIDI2My42MCBaIiBmaWxsPSIjQUVCN0M3Ii8+CiAgICA8cGF0aCBkPSJNIDM1LjYwIDI1Ni4wMCBMIDI0OC40MCAyMzEuMzAgTCAyNDguNDAgMjU2LjAwIFoiIGZpbGw9IiNEOERFRTgiLz4KICAgIDxwYXRoIGQ9Ik0gMzUuNjAgMjU2LjAwIEwgMjQ4LjQwIDI1Ni4wMCBMIDI0OC40MCAyODAuNzAgWiIgZmlsbD0iI0FFQjdDNyIvPgogICAgPHBhdGggZD0iTSAzNzUuNTEgMTIzLjI3IEwgMjc0LjM2IDI3Mi41MyBMIDIzNy42NCAyMzkuNDcgWiIgZmlsbD0idXJsKCNuQikiLz4KICAgIDxwYXRoIGQ9Ik0gMTU1LjU2IDM2Ny41NSBMIDI3NC4zNiAyNzIuNTMgTCAyMzcuNjQgMjM5LjQ3IFoiIGZpbGw9InVybCgjblQpIi8+CiAgICA8Y2lyY2xlIGN4PSIyNTYuMDAiIGN5PSIyNTYuMDAiIHI9IjM4LjAwIiBmaWxsPSIjRjJGNUZBIi8+CiAgICA8Y2lyY2xlIGN4PSIyNTYuMDAiIGN5PSIyNTYuMDAiIHI9IjE4LjA1IiBmaWxsPSIjMEUxRjNEIi8+CiAgICA8Y2lyY2xlIGN4PSIyNTYuMDAiIGN5PSIyNTYuMDAiIHI9IjE4LjA1IiBmaWxsPSJub25lIiBzdHJva2U9IiNGMkY1RkEiIHN0cm9rZS13aWR0aD0iMi4zOCIvPgogIDwvZz4KPC9zdmc+";



function CompassMark({ size = 32 }) {
  return (
    <img
      src={COMPASS_MARK}
      width={size}
      height={size}
      alt="Compass"
      draggable={false}
      style={{
        boxShadow: "0 6px 18px -8px rgba(45,108,246,.65)",
        borderRadius: size * 0.19,
      }}
    />
  );
}


function AdminMenu({ onAddUser, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
 
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
 
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-sm text-slate-200 transition-colors hover:bg-white/[0.06] cursor-pointer"
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: "linear-gradient(135deg, #78c84d, #48ca02)" }}
        >
          <User size={15} className="text-white" />
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
 
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#111113] shadow-2xl shadow-black/40">
          <button
            onClick={() => {
              setOpen(false);
              onAddUser();
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-white/[0.05] cursor-pointer"
          >
            <UserPlus size={15} className="text-[#78c84d]" />
            Add User
          </button>
 
          <div className="h-px bg-white/10" />
 
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#09090b]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg">
              <CompassMark size={32} />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight text-white">
                Admin Dashboard
              </h1>
              <p className="text-xs text-slate-400">Manage user permissions</p>
            </div>
          </div>

          <AdminMenu
        onAddUser={() => setShowModal(true)}
        onLogout={handleLogout}
      />
        </div>

      </header>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Users</p>
              <h2 className="mt-0.5 text-2xl font-semibold text-white">
                {users.length}
              </h2>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
              <Users size={18} className="text-indigo-400" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
            <div>
              <p className="text-xs font-medium text-slate-400">
                Dashboard Modules
              </p>
              <h2 className="mt-0.5 text-2xl font-semibold text-white">4</h2>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <LayoutGrid size={18} className="text-emerald-400" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
            <div>
              <p className="text-xs font-medium text-slate-400">
                Access Level
              </p>
              <h2 className="mt-0.5 text-2xl font-semibold text-white">
                Admin
              </h2>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
              <ShieldCheck size={18} className="text-amber-400" />
            </div>
          </div>
        </div>

        {/* Permissions table */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-white">
              User Permissions
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-2.5 font-medium">User</th>
                  {FIELDS.map((f) => (
                    <th key={f.key} className="px-3 py-2.5 text-center font-medium">
                      {f.label}
                    </th>
                  ))}
                  <th className="px-5 py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-300">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-white">
                            {user.name}
                          </div>
                          <div className="truncate text-xs text-slate-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {FIELDS.map((f) => (
                      <td key={f.key} className="px-3 py-2.5 text-center">
                        <div className="flex justify-center">
                          <Toggle
                            checked={user[f.key] === 1}
                            onChange={() => handleToggle(index, f.key)}
                          />
                        </div>
                      </td>
                    ))}

                    <td className="px-5 py-2.5 text-right">
                      <button
                        onClick={() => saveUser(user)}
                        disabled={savingId === user.id}
                        style={{
                          background:
                            "linear-gradient(135deg, #78c84d, #48ca02)",
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                      >
                        <Save size={13} />
                        {savingId === user.id ? "Saving…" : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={FIELDS.length + 2} className="px-5 py-10 text-center text-sm text-slate-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {
showModal && (

<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">

<div className="w-full max-w-md rounded-xl bg-[#111113] border border-white/10 p-6">

<h2 className="text-xl font-semibold text-white mb-5">
Add User
</h2>

<div className="space-y-4">

<input
type="text"
placeholder="Name"
value={newUser.name}
onChange={(e)=>
setNewUser({
...newUser,
name:e.target.value
})
}
className="w-full rounded-lg border border-white/10 bg-[#1b1b1d] px-4 py-3 text-white outline-none"
/>

<input
type="email"
placeholder="Email"
value={newUser.email}
onChange={(e)=>
setNewUser({
...newUser,
email:e.target.value
})
}
className="w-full rounded-lg border border-white/10 bg-[#1b1b1d] px-4 py-3 text-white outline-none"
/>

<div className="flex justify-end gap-3 pt-2">

<button
onClick={()=>{
setShowModal(false);
}}
className="rounded-lg border border-white/10 px-4 py-2 text-white"
>
Cancel
</button>

<button
onClick={handleAddUser}
style={{
background:
"linear-gradient(135deg,#78c84d,#48ca02)"
}}
className="rounded-lg px-5 py-2 text-white"
>
Save
</button>

</div>

</div>

</div>

</div>

)
}

      <PermissionToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}