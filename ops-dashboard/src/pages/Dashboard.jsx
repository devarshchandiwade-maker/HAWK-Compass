import React, { useState, useEffect, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import {
  ListChecks,
  FileSpreadsheet,
  GitBranch,
  Plus,
  Image as ImageIcon,
  Upload,
  X,
  Trash2,
  Check,
  AlertTriangle,
  Clock,
  Loader2,
  Sparkles,
  Pencil,
  IndianRupee,
  CalendarClock,
  Percent,
  Lock,
  Unlock,
  Search,
  Target,
  Users,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  ClipboardPaste,
  Building2,
  Tag,
  CheckCircle2, XCircle, Repeat, Briefcase, Wallet, Flame, ChevronLeft, ChevronRight, Pill
} from "lucide-react";
import {
  fetchTasks,
  createTask,
  editTask,
  removeTask,
} from "../services/taskService";

import {
  fetchRetainers,
  createRetainer,
  editRetainer,
  removeRetainer,
  clearRetainers,
} from "../api/retainerApi";

import {
  fetchPipeline,
  createLead,
  editLead,
  removeLead,
  importPipeline,
} from "../services/pipelineService";

import {
  fetchOwners,
  createOwner,
  removeOwner,
} from "../services/ownerService";

import { fetchUsers } from "../services/userService";

import { extractTasksFromImage, getSalaryInsight } from "../api/aiApi";

import Login from "./Login";
import { getPermissions } from "../api/authApi";
import { useNavigate } from "react-router-dom";

import PipelineToast from "../components/PipelineToast";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import UserMenu from "../components/UserMenu";
import Salretview from "../components/Salretview"

import * as api from "../api/salretApi";
import ImportOverlay from "../components/Importoverlay";


/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const uid = () => Math.random().toString(36).slice(2, 10);

const store = {
  async get(key, fallback) {
    try {
      const r = await window.storage.get(key);
      return r ? JSON.parse(r.value) : fallback;
    } catch {
      return fallback;
    }
  },
  async set(key, value) {
    try {
      await window.storage.set(key, JSON.stringify(value));
    } catch (e) {
      console.error("storage set failed", e);
    }
  },
};

// const inr = (n) =>
//   "₹" +
//   new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
//     Number(n) || 0,
//   );

// short Indian form for big totals: ₹1.2 Cr / ₹45 L
const inrShort = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e7) return "₹" + (v / 1e7).toFixed(2).replace(/\.00$/, "") + " Cr";
  if (v >= 1e5) return "₹" + (v / 1e5).toFixed(1).replace(/\.0$/, "") + " L";
  return inr(v);
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return Math.ceil((d - new Date().setHours(0, 0, 0, 0)) / 86400000);
};

const fmtDate = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fileToBase64 = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("Could not read the file"));
    r.readAsDataURL(file);
  });

/* ------------------------------------------------------------------ */
/* config                                                             */
/* ------------------------------------------------------------------ */

const DEFAULT_OWNERS = [
  "Manjyot",
  "Sales Team",
  "COO",
  "Anuj",
  "David",
  "Isha",
  "Onkar",
  "Tanvi",
  "Unassigned",
];

const TASK_STATUS = {
  "To Do": "bg-zinc-700 text-zinc-100",
  "In Progress": "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/40",
  "On Hold": "bg-amber-600/20 text-amber-300 ring-1 ring-amber-500/40",
  Blocked: "btn-primary/20 text-red-300 ring-1 ring-red-500/40",
  Done: "bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-500/40",
};
const TASK_STATUSES = Object.keys(TASK_STATUS);

const PRIORITY = {
  Low: "text-zinc-400",
  Medium: "text-amber-400",
  High: "text-red-400",
};

const STAGES = ["New", "Pending (Our End)", "Pending (Client)", "Won", "Lost"];
const STAGE_COLOR = {
  New: "#a1a1aa",
  "Pending (Our End)": "#f59e0b",
  "Pending (Client)": "#3b82f6",
  Won: "#10b981",
  Lost: "#ef4444",
};

/* ------------------------------------------------------------------ */
/* small UI atoms                                                      */
/* ------------------------------------------------------------------ */

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500";

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8">
      <div
        className={`relative w-full ${wide ? "max-w-2xl" : "max-w-lg"} rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* APP                                                                 */
/* ================================================================== */

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

export default function App() {
  const [tab, setTab] = useState("tasks");
  const [tasks, setTasks] = useState([]);
  const [retainers, setRetainers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [owners, setOwners] = useState([]);
  const [users, setUsers] = useState([]);

  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [open, setOpen] = useState(false);

  const menuRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadPermissions() {
      try {
        const res = await getPermissions();
        setPermissions(res.data);
      } catch (err) {
        console.error(err);
      }
    }

    loadPermissions();
  }, []);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const data = await fetchUsers();
    setUsers(data);
  };

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // useEffect(() => {
  //   (async () => {
  //     setTasks(await store.get("ops:tasks", []));
  //     setRetainers(await store.get("ops:retainers", []));
  //     setLeads(await store.get("ops:leads", []));
  //     setOwners(await store.get("ops:owners", DEFAULT_OWNERS));
  //     setLoaded(true);
  //   })();
  // }, []);

  useEffect(() => {
    async function loadTasks() {
      try {
        const data = await fetchTasks();
        setTasks(data);
      } catch (err) {
        console.error(err);
      }
    }

    loadTasks();
  }, []);
  useEffect(() => {
    if (loaded) store.set("ops:tasks", tasks);
  }, [tasks, loaded]);

  // useEffect(() => {
  //   if (loaded) store.set("ops:retainers", retainers);
  // }, [retainers, loaded]);
  // useEffect(() => {
  //   if (loaded) store.set("ops:leads", leads);
  // }, [leads, loaded]);

  useEffect(() => {
    if (loaded) store.set("ops:owners", users);
  }, [users, loaded]);

  useEffect(() => {
    async function loadRetainers() {
      try {
        const data = await fetchRetainers();
        setRetainers(
          data.map((r) => ({
            ...r,
            startDate: r.start_date,
            endDate: r.end_date,
          })),
        );
      } catch (err) {
        console.error(err);
      }
    }

    loadRetainers();
  }, []);

  useEffect(() => {
    async function loadPipeline() {
      try {
        const data = await fetchPipeline();
        setLeads(data);
      } catch (err) {
        console.error(err);
      }
    }

    loadPipeline();
  }, []);

  const tabs = [];

  if (permissions.task_tracker) {
    tabs.push({
      id: "tasks",
      label: "Task Tracker",
      icon: ListChecks,
    });
  }

  if (permissions.retainers) {
    tabs.push({
      id: "retainers",
      label: "Retainers",
      icon: FileSpreadsheet,
    });
  }

  if (permissions.pipeline) {
    tabs.push({
      id: "pipeline",
      label: "Pipeline",
      icon: GitBranch,
    });
  }

  if (permissions.sal_ret) {
    tabs.push({
      id: "salret",
      label: "Sal/Ret",
      icon: Percent,
    });
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div
      className="app-bg min-h-screen text-zinc-100"
      style={{
        fontFamily:
          "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
    >
      {/* header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <CompassMark size={32} />
            <div>
              <div className="text-[20px] font-semibold leading-none tracking-tight">
                Compass
              </div>
            </div>
          </div>
          <nav className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
            {tabs.map((t) => {
              const I = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "btn-primary text-white"
                      : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  <I size={14} /> {t.label}
                </button>
              );
            })}
          </nav>

          <UserMenu
            user={user}
            navigate={navigate}
            handleLogout={handleLogout}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === "tasks" && permissions.task_tracker === 1 && (
          <TasksView
            tasks={tasks}
            setTasks={setTasks}
            users={users}
            setUsers={setUsers}
          />
        )}
        {tab === "retainers" && permissions.retainers === 1 && (
          <RetainersView retainers={retainers} setRetainers={setRetainers} />
        )}

        {tab === "pipeline" && permissions.pipeline === 1 && (
          <PipelineView leads={leads} setLeads={setLeads} users={users} />
        )}

        {tab === "salret" && permissions.sal_ret === 1 && <SalRetView />}
      </main>
    </div>
  );
}

/* ================================================================== */
/* TASKS                                                               */
/* ================================================================== */

function TasksView({ tasks, setTasks, users, setUsers }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [query, setQuery] = useState("");
  const [hideDone, setHideDone] = useState(false);
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const save = async (task) => {
    try {
      const payload = {
        title: task.title,
        assignee: task.assignee,
        user_id: task.user_id,
        priority: task.priority,
        status: task.status,
        due_date: task.dueDate,
        notes: task.notes,
      };

      if (task.id) {
        const data = await editTask(task.id, payload);
        setTasks(data);
        setToast({
          type: "edit",
          title: "Task Updated",
          message: `"${task.title}" has been updated successfully.`,
        });
      } else {
        const data = await createTask(payload);
        setTasks(data);
        setToast({
          type: "add",
          title: "Task Added",
          message: `"${task.title}" has been added successfully.`,
        });
      }

      setShowForm(false);
      setEditing(null);
    } catch (e) {
      console.error(e);
      alert("Failed to save task");
    }
  };

  const remove = async (task) => {
    try {
      const data = await removeTask(task.id);

      setTasks(data);

      setToast({
        type: "delete",
        title: "Task Deleted",
        message: `"${task.title}" has been deleted successfully.`,
      });

      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete task");
    }
  };

  const addMany = async (items) => {
    try {
      for (const task of items.filter((t) => t._keep)) {
        await createTask({
          title: task.title || "",

          assignee: users.map((u) => u.name).includes(task.assignee)
            ? task.assignee
            : "Unassigned",

          priority: ["Low", "Medium", "High"].includes(task.priority)
            ? task.priority
            : "Medium",

          status: "To Do",

          due_date: task.dueDate || new Date().toISOString().split("T")[0],

          notes: task.notes || "",
        });
      }

      // Reload tasks from MySQL
      const updatedTasks = await fetchTasks();

      setTasks(updatedTasks);
      const importedCount = items.filter(t => t._keep).length;

      setToast({
        type: "import",
        title: "AI Import Complete",
        message: `${importedCount} task${importedCount !== 1 ? "s" : ""} imported successfully.`,
      });
      setShowAI(false);
    } catch (err) {
      console.error(err);

      setToast({
        type: "error",
        title: "Import Failed",
        message: err?.response?.data?.message || "Failed to import tasks.",
      });
    }
  };

  const cycleStatus = async (task) => {
    const confirmed = window.confirm(`Change status of "${task.title}"?`);

    if (!confirmed) return;

    const idx = TASK_STATUSES.indexOf(task.status);

    const next = TASK_STATUSES[(idx + 1) % TASK_STATUSES.length];

    try {
      const updated = await editTask(task.id, {
        title: task.title,
        assignee: task.assignee,
        priority: task.priority,
        status: next,
        due_date: task.dueDate,
        notes: task.notes,
      });

      setTasks(updated);
    } catch (err) {
      console.error(err);

      alert("Failed to update status.");
    }
  };

  const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };
  const STATUS_RANK = {
    "To Do": 0,
    "In Progress": 1,
    "On Hold": 2,
    Blocked: 3,
    Done: 4,
  };
  const sortVal = (t, key) => {
    switch (key) {
      case "title":
        return (t.title || "").toLowerCase();
      case "assignee":
        return (t.assignee || "").toLowerCase();
      case "priority":
        return PRIORITY_RANK[t.priority] ?? 9;
      case "due":
        return t.dueDate ? new Date(t.dueDate).getTime() : Infinity;
      case "status":
        return STATUS_RANK[t.status] ?? 9;
      default:
        return 0;
    }
  };
  const toggleSort = (key) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );

  const view = tasks
    .filter(
      (t) =>
        (filterAssignee === "All" || t.assignee === filterAssignee) &&
        (filterStatus === "All" || t.status === filterStatus) &&
        (filterPriority === "All" || t.priority === filterPriority) &&
        (!query.trim() ||
          (t.title || "").toLowerCase().includes(query.trim().toLowerCase())) &&
        (!hideDone || t.status !== "Done"),
    )
    .slice()
    .sort((a, b) => {
      // completed tasks always sink to the bottom
      const ad = a.status === "Done",
        bd = b.status === "Done";
      if (ad !== bd) return ad ? 1 : -1;
      if (sort.key) {
        const av = sortVal(a, sort.key),
          bv = sortVal(b, sort.key);
        if (av < bv) return sort.dir === "asc" ? -1 : 1;
        if (av > bv) return sort.dir === "asc" ? 1 : -1;
      }
      return 0;
    });
  const doneCount = tasks.filter((t) => t.status === "Done").length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Task Tracker</h2>
          
        </div>
        <div className="flex gap-2">
          {/* <button
            onClick={() => setShowOwners(true)}
            className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
          >
            <Users size={14} /> Owners
          </button> */}
          <button
            onClick={() => setShowAI(true)}
            className="flex items-center gap-1.5 rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-xs font-medium acc-text hover:bg-green-500/20"
          >
            <Sparkles size={14} /> Import from image
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 rounded-md btn-primary px-3 py-2 text-xs font-medium text-white hover:bg-green-500"
          >
            <Plus size={14} /> New task
          </button>
        </div>
      </div>

      {/* filters */}
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Owner
          </span>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className={inputCls + " w-auto"}
          >
            <option>All</option>
            {users.map((user) => (
              <option key={user.id} value={user.name}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Status
          </span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={inputCls + " w-auto"}
          >
            <option>All</option>
            {TASK_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Priority
          </span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className={inputCls + " w-auto"}
          >
            <option>All</option>
            {["High", "Medium", "Low"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block min-w-[160px] flex-1">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Task
          </span>
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-2.5 text-zinc-500"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks…"
              className={inputCls + " pl-9"}
            />
          </div>
        </label>
        <button
          onClick={() => setHideDone((v) => !v)}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium ${hideDone ? "border-green-500/40 bg-green-500/10 acc-text" : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"}`}
        >
          <Check size={14} /> {hideDone ? "Completed hidden" : "Hide completed"}
          {doneCount ? ` (${doneCount})` : ""}
        </button>
      </div>

      {view.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={
            tasks.length === 0
              ? "No tasks yet"
              : "Nothing matches these filters"
          }
          hint={
            tasks.length === 0
              ? "Add a task, or drop in a screenshot and let AI pull the tasks out."
              : "Try clearing the filters above, or show completed tasks."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <tr>
                <SortTh
                  label="Task"
                  k="title"
                  sort={sort}
                  onSort={toggleSort}
                />
                <SortTh
                  label="Owner"
                  k="assignee"
                  sort={sort}
                  onSort={toggleSort}
                />
                <SortTh
                  label="Priority"
                  k="priority"
                  sort={sort}
                  onSort={toggleSort}
                />
                <SortTh label="Due" k="due" sort={sort} onSort={toggleSort} />
                <SortTh
                  label="Status"
                  k="status"
                  sort={sort}
                  onSort={toggleSort}
                />
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {view.map((t) => {
                const du = daysUntil(t.dueDate);
                return (
                  <tr
                    key={t.id}
                    className="border-t border-zinc-800/70 hover:bg-zinc-900/40"
                  >
                    <td className="px-4 py-3">
                      <div
                        className={`font-medium ${t.status === "Done" ? "text-zinc-500 line-through" : "text-zinc-100"}`}
                      >
                        {t.title}
                      </div>
                      {t.notes && (
                        <div className="mt-0.5 text-xs text-zinc-500">
                          {t.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{t.assignee}</td>
                    <td
                      className={`px-4 py-3 font-medium ${PRIORITY[t.priority]}`}
                    >
                      {t.priority}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {t.dueDate ? (
                        <span
                          className={
                            du != null && du < 0 && t.status !== "Done"
                              ? "text-red-400"
                              : ""
                          }
                        >
                          {fmtDate(t.dueDate)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        // onClick={() => cycleStatus(t)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${TASK_STATUS[t.status]}`}
                      >
                        {t.status}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing(t);
                            setShowForm(true);
                          }}
                          className="rounded p-1 text-zinc-500 hover:text-zinc-200"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(t)}
                          className="rounded p-1 text-zinc-500 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <TaskForm
          task={editing}
          onSave={save}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          users={users}
        />
      )}
      {/* {showOwners && (
        <OwnersModal
          owners={owners}
          setOwners={setOwners}
          onClose={() => setShowOwners(false)}
        />
      )} */}
      {showAI && (
        <AIImportModal
          kind="task"
          onClose={() => setShowAI(false)}
          onConfirm={addMany}
          setToast={setToast}
        />
      )}

      <ConfirmDeleteModal
        open={!!confirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${confirmDelete?.title}"? This action cannot be undone.`}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => remove(confirmDelete)}
      />

      <PipelineToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function SortTh({ label, k, sort, onSort }) {
  const active = sort.key === k;
  return (
    <th className="px-4 py-2.5 font-medium">
      <button
        onClick={() => onSort(k)}
        className={`flex items-center gap-1 uppercase tracking-wider transition hover:text-zinc-300 ${active ? "text-zinc-200" : ""}`}
      >
        {label}
        {active ? (
          sort.dir === "asc" ? (
            <ChevronUp size={12} />
          ) : (
            <ChevronDown size={12} />
          )
        ) : (
          <ArrowUpDown size={11} className="opacity-40" />
        )}
      </button>
    </th>
  );
}

function TaskForm({ task, onSave, onClose, users }) {
  console.log("Users:", users);
  const [error, setError] = useState("");

  const validate = () => {
  if (!f.title.trim()) {
    setError("Task is required.");
    return false;
  }

  if (!f.user_id) {
    setError("Owner is required.");
    return false;
  }

  if (!f.priority) {
    setError("Priority is required.");
    return false;
  }

  if (!f.status) {
    setError("Status is required.");
    return false;
  }

  if (!f.dueDate) {
    setError("Due date is required.");
    return false;
  }

  setError("");
  return true;
};

  const formatDate = (date) => {
    if (!date) return "";

    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const [f, setF] = useState(
    task
      ? {
          ...task,
          user_id: task.user_id || "",
          dueDate: formatDate(task.dueDate),
        }
      : {
          title: "",
          assignee: "",
          user_id: "",
          status: "To Do",
          priority: "Medium",
          dueDate: "",
          notes: "",
        },
  );
  const today = new Date().toISOString().split("T")[0];
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  console.log(task);

  const errorCls = (field) =>
  error.includes(field)
    ? "border-red-500 ring-1 ring-red-500"
    : "";

  return (
    <Modal title={task ? "Edit task" : "New task"} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Task">
          <input
            autoFocus
            className={`${inputCls} ${errorCls("Task")}`}
            value={f.title}
            onChange={(e) => {set("title", e.target.value); setError("")}}
            placeholder="What needs doing?"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Owner">
            <select
              className={`${inputCls} ${errorCls("Owner")}`}
              value={f.user_id}
              onChange={(e) => {
                const selected = users.find(
                  (u) => u.id === Number(e.target.value)
                );

                setF((prev) => ({
                  ...prev,
                  user_id: selected ? selected.id : "",
                  assignee: selected ? selected.name : "",
                }));

                setError("");
              }}
            >
              <option value="">Select Owner</option>

              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select
              className={`${inputCls} ${errorCls("Priority")}`}
              value={f.priority}
              onChange={(e) => {set("priority", e.target.value); setError("");}}
            >
              {["Low", "Medium", "High"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className={`${inputCls} ${errorCls("Status")}`}
              value={f.status}
              onChange={(e) => {set("status", e.target.value); setError("");}}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Due date">
            <input
              type="date"
              className={`${inputCls} ${errorCls("Due date")}
                [&::-webkit-calendar-picker-indicator]:opacity-80
                [&::-webkit-calendar-picker-indicator]:invert
                [&::-webkit-calendar-picker-indicator]:sepia
                [&::-webkit-calendar-picker-indicator]:saturate-0
                [&::-webkit-calendar-picker-indicator]:brightness-200
              `}
              value={f.dueDate}
              min={today}
              onChange={(e) => {set("dueDate", e.target.value); setError("");}}
            />
          </Field>
        </div>
        <Field label="Notes">
          <textarea
            rows={2}
            className={inputCls}
            value={f.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
                if (!validate()) return;
                console.log("Saving Task:", f);
                if (f.title.trim()) onSave(f);
            }}
            className="rounded-md btn-primary px-4 py-2 text-xs font-medium text-white hover:bg-red-500"
          >
            {task ? "Save changes" : "Add task"}
          </button>
        </div>
      </div>

      {error && (
  <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400 animate-in fade-in">
    <div className="flex items-center gap-2">
      <svg
        className="h-5 w-5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3m0 4h.01M10.29 3.86l-8 14A1 1 0 003.14 19h17.72a1 1 0 00.85-1.5l-8-14a1 1 0 00-1.72 0z"
        />
      </svg>

      <span>{error}</span>
    </div>
  </div>
)}
    </Modal>
  );
}

/* ---- AI image import ---- */

function OwnersModal({ owners, setOwners, onClose }) {
  const [name, setName] = useState("");
  const add = async () => {
    const n = name.trim();

    if (!n || owners.some((o) => o.name === n)) {
      setName("");
      return;
    }

    try {
      const data = await createOwner({
        name: n,
      });

      setOwners(data);
      setName("");
    } catch (err) {
      console.error(err);
      console.log(err.response?.data);
      alert(err.response?.data?.message || err.message);
    }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this owner?")) return;

    try {
      const data = await removeOwner(id);
      setOwners(data);
    } catch (err) {
      console.error(err);
      alert("Failed to delete owner");
    }
  };
  return (
    <Modal title="Task owners" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs text-zinc-500">
          These names fill the owner dropdowns across Tasks and Pipeline.
          Changes save automatically.
        </p>
        <div className="flex gap-2">
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add a name…"
          />
          <button
            onClick={add}
            className="whitespace-nowrap rounded-md btn-primary px-4 py-2 text-xs font-medium text-white hover:bg-red-500"
          >
            Add
          </button>
        </div>
        <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
          {owners.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2"
            >
              <span className="text-sm text-zinc-200">{o.name}</span>

              <button
                onClick={() => remove(o.id)}
                className="rounded p-1 text-zinc-500 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {owners.length === 0 && (
            <div className="py-4 text-center text-xs text-zinc-500">
              No owners yet — add one above.
            </div>
          )}
        </div>
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

const IMPORT_CONFIG = {
  task: {
    title: "Import tasks",
    noun: "task",
    reading: "Reading the tasks…",
    empty: "No tasks were found. Try a clearer screenshot or paste.",
    fail: "Couldn't read tasks from that. It may be too large or unclear — try again.",
    prompt:
      "This image or text contains one or more work tasks (could be a WhatsApp message, email, note, or list). " +
      "Extract every actionable task. Return ONLY a JSON array, no markdown, no commentary. " +
      'Each item: {"title": string, "assignee": string or null, "priority": "Low"|"Medium"|"High", "dueDate": "YYYY-MM-DD" or null, "notes": string or null}. ' +
      "Infer priority from urgency words. If no tasks are present, return [].",
  },
  lead: {
    title: "Import leads",
    noun: "lead",
    reading: "Reading the leads…",
    empty: "No leads were found. Try a clearer screenshot or paste.",
    fail: "Couldn't read leads from that. It may be too large or unclear — try again.",
    prompt:
      "This image or text contains one or more sales leads, deals, or pipeline updates (WhatsApp, email, CRM note, or list). " +
      "Extract every lead. Return ONLY a JSON array, no markdown, no commentary. " +
      'Each item: {"name": short deal or lead name (string), "company": string or null, "value": number in INR digits only or null, "stage": one of "New"|"Pending (Our End)"|"Pending (Client)"|"Won"|"Lost", "owner": string or null, "notes": string or null}. ' +
      'Infer the stage from context; default to "New". If none are present, return [].',
  },
};

function AIImportModal({ kind = "task", onClose, onConfirm, setToast }) {
  const cfg = IMPORT_CONFIG[kind];
  const [phase, setPhase] = useState("upload"); // upload | working | review | error
  const [preview, setPreview] = useState(null);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [hint, setHint] = useState("");
  const inputRef = useRef();

  const run = async (source) => {
    if (!source) return;

    setPhase("working");

    try {
      // ---------- IMAGE IMPORT ----------
      if (source.type === "image") {
        setPreview(URL.createObjectURL(source.file));

        const parsed = await extractTasksFromImage(source.file);
        console.log(parsed);
        console.log(parsed.tasks);

        const imported =
          kind === "task" ? parsed.tasks || [] : parsed.leads || [];

        if (imported.length === 0) {
          setErr(cfg.empty);

          setToast?.({
            type: "error",
            title: "Nothing Found",
            message: cfg.empty,
          });

          setPhase("error");
          return;
        }

        setItems(
          imported.map((i) => ({
            ...i,
            _keep: true,
          })),
        );

        setPhase("review");
        return;
      }

      // ---------- TEXT IMPORT (keep existing AI if needed) ----------
      setPreview(null);

      // You can migrate text import later.
      setErr("Text import is not migrated yet.");
      setPhase("error");
    } catch (e) {
      console.error(e);

      const message =
    e?.response?.data?.message ||
    e?.message ||
    cfg.fail;

  setErr(message);

  setToast?.({
    type: "error",
    title: "Import Failed",
    message,
  });

  setPhase("error");
    }
  };

  // Paste a screenshot or text while on the upload screen (⌘/Ctrl+V)
  useEffect(() => {
    if (phase !== "upload") return;
    const onPaste = (e) => {
      const list = e.clipboardData?.items || [];
      for (const it of list) {
        if (it.type && it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) {
            e.preventDefault();
            run({ type: "image", file: f });
            return;
          }
        }
      }
      const t = e.clipboardData?.getData("text");
      if (t && t.trim().length > 3) {
        e.preventDefault();
        run({ type: "text", text: t });
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [phase]); // eslint-disable-line

  const pasteFromClipboard = async () => {
    setHint("");
    try {
      if (navigator.clipboard?.read) {
        const list = await navigator.clipboard.read();
        for (const it of list) {
          const t = it.types.find((x) => x.startsWith("image/"));
          if (t) {
            const blob = await it.getType(t);
            run({
              type: "image",
              file: new File([blob], "pasted.png", { type: blob.type }),
            });
            return;
          }
        }
      }
      if (navigator.clipboard?.readText) {
        const txt = await navigator.clipboard.readText();
        if (txt && txt.trim()) {
          run({ type: "text", text: txt });
          return;
        }
      }
      setHint("Press ⌘/Ctrl+V to paste here.");
    } catch {
      setHint("Clipboard was blocked — press ⌘/Ctrl+V to paste here instead.");
    }
  };

  const kept = items.filter((i) => i._keep).length;

  return (
    <Modal title={cfg.title} onClose={onClose} wide>
      {phase === "upload" && (
        <div>
          <div
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 px-6 py-10 text-center hover:border-red-500/60"
          >
            <ImageIcon size={26} className="mb-3 text-zinc-500" />
            <p className="text-sm font-medium text-zinc-200">
              Drop or choose a screenshot
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              WhatsApp, email, notes — AI pulls out the {cfg.noun}s.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                run(
                  e.target.files?.[0]
                    ? { type: "image", file: e.target.files[0] }
                    : null,
                )
              }
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={pasteFromClipboard}
              className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
            >
              <ClipboardPaste size={14} /> Paste from clipboard
            </button>
            <span className="text-xs text-zinc-500">
              or press ⌘/Ctrl+V — image or text
            </span>
          </div>
          {hint && (
            <p className="mt-2 text-center text-xs text-amber-400">{hint}</p>
          )}
        </div>
      )}

      {phase === "working" && (
        <div className="flex flex-col items-center justify-center py-12">
          {preview && (
            <img
              src={preview}
              alt=""
              className="mb-4 max-h-40 rounded-lg border border-zinc-800"
            />
          )}
          <Loader2 className="mb-2 animate-spin acc-text" />
          <p className="text-sm text-zinc-400">{cfg.reading}</p>
        </div>
      )}

      {phase === "error" && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <AlertTriangle className="mb-2 text-amber-400" />
          <p className="text-sm text-zinc-300">{err}</p>
          <button
            onClick={() => {
              setErr("");
              setPhase("upload");
            }}
            className="mt-4 rounded-md border border-zinc-700 px-4 py-2 text-xs text-zinc-200 hover:bg-zinc-900"
          >
            Try again
          </button>
        </div>
      )}

      {phase === "review" && (
        <div>
          <p className="mb-3 text-xs text-zinc-500">
            Found {items.length} {cfg.noun}
            {items.length > 1 ? "s" : ""}. Uncheck anything you don't want, then
            add.
          </p>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {items.map((it, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
              >
                <input
                  type="checkbox"
                  checked={it._keep}
                  onChange={(e) =>
                    setItems((p) =>
                      p.map((x, j) =>
                        j === i ? { ...x, _keep: e.target.checked } : x,
                      ),
                    )
                  }
                  className="mt-1 accent-red-600"
                />
                <div className="min-w-0 flex-1">
                  {kind === "task" ? (
                    <>
                      <input
                        className="w-full bg-transparent text-sm font-medium text-zinc-100 outline-none"
                        value={it.title || ""}
                        onChange={(e) =>
                          setItems((p) =>
                            p.map((x, j) =>
                              j === i ? { ...x, title: e.target.value } : x,
                            ),
                          )
                        }
                      />
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                        <span className={PRIORITY[it.priority] || ""}>
                          {it.priority || "Medium"}
                        </span>
                        {it.dueDate && (
                          <span className="flex items-center gap-1">
                            <CalendarClock size={11} />
                            {fmtDate(it.dueDate)}
                          </span>
                        )}
                        {it.assignee && <span>· {it.assignee}</span>}
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        className="w-full bg-transparent text-sm font-medium text-zinc-100 outline-none"
                        value={it.name || ""}
                        onChange={(e) =>
                          setItems((p) =>
                            p.map((x, j) =>
                              j === i ? { ...x, name: e.target.value } : x,
                            ),
                          )
                        }
                      />
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                        <span className="text-zinc-300">
                          {it.stage || "New"}
                        </span>
                        {it.company && <span>· {it.company}</span>}
                        {Number(it.value) > 0 && (
                          <span className="acc-text">
                            · {inrShort(it.value)}
                          </span>
                        )}
                        {it.owner && <span>· {it.owner}</span>}
                      </div>
                    </>
                  )}
                  {it.notes && (
                    <div className="mt-1 text-xs text-zinc-500">{it.notes}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setPhase("upload")}
              className="rounded-md px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Back
            </button>
            <button
              onClick={() => {
                const selected = items.filter((i) => i._keep);

                onConfirm(selected);

                onClose();
              }}
              className="rounded-md btn-primary px-4 py-2 text-xs font-medium text-white hover:bg-red-500"
            >
              Add {kept} {cfg.noun}
              {kept !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ================================================================== */
/* RETAINERS                                                           */
/* ================================================================== */

const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const FIELD_SYNONYMS = {
  amount: [
    "amount",
    "retaineramount",
    "retainervalue",
    "value",
    "fees",
    "fee",
    "monthly",
    "mrr",
    "rate",
    "cost",
    "billing",
    "charges",
    "charge",
    "revenue",
    "price",
    "inr",
    "rs",
  ],
  endDate: [
    "contractend",
    "agreementend",
    "enddate",
    "expiry",
    "expires",
    "expire",
    "validtill",
    "validupto",
    "valid",
    "tenureend",
    "tenure",
    "renewal",
    "till",
    "end",
    "closure",
    "duedate",
  ],
  startDate: [
    "startdate",
    "start",
    "commencement",
    "begin",
    "onboarding",
    "onboard",
    "from",
    "signup",
  ],
  client: [
    "client",
    "brand",
    "account",
    "customer",
    "company",
    "party",
    "retainer",
    "name",
  ],
};

function parseAmount(v) {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return v;
  const cleaned = String(v).replace(/[^0-9.]/g, "");
  return Number(cleaned) || 0;
}

function looksNumeric(vals) {
  const filled = vals.filter((v) => v !== "" && v != null);
  if (!filled.length) return false;
  return filled.filter((v) => parseAmount(v) > 0).length >= filled.length * 0.6;
}

function looksDate(vals) {
  const filled = vals.filter((v) => v !== "" && v != null);
  if (!filled.length) return false;
  return filled.filter((v) => normDate(v)).length >= filled.length * 0.6;
}

// Guess which header maps to each field: first by header name, then by column content.
function guessMapping(headers, rows) {
  const map = { client: "", amount: "", startDate: "", endDate: "" };
  const used = new Set();
  const col = (h) => rows.slice(0, 15).map((r) => r[h]);

  // amount/dates claim columns first so a "Retainer Amount" header isn't taken as the client
  for (const field of ["amount", "endDate", "startDate", "client"]) {
    for (const h of headers) {
      if (used.has(h)) continue;
      if (FIELD_SYNONYMS[field].some((syn) => norm(h).includes(syn))) {
        map[field] = h;
        used.add(h);
        break;
      }
    }
  }
  // content-based fallback
  if (!map.amount) {
    const c = headers.find((h) => !used.has(h) && looksNumeric(col(h)));
    if (c) {
      map.amount = c;
      used.add(c);
    }
  }
  if (!map.endDate) {
    const c = headers.find((h) => !used.has(h) && looksDate(col(h)));
    if (c) {
      map.endDate = c;
      used.add(c);
    }
  }
  if (!map.client) {
    const c = headers.find((h) => !used.has(h));
    if (c) map.client = c;
  }
  return map;
}

function RetainersView({ retainers, setRetainers }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importNote, setImportNote] = useState("");
  const [mapState, setMapState] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileRef = useRef();

  const handleExcel = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, {
          type: "array",
          cellDates: true,
        });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: "" });

        if (rows.length === 0) {
          setImportNote(
            "That sheet looks empty. Check that the first row holds your column headers.",
          );
          return;
        }
        const headers = Object.keys(rows[0]);
        setMapState({ headers, rows, mapping: guessMapping(headers, rows) });
      } catch {
        setImportNote(
          "That file couldn't be read. Use a .xlsx or .csv with a header row.",
        );
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const commitImport = async (headers, rows, m) => {
    const mapped = rows
      .map((r) => {
        const client = m.client ? String(r[m.client] ?? "").trim() : "";

        if (!client) return null;

        return {
          client,
          amount: m.amount ? parseAmount(r[m.amount]) : 0,
          startDate: m.startDate ? normDate(r[m.startDate]) : "",
          endDate: m.endDate ? normDate(r[m.endDate]) : "",
          status: "Active",
        };
      })
      .filter(Boolean);

    setMapState(null);

    if (mapped.length === 0) {
      setImportNote(
        "No client names found in the column you chose. Try a different Client column.",
      );
      return;
    }

    try {
      for (const r of mapped) {
        await createRetainer({
          client: r.client,
          amount: r.amount,
          start_date: r.startDate,
          end_date: r.endDate,
          status: r.status,
        });
      }

      const data = await fetchRetainers();

      setRetainers(
        data.map((r) => ({
          ...r,
          startDate: r.start_date,
          endDate: r.end_date,
        })),
      );

      setImportNote(
        `Imported ${mapped.length} retainer${mapped.length > 1 ? "s" : ""}.`,
      );

      setTimeout(() => setImportNote(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Import failed");
    }
  };

  const save = async (r) => {
    try {
      let data;

      if (r.id) {
        data = await editRetainer(r.id, {
          client: r.client,
          amount: r.amount,
          start_date: r.startDate,
          end_date: r.endDate,
          status: r.status,
        });
      } else {
        data = await createRetainer({
          client: r.client,
          amount: r.amount,
          start_date: r.startDate,
          end_date: r.endDate,
          status: r.status,
        });
      }

      setRetainers(
        data.map((r) => ({
          ...r,
          startDate: r.start_date,
          endDate: r.end_date,
        })),
      );

      setShowForm(false);
      setEditing(null);
    } catch (error) {
      console.error(error);
      alert("Failed to save retainer");
    }
  };

  const sorted = [...retainers].sort(
    (b, c) => (daysUntil(b.endDate) ?? 1e9) - (daysUntil(c.endDate) ?? 1e9),
  );
  const totalMRR = retainers.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const endingSoon = retainers.filter((r) => {
    const d = daysUntil(r.endDate);
    return d != null && d >= 0 && d <= 90;
  }).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Retainers</h2>
          
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
          >
            <Upload size={14} /> Import Excel
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleExcel(e.target.files?.[0])}
          />
          {retainers.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1.5 rounded-md btn-primary px-3 py-2 text-xs font-medium text-white hover:bg-red-500 hover:border-red-500/50 hover:text-red-300"
            >
              <Trash2 size={14} /> Clear all
            </button>
          )}
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 rounded-md btn-primary px-3 py-2 text-xs font-medium text-white hover:bg-red-500"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {importNote && (
        <div className="mb-3 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300">
          {importNote}
        </div>
      )}

      {/* KPI row */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi
          label="Total monthly retainer"
          value={inrShort(totalMRR)}
          sub={inr(totalMRR) + " / month"}
        />
        <Kpi
          label="Annualised"
          value={inrShort(totalMRR * 12)}
          sub="MRR × 12"
        />
        <Kpi
          label="Ending within 90 days"
          value={String(endingSoon)}
          sub="needs renewal attention"
          accent={endingSoon > 0}
        />
      </div>

      {retainers.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No retainers imported"
          hint="Click Import Excel. Your sheet just needs a client column, a retainer amount column, and a contract end date."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Client</th>
                <th className="px-4 py-2.5 text-right font-medium">
                  Retainer / mo
                </th>
                <th className="px-4 py-2.5 font-medium">Start</th>
                <th className="px-4 py-2.5 font-medium">Contract end</th>
                <th className="px-4 py-2.5 font-medium">Renewal</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const d = daysUntil(r.endDate);
                const flag =
                  d == null
                    ? null
                    : d < 0
                      ? "expired"
                      : d <= 30
                        ? "urgent"
                        : d <= 90
                          ? "soon"
                          : "ok";
                return (
                  <tr
                    key={r.id}
                    className="border-t border-zinc-800/70 hover:bg-zinc-900/40"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-100">
                      {r.client}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-200">
                      {inr(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {fmtDate(r.startDate)}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {fmtDate(r.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      {flag === "expired" && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200">
                          Expired
                        </span>
                      )}

                      {flag === "urgent" && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200">
                          {d} days left
                        </span>
                      )}

                      {flag === "soon" && (
                        <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 border border-orange-200">
                          {d} days left
                        </span>
                      )}

                      {flag === "ok" && (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${
                            d <= 180
                              ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                              : "bg-green-100 text-green-700 border-green-200"
                          }`}
                        >
                          {d} days left
                        </span>
                      )}

                      {flag === null && (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing(r);
                            setShowForm(true);
                          }}
                          className="rounded p-1 text-zinc-500 hover:text-zinc-200"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm("Delete this retainer?"))
                              return;

                            try {
                              const data = await removeRetainer(r.id);
                              setRetainers(
                                data.map((r) => ({
                                  ...r,
                                  startDate: r.start_date,
                                  endDate: r.end_date,
                                })),
                              );
                            } catch (err) {
                              console.error(err);
                              alert("Failed to delete retainer");
                            }
                          }}
                          className="rounded p-1 text-zinc-500 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <RetainerForm
          retainer={editing}
          onSave={save}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
      {mapState && (
        <ImportMapModal
          state={mapState}
          onCancel={() => setMapState(null)}
          onImport={commitImport}
        />
      )}
      {confirmClear && (
        <Modal
          title="Clear all retainers?"
          onClose={() => setConfirmClear(false)}
        >
          <p className="text-sm text-zinc-300">
            This removes all {retainers.length} retainer
            {retainers.length > 1 ? "s" : ""} from the list. This can't be
            undone.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setConfirmClear(false)}
              className="rounded-md px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  const data = await clearRetainers();
                  setRetainers(data);
                  setConfirmClear(false);
                } catch (err) {
                  console.error(err);
                  alert("Failed to clear retainers");
                }
              }}
              className="rounded-md btn-primary px-4 py-2 text-xs font-medium text-white hover:bg-red-500"
            >
              Remove all
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function RetainerForm({ retainer, onSave, onClose }) {
  const [f, setF] = useState(
    retainer || {
      client: "",
      amount: "",
      startDate: "",
      endDate: "",
      status: "Active",
    },
  );
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal
      title={retainer ? "Edit retainer" : "Add retainer"}
      onClose={onClose}
    >
      <div className="space-y-3">
        <Field label="Client / brand">
          <input
            autoFocus
            className={inputCls}
            value={f.client}
            onChange={(e) => set("client", e.target.value)}
          />
        </Field>
        <Field label="Retainer amount (₹ / month)">
          <input
            type="number"
            className={inputCls}
            value={f.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="356000"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <input
              type="date"
              className={inputCls}
              value={f.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </Field>
          <Field label="Contract end">
            <input
              type="date"
              className={inputCls}
              value={f.endDate}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              f.client.trim() && onSave({ ...f, amount: Number(f.amount) || 0 })
            }
            className="rounded-md btn-primary px-4 py-2 text-xs font-medium text-white hover:bg-red-500"
          >
            {retainer ? "Save" : "Add"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---- column mapping confirmation ---- */

function ImportMapModal({ state, onCancel, onImport }) {
  const { headers, rows } = state;
  const [m, setM] = useState(state.mapping);
  const set = (k, v) => setM((p) => ({ ...p, [k]: v }));
  const Opts = () => (
    <>
      <option value="">— none —</option>
      {headers.map((h) => (
        <option key={h} value={h}>
          {h}
        </option>
      ))}
    </>
  );
  const preview = rows.slice(0, 4);
  const dateCell = (val) => {
    const nd = normDate(val);
    if (nd) return <span className="text-zinc-300">{fmtDate(nd)}</span>;
    if (val !== "" && val != null)
      return <span className="italic text-amber-400">{String(val)}</span>;
    return <span className="text-zinc-600">—</span>;
  };
  const datesFail =
    m.endDate &&
    preview.some((r) => r[m.endDate] !== "" && r[m.endDate] != null) &&
    preview.every((r) => !normDate(r[m.endDate]));

  return (
    <Modal title="Match your columns" onClose={onCancel} wide>
      <p className="mb-3 text-xs text-zinc-500">
        Here's how your sheet mapped. Fix anything that's wrong, check the
        preview, then import.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Client / brand">
          <select
            className={inputCls}
            value={m.client}
            onChange={(e) => set("client", e.target.value)}
          >
            <Opts />
          </select>
        </Field>
        <Field label="Retainer amount (₹)">
          <select
            className={inputCls}
            value={m.amount}
            onChange={(e) => set("amount", e.target.value)}
          >
            <Opts />
          </select>
        </Field>
        <Field label="Start date (optional)">
          <select
            className={inputCls}
            value={m.startDate}
            onChange={(e) => set("startDate", e.target.value)}
          >
            <Opts />
          </select>
        </Field>
        <Field label="Contract end date">
          <select
            className={inputCls}
            value={m.endDate}
            onChange={(e) => set("endDate", e.target.value)}
          >
            <Opts />
          </select>
        </Field>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full text-xs">
          <thead className="bg-zinc-900 text-left text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">Client</th>
              <th className="px-3 py-2 text-right font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Start</th>
              <th className="px-3 py-2 font-medium">End</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((r, i) => (
              <tr key={i} className="border-t border-zinc-800/70">
                <td className="px-3 py-2 text-zinc-200">
                  {m.client ? String(r[m.client] ?? "") || "—" : "—"}
                </td>
                <td className="px-3 py-2 text-right font-mono text-zinc-200">
                  {m.amount ? inr(parseAmount(r[m.amount])) : "—"}
                </td>
                <td className="px-3 py-2">
                  {m.startDate ? (
                    dateCell(r[m.startDate])
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {m.endDate ? (
                    dateCell(r[m.endDate])
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-[11px] text-zinc-600">
        Preview of the first {preview.length} of {rows.length} row
        {rows.length > 1 ? "s" : ""}.
        {m.amount && preview.every((r) => parseAmount(r[m.amount]) === 0) && (
          <span className="ml-1 text-amber-400">
            Amounts read as zero — that's probably the wrong column.
          </span>
        )}
        {datesFail && (
          <span className="ml-1 text-amber-400">
            Dates shown in amber weren't recognised — switch the column, or tell
            me the format and I'll add it.
          </span>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button
          onClick={onCancel}
          className="rounded-md px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200"
        >
          Cancel
        </button>
        <button
          onClick={() => onImport(headers, rows, m)}
          disabled={!m.client}
          className="rounded-md btn-primary px-4 py-2 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-40"
        >
          Import {rows.length} row{rows.length > 1 ? "s" : ""}
        </button>
      </div>
    </Modal>
  );
}

/* ================================================================== */
/* PIPELINE                                                            */
/* ================================================================== */

function PipelineView({ leads, setLeads, owners }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [toast, setToast] = useState(null);

  const save = async (lead) => {
    try {
      let data;

      if (lead.id) {
        data = await editLead(lead.id, lead);
        setToast({
          type: "edit",
          title: "Lead Updated",
          message: `${lead.brand_name} has been updated successfully.`,
        });
      } else {
        data = await createLead(lead);
        setToast({
          type: "add",
          title: "Lead Added",
          message: `${lead.brand_name} has been added successfully.`,
        });
      }

      setLeads(data);
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      setToast({
        type: "error",
        title: err.response?.data?.title || "Couldn't Save Lead",
        message:
          err.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    }
  };

  const move = async (lead, stage) => {
    try {
      const data = await editLead(lead.id, {
        ...lead,
        stage,
      });

      setLeads(data);
    } catch (err) {
      console.error(err);
      alert("Failed to update stage");
    }
  };

  const addManyLeads = async (items) => {
    try {
      for (const lead of items.filter((l) => l._keep)) {
        await createLead({
          brand_name: lead.brand_name || "",
          services: lead.services || "",
          pitch: toDbPitch(lead.pitch),
          deal_type: lead.deal_type || "",
          lead_stage: lead.lead_stage || "New",
          hot_status: lead.hot_status || "",
          current_status: lead.current_status || "",
          start_month: lead.start_month || "",
          retainer_amount: Number(lead.retainer_amount) || 0,
          annual_retainer_value: Number(lead.annual_retainer_value) || 0,
          project_amount: Number(lead.project_amount) || 0,
          total_annual_revenue: Number(lead.total_annual_revenue) || 0,
          probability_closure: toPercent(lead.probability_closure),
          probabilistic_revenue: Number(lead.probabilistic_revenue) || 0,
          source_closed: lead.source_closed || "",
        });
      }

      const updatedLeads = await fetchPipeline();
      setLeads(updatedLeads);
      const count = items.filter((i) => i._keep).length;

      setToast({
        type: "import",
        title: "AI Import Complete",
        message: `${count} lead${count > 1 ? "s" : ""} imported successfully.`,
      });
      setShowAI(false);
    } catch (err) {
      console.error(err);
      alert("Failed to import leads.");
    }
  };

  const handleExcelImport = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt) => {
      const workbook = XLSX.read(evt.target.result, {
        type: "binary",
      });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const rows = XLSX.utils
        .sheet_to_json(sheet, {
          range: 1,
          defval: "",
        })
        .map((row) => {
          const normalized = {};

          Object.entries(row).forEach(([key, value]) => {
            normalized[key.trim()] = value;
          });

          return normalized;
        });

      const toNumber = (value) => {
        if (!value) return 0;

        return (
          Number(String(value).replace(/,/g, "").replace("%", "").trim()) || 0
        );
      };
      console.log("With spaces:", rows[0][" Project Amount "]);
      console.log("Without spaces:", rows[0]["Project Amount"]);
      const data = rows.map((r) => ({
        brand_name: r["Brand Name"],
        services: r["Services"],
        pitch: toDbPitch(r["Pitch (Y/N)"]),
        deal_type: r["Retainer/Project"],
        lead_stage: r["Lead Stage"],
        hot_status: r["Hot or Not"],
        current_status: r["Current Status"],
        start_month: r["Start Month"],

        retainer_amount: toNumber(r["Retainer Amount"]),
        annual_retainer_value: toNumber(r["Annual Retainer Value"]),
        project_amount: toNumber(r["Project Amount"]),
        total_annual_revenue: toNumber(r["Total Annual Revenue"]),
        probability_closure: toPercent(r["Probability of closure"]),
        probabilistic_revenue: toNumber(r["Probabilistic Revenue"]),

        source_closed: r["Source for Closed"],
      }));

      const updated = await importPipeline(data);

      setLeads(updated.leads);

      // setToast({
      //     type: "import",
      //     title: "Excel Imported",
      //     message: `${data.length} lead${data.length > 1 ? "s" : ""} imported successfully into the pipeline.`,
      // });

      setToast({
        type: "import",
        title: "Excel Imported",
        message:
          updated.skipped.length > 0
            ? `${updated.insertedCount} lead${updated.insertedCount !== 1 ? "s" : ""} imported. ${updated.skipped.length} duplicate${updated.skipped.length !== 1 ? "s" : ""} skipped.`
            : `${updated.insertedCount} lead${updated.insertedCount !== 1 ? "s" : ""} imported successfully into the pipeline.`,
      });
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Pipeline</h2>
          
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAI(true)}
            className="flex items-center gap-1.5 rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-xs font-medium acc-text hover:bg-green-500/20"
          >
            <Sparkles size={14} /> Import from image
          </button>
          <label className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 cursor-pointer">
            <Upload size={15} />
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={handleExcelImport}
            />
          </label>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 rounded-md btn-primary px-3 py-2 text-xs font-medium text-white hover:bg-red-500"
          >
            <Plus size={14} /> New lead
          </button>
        </div>
      </div>

      <StartMonthChart leads={leads} />
      <PipelineStats leads={leads} />

      <LeadCard
        leads={leads}
        setLeads={setLeads}
        setEditing={setEditing}
        setShowForm={setShowForm}
      />

      {showForm && (
        <LeadForm
          lead={editing}
          onSave={save}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          owners={owners}
        />
      )}
      {showAI && (
        <AIImportModal
          kind="lead"
          onClose={() => setShowAI(false)}
          onConfirm={addManyLeads}
        />
      )}

      <PipelineToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

const toPercent = (value) => {
  if (value === null || value === undefined || value === "") return 0;

  // handles "60%" style strings too, in case a future sheet exports text
  if (typeof value === "string" && value.includes("%")) {
    return Math.round(Number(value.replace("%", "").trim()) || 0);
  }

  const n = Number(value);
  if (Number.isNaN(n)) return 0;

  // Excel percent-formatted cells store 0.6 for 60% — scale up.
  // If a sheet ever stores it as an already-scaled number (60), leave it.
  return n <= 1 ? Math.round(n * 100) : Math.round(n);
};

const toDbPitch = (value) => {
  const v = String(value || "")
    .trim()
    .toLowerCase();
  if (v === "yes" || v === "y") return "Y";
  if (v === "no" || v === "n") return "N";
  return null; // enum column allows NULL — don't force an invalid value in
};

const fromDbPitch = (v) => (v === "Y" ? "Yes" : v === "N" ? "No" : "—");

const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

function Badge({ children, tone = "zinc" }) {
  const tones = {
    zinc: "bg-zinc-500/10 text-zinc-300 border-zinc-500/30",
    green: "bg-green-500/10 text-green-400 border-green-500/30",
    red: "bg-red-500/10 text-red-400 border-red-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    teal: "bg-teal-500/10 text-teal-400 border-teal-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

const pitchTone = (v) => (v === "Yes" ? "green" : v === "No" ? "red" : "zinc");

const hotTone = (v) => {
  const s = (v || "").toLowerCase();
  if (s.includes("hot")) return "red";
  if (s.includes("warm")) return "amber";
  if (s.includes("cold")) return "blue";
  return "zinc";
};

const stageTone = (v) => {
  const map = {
    New: "zinc",
    "Reached Out": "blue",
    "Proposal Shared": "indigo",
    Negotiation: "amber",
    "Client's Final Response Awaited": "orange",
    Closed: "teal",
    Won: "green",
    Lost: "red",
  };
  return map[v] || "zinc";
};

// --- main table ---
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function LeadCard({ leads, setLeads, setEditing, setShowForm }) {
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [pitchFilter, setPitchFilter] = useState("");
  const [hotFilter, setHotFilter] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const [sort, setSort] = useState({ key: null, dir: "asc" });

  // distinct values for filter dropdowns, derived from actual data
  const stageOptions = [
    ...new Set(leads.map((l) => l.lead_stage).filter(Boolean)),
  ];
  const hotOptions = [
    ...new Set(leads.map((l) => l.current_status).filter(Boolean)),
  ];

  const filtered = leads.filter((l) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      [l.brand_name, l.services, l.current_status, l.source_closed]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q));

    const matchesStage = !stageFilter || l.lead_stage === stageFilter;
    const matchesPitch = !pitchFilter || l.pitch === pitchFilter;
    const matchesHot = !hotFilter || l.current_status === hotFilter;

    return matchesSearch && matchesStage && matchesPitch && matchesHot;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sort.key) return 0;

    let av = a[sort.key];
    let bv = b[sort.key];

    // Handle null/undefined
    if (av == null) av = "";
    if (bv == null) bv = "";

    // Number comparison
    if (typeof av === "number" && typeof bv === "number") {
      return sort.dir === "asc" ? av - bv : bv - av;
    }

    // String comparison
    av = String(av).toLowerCase();
    bv = String(bv).toLowerCase();

    if (av < bv) return sort.dir === "asc" ? -1 : 1;
    if (av > bv) return sort.dir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  // reset to page 1 whenever the filtered set changes shape
  useEffect(() => {
    setPage(1);
  }, [search, stageFilter, pitchFilter, hotFilter, pageSize]);

  const resetFilters = () => {
    setSearch("");
    setStageFilter("");
    setPitchFilter("");
    setHotFilter("");
  };

  const hasActiveFilters = search || stageFilter || pitchFilter || hotFilter;

  function SortTh({ label, k, sort, onSort, align = "left" }) {
    const active = sort.key === k;

    return (
      <th
        className={`px-4 py-2.5 font-medium ${
          align === "right" ? "text-right" : "text-left"
        }`}
      >
        <button
          onClick={() => onSort(k)}
          className={`inline-flex items-center gap-1 ${
            align === "right" ? "justify-end w-full" : ""
          } ${active ? "text-zinc-200" : ""}`}
        >
          {label}
          {active ? (
            sort.dir === "asc" ? (
              <ChevronUp size={12} />
            ) : (
              <ChevronDown size={12} />
            )
          ) : (
            <ArrowUpDown size={11} className="opacity-40" />
          )}
        </button>
      </th>
    );
  }

  const toggleSort = (key) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );

  return (
    <div className="space-y-3">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brand, services, status, source..."
            className={`${inputCls} pl-10`}
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
        >
          <option value="">All stages</option>
          {stageOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={pitchFilter}
          onChange={(e) => setPitchFilter(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
        >
          <option value="">All pitch</option>
          <option value="Y">Pitch: Yes</option>
          <option value="N">Pitch: No</option>
        </select>

        <select
          value={hotFilter}
          onChange={(e) => setHotFilter(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
        >
          <option value="">All hot status</option>
          {hotOptions.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            Clear
          </button>
        )}

        <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
          <span>Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-3 py-2"></th>

              <SortTh
                label="Brand"
                k="brand_name"
                sort={sort}
                onSort={toggleSort}
              />
              <SortTh
                label="Services"
                k="services"
                sort={sort}
                onSort={toggleSort}
              />
              <SortTh label="Pitch" k="pitch" sort={sort} onSort={toggleSort} />
              <SortTh
                label="Type"
                k="deal_type"
                sort={sort}
                onSort={toggleSort}
              />
              <SortTh
                label="Stage"
                k="lead_stage"
                sort={sort}
                onSort={toggleSort}
              />
              <SortTh
                label="Status"
                k="current_status"
                sort={sort}
                onSort={toggleSort}
              />
              <SortTh
                label="Hot"
                k="hot_status"
                sort={sort}
                onSort={toggleSort}
              />
              <SortTh
                label="Start"
                k="start_month"
                sort={sort}
                onSort={toggleSort}
              />
              <SortTh
                label="Revenue"
                k="total_annual_revenue"
                sort={sort}
                onSort={toggleSort}
                align="right"
              />
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800">
            {pageRows.map((lead) => {
              const isOpen = expanded === lead.id;
              return (
                <React.Fragment key={lead.id}>
                  <tr className="hover:bg-zinc-900/30">
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setExpanded(isOpen ? null : lead.id)}
                        className="text-zinc-500 hover:text-zinc-200"
                      >
                        {isOpen ? "▾" : "▸"}
                      </button>
                    </td>
                    <td className="px-3 py-2 font-medium">{lead.brand_name}</td>
                    <td className="px-3 py-2 text-zinc-400">{lead.services}</td>
                    <td className="px-3 py-2">
                      <Badge tone={pitchTone(lead.pitch)}>
                        {fromDbPitch(lead.pitch)}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-zinc-400">
                      {lead.deal_type}
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={stageTone(lead.lead_stage)}>
                        {lead.lead_stage || "—"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-zinc-400">
                      {lead.current_status}
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={hotTone(lead.hot_status)}>
                        {lead.hot_status || "—"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-zinc-400">
                      {lead.start_month || "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {inr(lead.total_annual_revenue)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          className="text-xs text-zinc-400 hover:text-zinc-100"
                          onClick={() => {
                            setEditing(lead);
                            setShowForm(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs text-red-400 hover:text-red-300"
                          onClick={async () => {
                            if (!confirm(`Delete ${lead.brand_name}?`)) return;
                            const brand = lead.brand_name;
                            const data = await removeLead(lead.id);
                            setLeads(data);
                            setToast({
                              type: "delete",
                              title: "Lead Deleted",
                              message: `${brand} has been removed from the pipeline.`,
                            });
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {isOpen && (
                    <tr className="bg-zinc-900/20">
                      <td colSpan={11} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                          <div>
                            <p className="text-[11px] uppercase text-zinc-500">
                              Retainer Amount
                            </p>
                            <p className="text-sm font-medium">
                              {inr(lead.retainer_amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase text-zinc-500">
                              Annual Retainer Value
                            </p>
                            <p className="text-sm font-medium">
                              {inr(lead.annual_retainer_value)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase text-zinc-500">
                              Project Amount
                            </p>
                            <p className="text-sm font-medium">
                              {inr(lead.project_amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase text-zinc-500">
                              Probabilistic Revenue
                            </p>
                            <p className="text-sm font-medium">
                              {inr(lead.probabilistic_revenue)}
                            </p>
                          </div>
                          <div className="col-span-2 sm:col-span-2">
                            <p className="text-[11px] uppercase text-zinc-500">
                              Probability of Closure
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-zinc-800">
                                <div
                                  className="h-full"
                                  style={{
                                    width: `${Math.min(100, Number(lead.probability_closure) || 0)}%`,
                                    backgroundColor: "currentColor",
                                  }}
                                />
                              </div>
                              <span className="text-sm">
                                {lead.probability_closure || 0}%
                              </span>
                            </div>
                          </div>
                          <div className="col-span-2 sm:col-span-2">
                            <p className="text-[11px] uppercase text-zinc-500">
                              Source for Closed
                            </p>
                            <p className="text-sm font-medium">
                              {lead.source_closed || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-3 py-8 text-center text-zinc-500"
                >
                  {leads.length === 0
                    ? "No leads yet — add one or import from Excel."
                    : "No leads match your search/filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
        <span>
          Showing {filtered.length === 0 ? 0 : start + 1}–
          {Math.min(start + pageSize, filtered.length)} of {filtered.length}
          {leads.length !== filtered.length
            ? ` (filtered from ${leads.length})`
            : ""}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="rounded-md border px-2.5 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800"
          >
            Previous
          </button>
          <span className="px-2">
            Page {safePage} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="rounded-md border px-2.5 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 pb-3 mb-1 border-b border-zinc-800">
      <Icon size={15} className="text-zinc-500" />
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {title}
      </h3>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone = "zinc" }) {
  const tones = {
    zinc: "text-zinc-300 bg-zinc-500/10 border-zinc-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-zinc-500">
          {label}
        </p>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${tones[tone]}`}>
          <Icon size={14} />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

function PipelineStats({ leads }) {
  const total = leads.length;

  const pitchYes = leads.filter((l) => l.pitch === "Y").length;
  const pitchNo = leads.filter((l) => l.pitch === "N").length;
  const pitchPending = total - pitchYes - pitchNo;

  const retainerCount = leads.filter((l) => l.deal_type === "Retainer").length;
  const projectCount = leads.filter((l) => l.deal_type === "Project").length;

  const hotCount = leads.filter((l) =>
    (l.current_status || "").toLowerCase().includes("hot"),
  ).length;

  const totalRevenue = leads.reduce(
    (sum, l) => sum + (Number(l.total_annual_revenue) || 0),
    0,
  );

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard
        icon={Building2}
        label="Total Brands"
        value={total}
        tone="zinc"
      />
      <StatCard
        icon={CheckCircle2}
        label="Pitch Done"
        value={pitchYes}
        sub={`${pitchNo} not pitched`}
        tone="green"
      />
      <StatCard
        icon={Repeat}
        label="Retainers"
        value={retainerCount}
        tone="blue"
      />
      <StatCard
        icon={Briefcase}
        label="Projects"
        value={projectCount}
        tone="purple"
      />
      <StatCard icon={Flame} label="Hot Leads" value={hotCount} tone="red" />
      <StatCard
        icon={Wallet}
        label="Total Revenue"
        value={inr(totalRevenue)}
        tone="green"
      />
    </div>
  );
}

function StartMonthChart({ leads }) {

  const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const normalizeMonth = (value) => {
  if (!value || value === "0") return null;

  const str = value.toString().trim().toLowerCase();

  if (str.startsWith("jan")) return "January";
  if (str.startsWith("feb")) return "February";
  if (str.startsWith("mar")) return "March";
  if (str.startsWith("apr")) return "April";
  if (str.startsWith("may")) return "May";
  if (str.startsWith("jun")) return "June";
  if (str.startsWith("jul")) return "July";
  if (str.startsWith("aug")) return "August";
  if (str.startsWith("sep")) return "September";
  if (str.startsWith("oct")) return "October";
  if (str.startsWith("nov")) return "November";
  if (str.startsWith("dec")) return "December";

  return null;
};

const grouped = leads.reduce((acc, lead) => {
  const month = normalizeMonth(lead.start_month);

  if (!month) return acc;

  if (!acc[month]) {
    acc[month] = {
      month,
      totalLeads: 0,
      pitchDone: 0,
      pitchNotDone: 0,
      revenue: 0,
    };
  }

  acc[month].totalLeads++;

  if (String(lead.pitch).trim().toUpperCase() === "Y") {
    acc[month].pitchDone++;
  } else {
    acc[month].pitchNotDone++;
  }

  acc[month].revenue += Number(lead.total_annual_revenue || 0);

  return acc;
}, {});

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const d = payload[0].payload;

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm shadow-lg">
      <div className="mb-2 text-white font-semibold">
        {d.month}
      </div>

      <div className="flex justify-between gap-10">
        <span>Total Leads</span>
        <span>{d.totalLeads}</span>
      </div>

      <div className="flex justify-between gap-10">
        <span className="text-green-400">Pitch Done</span>
        <span>{d.pitchDone}</span>
      </div>

      <div className="flex justify-between gap-10">
        <span className="text-red-400">Pitch Not Done</span>
        <span>{d.pitchNotDone}</span>
      </div>

      {/* <div className="mt-2 border-t border-zinc-700 pt-2 flex justify-between gap-10">
        <span>Revenue</span>
        <span>{inr(d.revenue)}</span>
      </div> */}
    </div>
  );
};

  const data = monthNames.map((month) => ({
  month,
  totalLeads: grouped[month]?.totalLeads || 0,
  pitchDone: grouped[month]?.pitchDone || 0,
  pitchNotDone: grouped[month]?.pitchNotDone || 0,
  revenue: grouped[month]?.revenue || 0,
}));

  if (data.length === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">
            Leads by Start Month
          </h3>
          <p className="text-xs text-zinc-500">
            Volume of leads starting each month
          </p>
        </div>
      </div>

      <div style={{ height: "30vh" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={(month) => month.substring(0, 3)}
            />

            <YAxis
              allowDecimals={false}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="totalLeads"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={{ fill: "#ef4444", r: 3.5, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LeadForm({ lead, onSave, onClose }) {
  const [f, setF] = useState(
    lead || {
      brand_name: "",
      services: "",
      pitch: "",
      deal_type: "",
      lead_stage: "",
      hot_status: "",
      current_status: "",
      start_month: "",
      retainer_amount: 0,
      annual_retainer_value: 0,
      project_amount: 0,
      total_annual_revenue: 0,
      probability_closure: 0,
      probabilistic_revenue: 0,
      source_closed: "",
    },
  );

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
  const retainer = Number(f.retainer_amount) || 0;
  const project = Number(f.project_amount) || 0;

  let annual = 0;
  let totalRevenue = 0;

  if (f.deal_type === "Retainer") {
    annual = retainer * 12;
    totalRevenue = annual;
  } else if (f.deal_type === "Project") {
    annual = 0;
    totalRevenue = project;
  }

  setF((prev) => ({
    ...prev,
    annual_retainer_value: annual,
    total_annual_revenue: totalRevenue,
    probabilistic_revenue:
      (totalRevenue * (Number(prev.probability_closure) || 0)) / 100,
  }));
}, [
  f.deal_type,
  f.retainer_amount,
  f.project_amount,
  f.probability_closure,
]);

const defaultLeadStages = [
  "New",
  "Reached Out",
  "Proposal Shared",
  "Negotiation",
  "Client's Final Response Awaited",
  "Closed",
  "Won",
  "Lost",
];

const [leadStages, setLeadStages] = useState(defaultLeadStages);
const [showStageModal, setShowStageModal] = useState(false);
const [newStage, setNewStage] = useState("");



  const probColor =
    f.probability_closure >= 70
      ? "text-green-400"
      : f.probability_closure >= 40
        ? "text-amber-400"
        : "text-zinc-400";

  return (
    <Modal title={lead ? "Edit Lead" : "New Lead"} onClose={onClose}>
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
        {/* --- Lead details --- */}
        <div>
          <SectionHeader icon={Building2} title="Lead Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Brand Name">
              <input
                className={inputCls}
                placeholder="e.g. Reliance Foundation Hospital"
                value={f.brand_name}
                onChange={(e) => set("brand_name", e.target.value)}
              />
            </Field>

            <Field label="Services">
              <input
                className={inputCls}
                placeholder="e.g. ORM, Media"
                value={f.services}
                onChange={(e) => set("services", e.target.value)}
              />
            </Field>

            <Field label="Pitch">
              <select
                className={inputCls}
                value={f.pitch}
                onChange={(e) => set("pitch", e.target.value)}
              >
                <option value="">Select Pitch</option>
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </Field>

            <Field label="Deal Type">
              <select
                className={inputCls}
                value={f.deal_type}
                onChange={(e) => {
                  const value = e.target.value;

                  if (value === "Retainer") {
                    setF((prev) => ({
                      ...prev,
                      deal_type: value,
                      project_amount: 0,
                    }));
                  } else if (value === "Project") {
                    setF((prev) => ({
                      ...prev,
                      deal_type: value,
                      retainer_amount: 0,
                      annual_retainer_value: 0,
                    }));
                  } else {
                    set("deal_type", value);
                  }
                }}
              >
                <option value="">Select Type</option>
                <option value="Retainer">Retainer</option>
                <option value="Project">Project</option>
              </select>
            </Field>
          </div>
        </div>

        {/* --- Status --- */}
        <div>
          <SectionHeader icon={Tag} title="Status & Timeline" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Lead Stage">
              <div className="flex gap-2">
                <select
  className={inputCls}
  value={f.lead_stage}
  onChange={(e) => {
    if (e.target.value === "__add__") {
      setShowStageModal(true);
    } else {
      set("lead_stage", e.target.value);
    }
  }}
>
  <option value="">Select Stage</option>

  {leadStages.map((stage) => (
    <option key={stage} value={stage}>
      {stage}
    </option>
  ))}

  <option value="__add__">+ Add New Stage</option>
</select>
              </div>
            </Field>

            <Field label="Start Month">
              <select
                className={inputCls}
                value={f.start_month}
                onChange={(e) => set("start_month", e.target.value)}
              >
                <option value="">Select Month</option>
                {[
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>

            <Field label="Hot Status">
              <div className="flex gap-2">
                {["Hot", "Warm", "Cold"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set("hot_status", opt)}
                    className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition ${
                      f.hot_status === opt
                        ? opt === "Hot"
                          ? "border-red-500/50 bg-red-500/10 text-red-400"
                          : opt === "Warm"
                            ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                            : "border-blue-500/50 bg-blue-500/10 text-blue-400"
                        : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Current Status">
              <div className="flex gap-2">
                {["Hot", "Warm", "Cold"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set("current_status", opt)}
                    className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition ${
                      f.current_status === opt
                        ? opt === "Hot"
                          ? "border-red-500/50 bg-red-500/10 text-red-400"
                          : opt === "Warm"
                            ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                            : "border-blue-500/50 bg-blue-500/10 text-blue-400"
                        : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </div>

        {/* --- Financials --- */}
        <div>
          <SectionHeader icon={IndianRupee} title="Financials" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Retainer Amount">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  className={`${inputCls} pl-7 ${
                    f.deal_type === "Project"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={f.deal_type === "Project"}
                  value={f.retainer_amount}
                  onChange={(e) => set("retainer_amount", Number(e.target.value))}
                />
              </div>
            </Field>

            <Field label="Annual Retainer Value">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  className={`${inputCls} pl-7 bg-zinc-900/40`}
                  value={f.annual_retainer_value}
                  readOnly
                />
              </div>
            </Field>

            <Field label="Project Amount">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  className={`${inputCls} pl-7 ${
                    f.deal_type === "Retainer"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={f.deal_type === "Retainer"}
                  value={f.project_amount}
                  onChange={(e) => set("project_amount", Number(e.target.value))}
                />
              </div>
            </Field>

            <Field label="Total Annual Revenue">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  className={`${inputCls} pl-7 bg-zinc-900/40 font-medium`}
                  value={f.total_annual_revenue}
                  readOnly
                />
              </div>
            </Field>

            <Field label="Source for Closed">
              <input
                className={inputCls}
                placeholder="e.g. Upsell, Referral"
                value={f.source_closed}
                onChange={(e) => set("source_closed", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* --- Probability + derived revenue --- */}
        <div>
          <SectionHeader icon={TrendingUp} title="Closure Forecast" />

          <Field label="Probability of Closure">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={f.probability_closure}
                onChange={(e) =>
                  set("probability_closure", Number(e.target.value))
                }
                className="flex-1 accent-red-500"
              />
              <span
                className={`w-12 text-right text-sm font-semibold ${probColor}`}
              >
                {f.probability_closure}%
              </span>
            </div>
          </Field>

          <div className="mt-3 flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3">
            <span className="text-xs text-zinc-500">
              Probabilistic Revenue (auto-calculated)
            </span>
            <span className="text-sm font-semibold text-zinc-100">
              ₹{Math.round(f.probabilistic_revenue).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800 sticky bottom-0 bg-inherit">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </button>

          <button
            onClick={() => onSave(f)}
            className="rounded-md btn-primary px-5 py-2 text-sm font-medium text-white hover:bg-red-500"
          >
            {lead ? "Save Changes" : "Add Lead"}
          </button>
        </div>
      </div>

      {showStageModal && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
      <h3 className="text-lg font-semibold text-white">
        Add Lead Stage
      </h3>

      <p className="mt-1 text-sm text-zinc-400">
        Create a custom lead stage.
      </p>

      <input
        autoFocus
        value={newStage}
        onChange={(e) => setNewStage(e.target.value)}
        placeholder="e.g. Waiting for Approval"
        className={`${inputCls} mt-4`}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (
              newStage.trim() &&
              !leadStages.some(
                (s) =>
                  s.toLowerCase() ===
                  newStage.trim().toLowerCase()
              )
            ) {
              setLeadStages([...leadStages, newStage.trim()]);
              set("lead_stage", newStage.trim());
            }

            setNewStage("");
            setShowStageModal(false);
          }
        }}
      />

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={() => {
            setNewStage("");
            setShowStageModal(false);
          }}
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            if (
              newStage.trim() &&
              !leadStages.some(
                (s) =>
                  s.toLowerCase() ===
                  newStage.trim().toLowerCase()
              )
            ) {
              setLeadStages([...leadStages, newStage.trim()]);
              set("lead_stage", newStage.trim());
            }

            setNewStage("");
            setShowStageModal(false);
          }}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
        >
          Add Stage
        </button>
      </div>
    </div>
  </div>
)}
    </Modal>
  );
}

/* ================================================================== */
/* SALARY-TO-RETAINER                                                  */
/* ================================================================== */

// const SR_TARGET = 0.46;



const pct = (p) => (p == null ? "—" : (p * 100).toFixed(1) + "%");
const monthLabel = (mk) => {
  const m = /^(\d{4})-(\d{2})$/.exec(mk || "");
  if (!m) return mk || "—";
  return new Date(Number(m[1]), Number(m[2]) - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
};
// const inr = (n) => "₹" + Math.round(n || 0).toLocaleString("en-IN");
// const inrShort = (n) => {
//   n = Number(n) || 0;
//   if (Math.abs(n) >= 1e7) return "₹" + (n / 1e7).toFixed(2) + "Cr";
//   if (Math.abs(n) >= 1e5) return "₹" + (n / 1e5).toFixed(2) + "L";
//   return inr(n);
// };
// If your project already has these in a shared UI kit, delete this block and
// import from there instead — they're only here so this file runs standalone.
// const inputCls =
//   "w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-red-500";
// function Field({ label, children }) {
//   return (
//     <label className="block">
//       <span className="mb-1 block text-xs font-medium text-zinc-400">{label}</span>
//       {children}
//     </label>
//   );
// }
// function Modal({ title, onClose, children }) {
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
//       <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
//         <div className="mb-3 flex items-center justify-between">
//           <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
//           <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">✕</button>
//         </div>
//         {children}
//       </div>
//     </div>
//   );
// }
 
function SalRetView() {
  const [loaded, setLoaded] = useState(false);
  const [months, setMonths] = useState([]); // [{month_key, grand_salary, total_retainer, overall_pct}]
  const [detail, setDetail] = useState(null); // GET /api/months/:key result
  const [selected, setSelected] = useState("");
  const [hasPin, setHasPin] = useState(false);
  const [unlocked, setUnlocked] = useState(true);
  const [pinInput, setPinInput] = useState("");
  const [pinErr, setPinErr] = useState(false);
  const [showPinMgr, setShowPinMgr] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [note, setNote] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  const [srTarget, setSrTarget] = useState(0.46); // fraction, e.g. 0.46 = 46%
  const [targetInput, setTargetInput] = useState("46"); // what's shown in the input, in %
  const [savingTarget, setSavingTarget] = useState(false);


  const [toast, setToast] = useState(null);

  
 
  const refreshMonths = async () => {
    const list = await api.getMonths();
    setMonths(list);
    return list;
  };
 
  // initial load: month list + pin lock status
  useEffect(() => {
  (async () => {
    try {
      const [list, pinStatus, targetRes] = await Promise.all([
        api.getMonths(),
        api.getPinStatus(),
        api.getTarget(),
      ]);
      setMonths(list);
      setSelected(list.length ? list[list.length - 1].month_key : "");
      setHasPin(pinStatus.hasPin);
      setUnlocked(!pinStatus.hasPin);
      setSrTarget(targetRes.target);
      setTargetInput(String(Math.round(targetRes.target * 1000) / 10));
    } catch {
      setNote("Couldn't reach the server. Is the API running?");
    } finally {
      setLoaded(true);
    }
  })();
}, []);
 
  // fetch the selected month's detail whenever it changes (and once unlocked)
  useEffect(() => {
    if (!selected || !unlocked) return;
    api.getMonthDetail(selected).then(setDetail).catch(() => setDetail(null));
  }, [selected, unlocked]);
 
  const onFile = async (file) => {
  if (!file) return;
  setImporting(true);
  try {
    const result = await api.importMonth(file);
    await refreshMonths();
    setSelected(result.monthKey);
    setToast({
      type: "import",
      title: "Import successful",
      message: `${monthLabel(result.monthKey)} — ${result.employees} people across ${result.brands} brands.`,
    });
  } catch (e) {
    setToast({
      type: "error",
      title: "Import failed",
      message: e.message || "That file couldn't be read.",
    });
  } finally {
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  }
};
 
  const updateRev = async (brand, value) => {
    const v = Number(String(value).replace(/[^0-9.]/g, "")) || 0;
    // optimistic UI update so the input feels instant
    setDetail((d) =>
      d && {
        ...d,
        brands: d.brands.map((b) =>
          b.brand === brand ? { ...b, retainer: v, pct: v > 0 ? b.salaryCost / v : null } : b,
        ),
      },
    );
    try {
      await api.setBrandRetainer(selected, brand, v);
      refreshMonths(); // YTD totals shift too
    } catch {
      setNote("Couldn't save that retainer value.");
    }
  };

  const saveTarget = async () => {
  const v = Number(targetInput);
  if (!Number.isFinite(v) || v <= 0 || v > 100) {
    setNote("Enter a target between 0 and 100.");
    return;
  }
  setSavingTarget(true);
  try {
    const { target } = await api.setTarget(v / 100);
    setSrTarget(target);
    setAiInsight(null); // stale — the backend already cleared every cached insight
    setNote(`Target updated to ${v}%. Insights will regenerate on next view.`);
  } catch (e) {
    setNote(e.message || "Couldn't update the target.");
  } finally {
    setSavingTarget(false);
    setTimeout(() => setNote(""), 5000);
  }
};
 
  const tryUnlock = async () => {
    try {
      const { ok } = await api.verifyPin(pinInput);
      if (ok) {
        setUnlocked(true);
        setPinInput("");
        setPinErr(false);
      } else setPinErr(true);
    } catch {
      setPinErr(true);
    }
  };
 
  const series = months.map((m) => ({
    key: m.month_key,
    label: monthLabel(m.month_key),
    pct: m.overall_pct != null ? +(m.overall_pct * 100).toFixed(1) : null,
    sal: m.grand_salary,
    rev: m.total_retainer,
    overall: m.overall_pct,
  }));
  const ytdSal = series.reduce((s, x) => s + (x.overall != null ? x.sal : 0), 0);
  const ytdRev = series.reduce((s, x) => s + (x.overall != null ? x.rev : 0), 0);
  const ytdOverall = ytdRev > 0 ? ytdSal / ytdRev : null;
 
  const rows = useMemo(() => {
    if (!detail) return [];
    return detail.brands
      .map((b) => ({ brand: b.brand, sal: b.salaryCost, revenue: b.retainer, pct: b.pct, people: b.people }))
      .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
  }, [detail]);
 
  const withPct = rows.filter((r) => r.pct != null);
  const avg = withPct.length ? withPct.reduce((s, r) => s + r.pct, 0) / withPct.length : null;
  const best = withPct.length ? withPct.reduce((a, b) => (b.pct < a.pct ? b : a)) : null;
  const worst = withPct.length ? withPct.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
  const central = detail ? detail.centralSalary || 0 : 0;
  const currentMonthRow = months.find((m) => m.month_key === selected);
  const sel = detail
    ? {
        sal: detail.grandSalary,
        rev: detail.brands.reduce((s, b) => s + (b.retainer || 0), 0),
        overall: currentMonthRow ? currentMonthRow.overall_pct : null,
      }
    : { sal: 0, rev: 0, overall: null };
  const rampups = rows.filter((r) => r.revenue <= 0 && r.sal > 0).length;
 
  const filtered = search.trim()
    ? rows.filter((r) => r.brand.toLowerCase().includes(search.trim().toLowerCase()))
    : rows;
 
  const monthKeys = months.map((m) => m.month_key);

  const [aiInsight, setAiInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);



const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(5);

useEffect(() => {
  setPage(1);
}, [search, pageSize]);

const totalPages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize));

const paginated = useMemo(() => {
  if (pageSize === "all") return filtered;
  const start = (page - 1) * pageSize;
  return filtered.slice(start, start + pageSize);
}, [filtered, page, pageSize]);


  useEffect(() => {
  if (!selected || !detail) return;
  let cancelled = false;
  setAiInsight(null);
  setInsightLoading(true);
  api.getMonthInsight(selected)
    .then((data) => { if (!cancelled) setAiInsight(data); })
    .catch(() => { if (!cancelled) setAiInsight(null); })
    .finally(() => { if (!cancelled) setInsightLoading(false); });
  return () => { cancelled = true; };
}, [selected, !!detail]); // eslint-disable-line react-hooks/exhaustive-deps

const regenerateInsight = async () => {
  setRegenerating(true);
  try {
    setAiInsight(await api.regenerateMonthInsight(selected));
  } catch {
    setNote("Couldn't regenerate the insight right now.");
  } finally {
    setRegenerating(false);
  }
};

// Flatten detail.brands[].people[] into one row per unique employee,
// each carrying every brand they're allocated to this month.
const employeeIndex = useMemo(() => {
  if (!detail) return [];
  const byName = new Map();
  for (const b of detail.brands) {
    for (const p of b.people) {
      if (!byName.has(p.name)) {
        byName.set(p.name, {
          name: p.name,
          designation: p.designation,
          salary: p.salary,
          totalAlloc: 0,
          brands: [],
        });
      }
      const e = byName.get(p.name);
      e.totalAlloc += p.alloc;
      e.brands.push({ brand: b.brand, alloc: p.alloc, contrib: p.contrib });
    }
  }
  return [...byName.values()]
    .map((e) => ({ ...e, brands: e.brands.sort((a, c) => c.contrib - a.contrib) }))
    .sort((a, b) => b.brands.length - a.brands.length);
}, [detail]);

const [empSearch, setEmpSearch] = useState("");
const [empExpanded, setEmpExpanded] = useState({});
const filteredEmployees = empSearch.trim()
  ? employeeIndex.filter((e) => e.name.toLowerCase().includes(empSearch.trim().toLowerCase()))
  : [];
 
  /* ---- locked state ---- */
  if (!loaded) return <div className="py-16 text-center text-sm text-zinc-500">Loading…</div>;

 
 
  if (hasPin && !unlocked) {
    return (
      <div className="mx-auto mt-12 max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
          <Lock size={18} className="text-zinc-300" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-100">This section is locked</h3>
        <p className="mt-1 text-xs text-zinc-500">Salary data is private. Enter your PIN to view.</p>
        <input
          type="password"
          autoFocus
          value={pinInput}
          onChange={(e) => {
            setPinInput(e.target.value);
            setPinErr(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
          className={`${inputCls} mt-4 text-center tracking-widest`}
          placeholder="••••"
        />
        {pinErr && <p className="mt-2 text-xs text-red-400">Wrong PIN.</p>}
        <button
          onClick={tryUnlock}
          className="mt-3 w-full rounded-md btn-primary px-4 py-2 text-xs font-medium text-white hover:bg-red-500"
        >
          Unlock
        </button>
      </div>
    );
  }

 
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            Salary-to-Retainer{" "}
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">PRIVATE</span>
          </h2>
          
        </div>
        <div className="flex flex-wrap gap-2">
          {monthKeys.length > 0 && (
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className={inputCls + " w-auto"}
            >
              {monthKeys.map((mk) => (
                <option key={mk} value={mk}>
                  {monthLabel(mk)}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowPinMgr(true)}
            className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
          >
            {hasPin ? <Lock size={14} /> : <Unlock size={14} />} {hasPin ? "PIN set" : "Set PIN"}
          </button>

          <div className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-2">
            <Target size={13} className="text-zinc-500" />
            <input
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value.replace(/[^0-9.]/g, ""))}
              onBlur={saveTarget}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              disabled={savingTarget}
              className="w-10 bg-transparent text-xs text-zinc-200 outline-none disabled:opacity-50"
            />
            <span className="text-xs text-zinc-500">% target</span>
          </div>


          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 rounded-md btn-primary px-3 py-2 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            <Upload size={14} /> {importing ? "Importing…" : "Import month"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>
      </div>
 
      {note && (
        <div className="mb-3 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300">
          {note}
        </div>
      )}
 
      {!detail ? (
        <EmptyState
          icon={Percent}
          title="No salary data yet"
          hint="Import your monthly 'Sal to Ret' sheet. Each month is kept, so you can switch between them and watch the year-to-date number track against your 46% target."
        />
      ) : (
        <>
          <YtdPanel
            series={series.filter((s) => s.overall != null)}
            ytdOverall={ytdOverall}
            ytdSal={ytdSal}
            ytdRev={ytdRev}
            selected={selected}
            onPick={setSelected}
            target={srTarget}
          />
 
          <div className="mb-2 mt-6 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#7c63ff" }} /> {monthLabel(selected)} · detail
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              label="Overall Sal/Ret %"
              value={pct(sel.overall)}
              sub={`vs 46% target · avg ${pct(avg)}`}
              accent={sel.overall != null && sel.overall > srTarget}
            />
            <Kpi
              label="Brands tracked"
              value={String(rows.length)}
              sub={`${detail.brands.reduce((s, b) => s + b.people.length, 0)} people · ${inrShort(central)} central${rampups ? ` · ${rampups} ramp-up` : ""}`}
            />
            <Kpi label="Best brand (lowest)" value={best ? pct(best.pct) : "—"} sub={best ? best.brand : ""} />
            <Kpi
              label="Worst brand (highest)"
              value={worst ? pct(worst.pct) : "—"}
              sub={worst ? worst.brand : ""}
              accent={worst != null && worst.pct > srTarget}
            />
          </div>
 
          {sel.overall != null && (
            <Insight aiInsight={aiInsight} loading={insightLoading} onRegenerate={regenerateInsight} regenerating={regenerating} />
          )}
 
          <div className="relative mb-3 flex items-center gap-2">
      <div className="relative flex-1">
        <Search size={15} className="pointer-events-none absolute left-3 top-2.5 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter brands… (e.g. JIO, Tata, ACKO)"
          className={inputCls + " pl-9"}
        />
      </div>

      <select
        value={pageSize}
        onChange={(e) =>
          setPageSize(e.target.value === "all" ? "all" : Number(e.target.value))
        }
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-xs text-zinc-300"
      >
        {[5, 10, 20, 25].map((n) => (
          <option key={n} value={n}>{n} / page</option>
        ))}
        <option value="all">All</option>
      </select>
    </div>

    <div className="space-y-2">
      {paginated.map((r) => (
        <BrandRow
          key={r.brand}
          r={r}
          target={srTarget}
          expanded={!!expanded[r.brand]}
          onToggle={() => setExpanded((p) => ({ ...p, [r.brand]: !p[r.brand] }))}
          onRev={(v) => updateRev(r.brand, v)}
        />
      ))}
      {filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-800 py-8 text-center text-xs text-zinc-500">
          No brands match "{search}".
        </div>
      )}
    </div>

    {pageSize !== "all" && filtered.length > 0 && (
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
        <span>
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-zinc-700 p-1 disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          <span>{page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border border-zinc-700 p-1 disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    )}


    <div className="mt-8">
  <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
    <Users size={12} /> Look up a person · {monthLabel(selected)}
  </div>
  <div className="relative mb-3">
    <Search size={15} className="pointer-events-none absolute left-3 top-2.5 text-zinc-500" />
    <input
      value={empSearch}
      onChange={(e) => setEmpSearch(e.target.value)}
      placeholder="Search by employee name…"
      className={inputCls + " pl-9"}
    />
  </div>

  {empSearch.trim() && (
    <div className="space-y-2">
      {filteredEmployees.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-800 py-6 text-center text-xs text-zinc-500">
          No one matches "{empSearch}" in {monthLabel(selected)}.
        </div>
      )}
      {filteredEmployees.map((e) => {
        const open = !!empExpanded[e.name];
        const overAllocated = e.totalAlloc > 1.02;
        const underAllocated = e.totalAlloc < 0.98 && e.brands.length > 0;
        return (
          <div key={e.name} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
            <button
              onClick={() => setEmpExpanded((p) => ({ ...p, [e.name]: !p[e.name] }))}
              className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left"
            >
              <ChevronDown size={15} className={`text-zinc-500 transition ${open ? "rotate-180" : ""}`} />
              <span className="font-medium text-zinc-100">{e.name}</span>
              <span className="text-[11px] text-zinc-500">{e.designation || "—"}</span>
              <span className="ml-auto flex items-center gap-2">
                <span className="rounded-full bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300">
                  {e.brands.length} brand{e.brands.length !== 1 ? "s" : ""}
                </span>
                {overAllocated && (
                  <span
                    title="Allocation across brands adds up to over 100% — worth checking the sheet"
                    className="rounded-full bg-amber-500/15 px-2 py-1 text-[11px] text-amber-300 ring-1 ring-amber-500/40"
                  >
                    {Math.round(e.totalAlloc * 100)}% allocated
                  </span>
                )}
                {underAllocated && (
                  <span
                    title="Allocated to less than 100% — remaining bandwidth isn't billed to any brand"
                    className="rounded-full bg-blue-600/15 px-2 py-1 text-[11px] text-blue-300 ring-1 ring-blue-500/40"
                  >
                    {Math.round(e.totalAlloc * 100)}% allocated
                  </span>
                )}
                <span className="font-mono text-sm text-zinc-200">{inr(e.salary)}</span>
              </span>
            </button>
            {open && (
              <div className="border-t border-zinc-800 bg-zinc-950/50 px-4 py-3">
                <table className="w-full text-xs">
                  <thead className="text-left text-[10px] uppercase tracking-wider text-zinc-600">
                    <tr>
                      <th className="py-1 font-medium">Brand</th>
                      <th className="py-1 text-right font-medium">% allocated</th>
                      <th className="py-1 text-right font-medium">Cost to brand</th>
                    </tr>
                  </thead>
                  <tbody>
                    {e.brands.map((b) => (
                      <tr key={b.brand} className="border-t border-zinc-800/60">
                        <td className="py-1.5 text-zinc-200">{b.brand}</td>
                        <td className="py-1.5 text-right text-zinc-300">{Math.round(b.alloc * 100)}%</td>
                        <td className="py-1.5 text-right font-mono text-zinc-200">{inr(Math.round(b.contrib))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2 text-[11px] text-zinc-500">
                  Base salary {inr(e.salary)}/mo, spread across {e.brands.length} brand{e.brands.length !== 1 ? "s" : ""} this month.
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  )}
</div>
        </>
      )}


 
      {showPinMgr && (
        <PinManager
          hasPin={hasPin}
          onClose={() => setShowPinMgr(false)}
          onSave={async (p) => {
            await api.setPin(p);
            setHasPin(!!p);
            setUnlocked(true);
            setShowPinMgr(false);
          }}
        />
      )}
      {importing && <ImportOverlay />}
      <PipelineToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
 
function YtdPanel({ series, ytdOverall, ytdSal, ytdRev, selected, onPick, target  }) {
  const over = ytdOverall != null && ytdOverall > target;
  const targetPct = target * 100;
  const latest = series.length ? series[series.length - 1] : null;
  const prev = series.length > 1 ? series[series.length - 2] : null;
  const delta = latest && prev ? latest.pct - prev.pct : null;
 
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <div
        className="relative overflow-hidden rounded-2xl border p-5"
        style={{
          borderColor: over ? "rgba(245,158,11,.4)" : "rgba(16,185,129,.4)",
          background: over
            ? "linear-gradient(165deg, rgba(245,158,11,.08), rgba(24,24,27,.5))"
            : "linear-gradient(165deg, rgba(16,185,129,.08), rgba(24,24,27,.5))",
        }}
      >
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          <Target size={14} /> Goal till now (YTD)
        </div>
        <div className={`mt-2 text-[40px] font-semibold leading-none tracking-tight ${over ? "text-amber-200" : "text-emerald-200"}`}>
          {pct(ytdOverall)}
        </div>
        <div className="mt-2 text-xs text-zinc-400">
          <div className="mt-2 text-xs text-zinc-400">
          {over
            ? `${((ytdOverall - target) * 100).toFixed(1)} pts over the ${targetPct.toFixed(0)}% target`
            : `${((target - ytdOverall) * 100).toFixed(1)} pts under the ${targetPct.toFixed(0)}% target`}
        </div>
        </div>
        <div className="mt-3 border-t border-zinc-800 pt-3 text-[11px] text-zinc-500">
          {series.length} month{series.length > 1 ? "s" : ""} · salaries {inrShort(ytdSal)} ÷ retainers {inrShort(ytdRev)}
          {delta != null && (
            <span className={delta <= 0 ? "text-emerald-400" : "text-amber-400"}>
              {"  ·  "}
              {delta <= 0 ? "▼" : "▲"} {Math.abs(delta).toFixed(1)} pts vs prev month
            </span>
          )}
        </div>
      </div>
 
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 lg:col-span-2">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Monthly overall % vs target
        </div>
        <div style={{ width: "100%", height: 188 }}>
          <ResponsiveContainer>
            <LineChart
              data={series}
              margin={{ top: 10, right: 14, bottom: 6, left: -18 }}
              onClick={(e) => e?.activeLabel && onPick(series.find((s) => s.label === e.activeLabel)?.key || selected)}
            >
              <XAxis dataKey="label" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} />
              <YAxis
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, (m) => Math.max(60, Math.ceil(m / 10) * 10)]}
                tickFormatter={(v) => v + "%"}
              />
              <Tooltip
                cursor={{ stroke: "#3f3f46" }}
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [v + "%", "Overall"]}
              />
              <ReferenceLine
                y={targetPct}
                stroke="#10b981"
                strokeDasharray="5 4"
                label={{ value: `${targetPct.toFixed(0)}% target`, fill: "#10b981", fontSize: 10, position: "insideTopRight" }}
              />
              <Line type="monotone" dataKey="pct" stroke="#7c63ff" strokeWidth={2.5} dot={{ r: 3.5, fill: "#7c63ff", strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {series.length > 1 && (
          <div className="mt-1 text-center text-[10px] text-zinc-600">Tip: click a point to open that month below.</div>
        )}
      </div>
    </div>
  );
}
 
function Insight({ aiInsight, loading, onRegenerate, regenerating }) {
  if (loading) return <div className="mb-5 text-sm text-zinc-400">Generating AI insight…</div>;
  if (!aiInsight) return null;

  const over = aiInsight.risk ? true : false; // or drive the border off whatever signal you prefer
  return (
    <div className={`mb-5 rounded-xl border p-5 ${over ? "border-red-500/30 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">{aiInsight.headline}</h3>
        <button
          onClick={onRegenerate}
          disabled={regenerating}
          className="shrink-0 rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
        >
          {regenerating ? "Regenerating…" : "Regenerate"}
        </button>
      </div>
      <p className="mt-1 text-zinc-300">{aiInsight.summary}</p>
      <div className="mt-4 rounded-lg bg-zinc-900/50 p-3">
        <div className="font-medium text-red-300">Risk</div>
        <div className="text-sm text-zinc-300">{aiInsight.risk}</div>
      </div>
      <div className="mt-4">
        <div className="mb-2 font-medium text-white">Recommendations</div>
        <ul className="space-y-2 text-sm text-zinc-300">
          {aiInsight.recommendations.map((item, i) => <li key={i}>• {item}</li>)}
        </ul>
      </div>
      <div className="mt-4">
        <div className="mb-2 font-medium text-white">Biggest Drags</div>
        <div className="flex flex-wrap gap-2">
          {aiInsight.biggest_drags.map((b, i) => (
            <span key={i} className="rounded bg-red-500/10 px-2 py-1 text-red-300">{b}</span>
          ))}
        </div>
      </div>
      {aiInsight.cached === false && (
        <div className="mt-3 text-[10px] text-zinc-600">Freshly generated · {new Date(aiInsight.generatedAt).toLocaleString("en-IN")}</div>
      )}
    </div>
  );
}
 
function BrandRow({ r, target, expanded, onToggle, onRev }) {
  const rampup = r.revenue <= 0 && r.sal > 0;
  const band = rampup
    ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/40"
    : r.pct == null
      ? "bg-zinc-700 text-zinc-300"
      : r.pct <= target
        ? "bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-500/40"
        : r.pct <= target + 0.14
          ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40"
          : "btn-primary/20 text-red-300 ring-1 ring-red-500/40";

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <button onClick={onToggle} className="flex flex-1 items-center gap-2 text-left">
          <ChevronDown size={15} className={`text-zinc-500 transition ${expanded ? "rotate-180" : ""}`} />
          <span className="font-medium text-zinc-100">{r.brand}</span>
          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
            <Users size={11} />
            {r.people.length}
          </span>
        </button>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-zinc-600">Salary / mo</div>
          <div className="font-mono text-sm text-zinc-200">{inr(Math.round(r.sal))}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-zinc-600">Retainer / mo</div>
          <input
            value={r.revenue || ""}
            onChange={(e) => onRev(e.target.value)}
            placeholder="set ₹"
            className="w-28 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-right font-mono text-sm text-zinc-200 outline-none focus:border-red-500"
          />
        </div>
        <span
          title={rampup ? "Salary with no retainer yet — counted in the overall total, not in the brand %" : ""}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${band}`}
        >
          {rampup ? "Ramp-up" : pct(r.pct)}
        </span>
      </div>
 
      {expanded && (
        <div className="border-t border-zinc-800 bg-zinc-950/50">
          {r.people.length === 0 ? (
            <div className="px-4 py-3 text-xs text-zinc-500">No one is allocated to this brand in the sheet.</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="text-left text-[10px] uppercase tracking-wider text-zinc-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Person</th>
                  <th className="px-4 py-2 font-medium">Designation</th>
                  <th className="px-4 py-2 text-right font-medium">Salary</th>
                  <th className="px-4 py-2 text-right font-medium">% on brand</th>
                  <th className="px-4 py-2 text-right font-medium">Cost to brand</th>
                </tr>
              </thead>
              <tbody>
                {r.people.map((p, i) => (
                  <tr key={i} className="border-t border-zinc-800/60">
                    <td className="px-4 py-2 text-zinc-200">{p.name}</td>
                    <td className="px-4 py-2 text-zinc-500">{p.designation || "—"}</td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-400">{inr(p.salary)}</td>
                    <td className="px-4 py-2 text-right text-zinc-300">{Math.round(p.alloc * 100)}%</td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-200">{inr(Math.round(p.contrib))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
 
function PinManager({ hasPin, onClose, onSave }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [err, setErr] = useState("");
  const submit = () => {
    if (a.length < 4) return setErr("Use at least 4 digits.");
    if (a !== b) return setErr("PINs don't match.");
    onSave(a);
  };
  return (
    <Modal title={hasPin ? "Change PIN" : "Set a PIN"} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs text-zinc-500">
          A light lock to keep this tab private on a shared screen. It isn't bank-grade security.
        </p>
        <Field label="New PIN">
          <input
            type="password"
            className={inputCls}
            value={a}
            onChange={(e) => {
              setA(e.target.value.replace(/\D/g, ""));
              setErr("");
            }}
            placeholder="4+ digits"
          />
        </Field>
        <Field label="Confirm PIN">
          <input
            type="password"
            className={inputCls}
            value={b}
            onChange={(e) => {
              setB(e.target.value.replace(/\D/g, ""));
              setErr("");
            }}
          />
        </Field>
        {err && <p className="text-xs text-red-400">{err}</p>}
        <div className="flex justify-between gap-2 pt-1">
          {hasPin ? (
            <button onClick={() => onSave("")} className="rounded-md px-3 py-2 text-xs text-zinc-500 hover:text-red-300">
              Remove lock
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-md px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200">
              Cancel
            </button>
            <button onClick={submit} className="rounded-md btn-primary px-4 py-2 text-xs font-medium text-white hover:bg-red-500">
              Save PIN
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
 
function Kpi({ label, value, sub, accent }) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5"
      style={
        accent
          ? { borderColor: "rgba(245,158,11,.4)", background: "linear-gradient(165deg, rgba(245,158,11,.08), rgba(24,24,27,.5))" }
          : { borderColor: "#27272a", background: "rgba(24,24,27,.5)" }
      }
    >
      {accent && (
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,.30), transparent 70%)" }}
        />
      )}
      <div className="relative text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`relative mt-2 text-[27px] font-semibold leading-none tracking-tight ${accent ? "text-amber-200" : "text-zinc-50"}`}>
        {value}
      </div>
      {sub && <div className="relative mt-2 text-[11px] text-zinc-500">{sub}</div>}
    </div>
  );
}
 
function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800"
        style={{ background: "radial-gradient(circle, rgba(124,99,255,.14), transparent 70%)" }}
      >
        <Icon size={22} className="text-zinc-400" />
      </div>
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-zinc-500">{hint}</p>
    </div>
  );
}