import React, { useState, useEffect } from "react";
import api from "../api/axios";

export default function TraineeProgressForm({ projectId, onSaved }) {
  const [form, setForm] = useState({
    status: "todo",
    deployment_link: "",
    github_link: "",
    completed_at: "",
  });
  const [reportFile, setReportFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    api
      .get(`/mini-projects/${projectId}/my_progress/`)
      .then((r) => {
        if (!mounted) return;
        setForm({
          status: r.data.status || "todo",
          deployment_link: r.data.deployment_link || "",
          github_link: r.data.github_link || "",
          // normalize to value usable by datetime-local (YYYY-MM-DDTHH:MM[:SS])
          completed_at: r.data.completed_at ? r.data.completed_at.replace(/\.\d+Z?$/, "") : "",
        });
      })
      .catch(() => {
        if (!mounted) setMessage("Failed to load progress");
      });
    return () => (mounted = false);
  }, [projectId]);

  const toIsoString = (localDatetime) => {
    if (!localDatetime) return "";
    const dt = new Date(localDatetime);
    if (isNaN(dt.getTime())) {
      const s = localDatetime.length === 16 ? `${localDatetime}:00` : localDatetime;
      const dt2 = new Date(s);
      if (isNaN(dt2.getTime())) return localDatetime;
      return dt2.toISOString();
    }
    return dt.toISOString();
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const data = new FormData();
      data.append("status", form.status);
      if (reportFile) data.append("report", reportFile);
      if (form.deployment_link) data.append("deployment_link", form.deployment_link);
      if (form.github_link) data.append("github_link", form.github_link);

      if (form.completed_at) {
        const iso = toIsoString(form.completed_at);
        data.append("completed_at", iso);
      }

      const config = { headers: { "Content-Type": "multipart/form-data" } };
      const resp = await api.patch(`/mini-projects/${projectId}/my_progress/`, data, config);

      setForm((s) => ({
        ...s,
        completed_at: resp.data.completed_at ? resp.data.completed_at.replace(/\.\d+Z?$/, "") : s.completed_at,
        status: resp.data.status || s.status,
        deployment_link: resp.data.deployment_link || s.deployment_link,
        github_link: resp.data.github_link || s.github_link,
      }));

      setMessage("Saved successfully");

      if (typeof onSaved === "function") {
        try {
          await Promise.resolve(onSaved(resp.data));
        } catch (err) {
        }
      }

      try {
        if (typeof window !== "undefined" && window.CustomEvent) {
          window.dispatchEvent(
            new CustomEvent("progress:saved", {
              detail: { projectId, progress: resp.data },
            })
          );
        }
      } catch (e) {
      }
    } catch (err) {
      if (err?.response?.data) setMessage(JSON.stringify(err.response.data));
      else setMessage("Failed to save. Check network or permissions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 max-w-lg">
      <label className="block text-sm">Status</label>
      <select
        value={form.status}
        onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
        className="input"
      >
        <option value="todo">To Do</option>
        <option value="inprogress">In Progress</option>
        <option value="complete">Complete</option>
      </select>

      <label className="block text-sm">Deployment link</label>
      <input
        value={form.deployment_link || ""}
        onChange={(e) => setForm((s) => ({ ...s, deployment_link: e.target.value }))}
        placeholder="Deployment link"
        className="input"
      />

      <label className="block text-sm">GitHub link</label>
      <input
        value={form.github_link || ""}
        onChange={(e) => setForm((s) => ({ ...s, github_link: e.target.value }))}
        placeholder="GitHub link"
        className="input"
      />

      <label className="block text-sm">Upload report (PDF, ZIP etc.)</label>
      <input type="file" onChange={(e) => setReportFile(e.target.files[0])} className="input" />

      <label className="block text-sm">Completed date & time (optional)</label>
      <input
        type="datetime-local"
        value={form.completed_at || ""}
        onChange={(e) => setForm((s) => ({ ...s, completed_at: e.target.value }))}
        className="input"
      />

      <div className="flex gap-3 items-center">
        <button className="btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Save Progress"}
        </button>
        {form.completed_at && <div className="text-sm text-green-600">Completed at: {new Date(form.completed_at).toLocaleString()}</div>}
      </div>

      {message && <div className="text-sm text-gray-700 break-words">{message}</div>}
    </form>
  );
}
