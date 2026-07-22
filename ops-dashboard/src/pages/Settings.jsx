import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../api/profileApi";
import {
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  X,
  AlertCircle,
  Bell,
  BellRing,
  ArrowLeft,
} from "lucide-react";
import { getNotifications, updateNotifications } from "../api/notificationApi";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    photo: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState({
    notification_type: "updates",
    reminder_days: 1,
  });

  useEffect(() => {
    loadProfile();
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      const { data } = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function loadProfile() {
    try {
      const { data } = await getProfile();

      setProfile({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        bio: data.bio || "",
        photo: data.photo || "",
      });
    } catch (err) {
      console.error(err);
      setError("Unable to load your profile. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");

      await updateProfile({
        name: profile.name,
        phone: profile.phone,
        bio: profile.bio,
      });

      setToast({
        id: Date.now(),
        title: "Profile updated",
        message: "Your changes have been saved successfully.",
      });
    } catch (err) {
      console.error(err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function saveNotifications() {
    try {
      setSavingNotifications(true);

      await updateNotifications(notifications);

      setToast({
        id: Date.now(),
        title: "Notification settings updated",
        message:
          notifications.notification_type === "reminder"
            ? `You'll be reminded ${notifications.reminder_days} day${
                notifications.reminder_days > 1 ? "s" : ""
              } before each due date.`
            : "You'll be notified on every task update.",
      });
    } catch (err) {
      console.log(err);
    } finally {
      setSavingNotifications(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#78c84d]" />
          <p className="text-sm text-slate-400">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] py-5 text-slate-100">
      <div className="mx-auto max-w-6xl px-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white">Settings</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your profile and notification preferences
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40">
          <h2 className="mb-5 text-sm font-semibold text-white">
            My Profile
          </h2>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Avatar */}
          <div className="mb-8 flex items-center gap-5">
            {profile.photo ? (
              <img
                src={profile.photo}
                alt=""
                className="h-20 w-20 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 text-2xl font-semibold text-white"
                style={{
                  background: "linear-gradient(135deg, #78c84d, #48ca02)",
                }}
              >
                {profile.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}

            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-white">
                {profile.name || "Unnamed User"}
              </h2>
              <p className="truncate text-sm text-slate-400">
                {profile.email}
              </p>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Name
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors focus:border-[#78c84d]/50 focus:ring-2 focus:ring-[#78c84d]/30"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      name: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                />
                <input
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-white/5 bg-white/[0.02] py-2.5 pl-9 pr-3 text-sm text-slate-500 outline-none"
                  value={profile.email}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Phone
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors focus:border-[#78c84d]/50 focus:ring-2 focus:ring-[#78c84d]/30"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      phone: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Bio
              </label>
              <div className="relative">
                <FileText
                  size={16}
                  className="pointer-events-none absolute left-3 top-3 text-slate-500"
                />
                <textarea
                  rows="4"
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors focus:border-[#78c84d]/50 focus:ring-2 focus:ring-[#78c84d]/30"
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      bio: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: "linear-gradient(135deg, #78c84d, #48ca02)" }}
            className="mt-7 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
              <Bell size={15} className="text-slate-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Email Notifications
              </h2>
              <p className="text-xs text-slate-500">
                Choose how you want to hear about task activity
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
                notifications.notification_type === "updates"
                  ? "border-[#78c84d]/40 bg-[#78c84d]/[0.06]"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              <input
                type="radio"
                name="notify"
                className="sr-only"
                checked={notifications.notification_type === "updates"}
                onChange={() =>
                  setNotifications({
                    ...notifications,
                    notification_type: "updates",
                  })
                }
              />
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  notifications.notification_type === "updates"
                    ? "border-[#78c84d]"
                    : "border-slate-600"
                }`}
              >
                {notifications.notification_type === "updates" && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background:
                        "linear-gradient(135deg, #78c84d, #48ca02)",
                    }}
                  />
                )}
              </span>
              <div>
                <p className="text-sm font-medium text-white">
                  Every task update
                </p>
                <p className="text-xs text-slate-500">
                  Get an email whenever a task changes
                </p>
              </div>
            </label>

            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
                notifications.notification_type === "reminder"
                  ? "border-[#78c84d]/40 bg-[#78c84d]/[0.06]"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              <input
                type="radio"
                name="notify"
                className="sr-only"
                checked={notifications.notification_type === "reminder"}
                onChange={() =>
                  setNotifications({
                    ...notifications,
                    notification_type: "reminder",
                  })
                }
              />
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  notifications.notification_type === "reminder"
                    ? "border-[#78c84d]"
                    : "border-slate-600"
                }`}
              >
                {notifications.notification_type === "reminder" && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background:
                        "linear-gradient(135deg, #78c84d, #48ca02)",
                    }}
                  />
                )}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  Reminder before due date
                </p>
                <p className="text-xs text-slate-500">
                  Get a heads-up before a task is due
                </p>

                {notifications.notification_type === "reminder" && (
                  <div className="relative mt-3 w-40">
                    <BellRing
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <select
                      className="w-full appearance-none rounded-lg border border-white/10 bg-[#09090b] py-2 pl-8 pr-3 text-xs text-white outline-none transition-colors focus:border-[#78c84d]/50 focus:ring-2 focus:ring-[#78c84d]/30"
                      value={notifications.reminder_days}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          reminder_days: Number(e.target.value),
                        })
                      }
                    >
                      <option value={1}>1 day before</option>
                      <option value={2}>2 days before</option>
                      <option value={3}>3 days before</option>
                      <option value={4}>4 days before</option>
                      <option value={5}>5 days before</option>
                    </select>
                  </div>
                )}
              </div>
            </label>
          </div>

          <button
            onClick={saveNotifications}
            disabled={savingNotifications}
            style={{ background: "linear-gradient(135deg, #78c84d, #48ca02)" }}
            className="mt-6 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {savingNotifications ? "Saving…" : "Save Notification Settings"}
          </button>
        </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] w-80 max-w-[calc(100vw-2.5rem)]">
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#111113] p-4 shadow-2xl shadow-black/40">
            <div
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ background: "linear-gradient(135deg, #78c84d, #48ca02)" }}
            >
              <CheckCircle2 size={16} className="text-white" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">{toast.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}