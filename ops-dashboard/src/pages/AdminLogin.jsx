import { useState } from "react";
import { adminLogin } from "../api/adminApi";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await adminLogin(form);

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("admin", JSON.stringify(res.data.admin));

      navigate("/admin/dashboard");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 text-slate-100">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
          >
            <CompassMark size={32} />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-white">
            Admin Login
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Sign in to manage users and permissions
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={login}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40"
        >
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-[#78c84d]/50 focus:ring-2 focus:ring-[#78c84d]/30"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-9 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-[#78c84d]/50 focus:ring-2 focus:ring-[#78c84d]/30"
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ background: "linear-gradient(135deg, #78c84d, #48ca02)" }}
            className="w-full rounded-lg py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Restricted access — authorized administrators only.
        </p>
      </div>
    </div>
  );
}