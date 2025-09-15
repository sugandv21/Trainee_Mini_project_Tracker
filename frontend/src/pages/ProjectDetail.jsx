import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../utils/auth";
import TraineeProgressForm from "./TraineeProgressForm";

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); 
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const nav = useNavigate();

  const priorityColors = {
    low: "bg-green-100 text-green-700 border-green-300",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
    high: "bg-red-100 text-red-700 border-red-300",
  };

  const fetchProject = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/mini-projects/${id}/`);
      setProject(r.data);
    } catch (err) {
      console.error("fetchProject error:", err);
      setProject(null);
      setMessage({ type: "error", text: "Failed to load project. Please try again." });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    const handler = (e) => {
      if (e?.detail?.projectId && String(e.detail.projectId) === String(id)) {
        fetchProject();
      }
    };
    window.addEventListener("progress:saved", handler);
    return () => window.removeEventListener("progress:saved", handler);
  }, [id, fetchProject]);

  // comments
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentingId, setCommentingId] = useState(null);

  const handleCommentChange = (progressId, text) =>
    setCommentDrafts((d) => ({ ...d, [progressId]: text }));

  const submitComment = async (progressEntry) => {
    const text = (commentDrafts[progressEntry.id] || "").trim();
    if (!text) {
      setMessage({ type: "error", text: "Please enter a comment." });
      return;
    }

    setCommentingId(progressEntry.id);
    try {
      await api.post(`/mini-projects/${id}/comment/`, {
        trainee: progressEntry.trainee,
        comment: text,
      });
      setCommentDrafts((d) => ({ ...d, [progressEntry.id]: "" }));
      await fetchProject();
      setMessage({ type: "success", text: "Comment posted." });
      try {
        window.dispatchEvent(
          new CustomEvent("progress:saved", {
            detail: { projectId: id, progress: { trainee: progressEntry.trainee } },
          })
        );
      } catch {}
    } catch (err) {
      console.error("Failed to post comment", err);
      setMessage({ type: "error", text: "Failed to post comment. Check network or permissions." });
    } finally {
      setCommentingId(null);
    }
  };

  const openDelete = () => setShowDeleteModal(true);
  const closeDelete = () => setShowDeleteModal(false);

  const confirmDelete = async () => {
    setDeleting(true);
    setMessage(null);
    try {
      await api.delete(`/mini-projects/${project.id}/`);
      setMessage({ type: "success", text: "Project deleted." });
      setShowDeleteModal(false);
      setTimeout(() => nav("/dashboard"), 500);
    } catch (err) {
      console.error("Delete failed", err);
      setMessage({ type: "error", text: "Delete failed. Try again." });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-center text-lg">Loading...</div>;
  if (!project) return <div className="text-center text-lg">Not found</div>;

  const allEntries = Array.isArray(project.progress_entries) ? project.progress_entries : [];
  const entriesToShow =
    user?.role === "trainer" ? allEntries : allEntries.filter((pe) => pe.trainee === user.id);

  return (
    <div className="max-w-4xl mx-auto p-6">

      {message && (
        <div
          role="status"
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded shadow ${
            message.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 text-sm">{message.text}</div>
            <button className="text-sm font-semibold" onClick={() => setMessage(null)}>Dismiss</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 hover:shadow-xl transition">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{project.title}</h2>
            <p className="text-lg text-gray-700 mt-2 leading-relaxed">{project.description}</p>

            <div className="mt-4 space-y-1 text-gray-600 text-base">
              <div>
                📅 <span className="font-medium">Given:</span>{" "}
                {project.created_at ? new Date(project.created_at).toLocaleString() : "—"}
              </div>
              <div>
  ⏳ <span className="font-medium">Due:</span>{" "}
  {project.due_date ? new Date(project.due_date).toLocaleDateString() : "—"}
</div>

              <div>
                🎯 <span className="font-medium">Priority:</span>{" "}
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${priorityColors[project.priority] || "bg-gray-100 text-gray-600 border-gray-300"}`}>
                  {project.priority || "—"}
                </span>
              </div>
            </div>
          </div>

          {user?.role === "trainer" && (
            <div className="flex gap-3">
              <button onClick={() => nav(`/trainer/edit/${project.id}`)} className="btn-outline">Edit</button>
              <button onClick={openDelete} className="btn-outline text-red-600 border-red-500 hover:bg-red-50">Delete</button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-5 mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Assigned Trainees</h3>
        <div className="text-base text-gray-700 mt-2">
          {Array.isArray(project.assigned_to_details) ? project.assigned_to_details.map((u) => u.username).join(", ") : "—"}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-5 mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Progress Entries</h3>
        {entriesToShow.length === 0 && <div className="text-base text-gray-500 mt-3">No progress yet</div>}

        <div className="space-y-5 mt-4">
          {entriesToShow.map((pe) => (
            <div key={pe.id} className="bg-gray-50 border rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between">
                <div className="font-semibold text-lg text-gray-800">{pe.trainee_details?.username || "Trainee"}</div>
                <div className="text-sm px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">{pe.status || "—"}</div>
              </div>

              <div className="text-base text-gray-700 mt-3 space-y-2">
                <div>📄 Report: {pe.report ? <a href={pe.report} target="_blank" rel="noreferrer" className="text-purple-600 underline hover:text-purple-800">Open Report</a> : "—"}</div>
                <div>🚀 Deployment: {pe.deployment_link ? <a href={pe.deployment_link} target="_blank" rel="noreferrer" className="text-purple-600 underline hover:text-purple-800">Visit Deployment</a> : "—"}</div>
                <div>💻 Github: {pe.github_link ? <a href={pe.github_link} target="_blank" rel="noreferrer" className="text-purple-600 underline hover:text-purple-800">View Repository</a> : "—"}</div>
                <div>✅ Completed at: {pe.completed_at ? new Date(pe.completed_at).toLocaleString() : "—"}</div>
              </div>

              <div className="mt-4 border-t pt-3">
                <div className="text-sm font-semibold">Trainer Comment</div>
                <div className="text-base text-gray-700 mt-1">{pe.trainer_comment ? pe.trainer_comment : <span className="text-gray-400">No comment yet</span>}</div>
              </div>

              {user?.role === "trainer" && (
                <div className="mt-3">
                  <textarea value={commentDrafts[pe.id] ?? ""} onChange={(e) => handleCommentChange(pe.id, e.target.value)} placeholder="Write a comment for this trainee..." className="w-full border rounded-lg p-3 text-base" rows={3} />
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => submitComment(pe)} className="btn-primary" disabled={commentingId === pe.id}>{commentingId === pe.id ? "Posting…" : "Post Comment"}</button>
                    <button onClick={async () => { setCommentDrafts((d) => ({ ...d, [pe.id]: "" })); await fetchProject(); }} className="btn-outline">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {user?.role === "trainee" && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-semibold text-gray-800 border-b pb-3">✍️ Your Progress</h3>
          <div className="mt-4 text-base text-gray-700">
            <p className="mb-3">Update your project progress below. You can submit your <span className="font-semibold">report, deployment link, and GitHub link</span>.</p>
            <TraineeProgressForm projectId={id} onSaved={() => fetchProject()} />
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold">Confirm Delete</h3>
            <p className="mt-3 text-gray-600">Are you sure you want to delete <span className="font-medium">{project.title}</span>? This action cannot be undone.</p>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeDelete} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
