// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../utils/auth";
import ProjectCard from "../components/ProjectCard";
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dueDateFilter, setDueDateFilter] = useState("");
  const [message, setMessage] = useState(null); // { type: "success"|"error", text }
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, title: "" });
  const nav = useNavigate();

  const fetch = async (params = {}) => {
    setLoading(true);
    try {
      const q = new URLSearchParams(params).toString();
      const path = q ? `/mini-projects/?${q}` : "/mini-projects/";
      const resp = await api.get(path);
      setProjects(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      console.error("Failed to load projects", e);
      setProjects([]);
      setMessage({ type: "error", text: "Failed to load projects. Try again." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = {};
    if (priorityFilter) params.priority = priorityFilter;
    if (dueDateFilter) params.due_date = dueDateFilter;
    fetch(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priorityFilter, dueDateFilter]);

  // Open confirm modal (called by ProjectCard delete button)
  const handleDeleteRequest = (id, title) => {
    setConfirmDelete({ open: true, id, title });
  };

  const cancelDelete = () => setConfirmDelete({ open: false, id: null, title: "" });

  const performDelete = async () => {
    if (!confirmDelete.id) return;
    const id = confirmDelete.id;
    try {
      await api.delete(`/mini-projects/${id}/`);
      setProjects((p) => p.filter((x) => x.id !== id));
      setMessage({ type: "success", text: "Project deleted." });
    } catch (err) {
      console.error("Delete failed", err);
      setMessage({ type: "error", text: "Delete failed. Check permissions or try again." });
    } finally {
      cancelDelete();
    }
  };

  const handleEdit = (id) => nav(`/trainer/edit/${id}`);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Floating toast message */}
      {message && (
        <div
          role="status"
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded shadow ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="flex-1 text-sm">{message.text}</div>
            <button className="font-semibold text-sm" onClick={() => setMessage(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <h2 className="text-4xl font-bold text-purple-800">Dashboard</h2>
        {user?.role === "trainer" && (
          <Link
            to="/trainer/create"
            className="px-5 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg hover:opacity-90 transition transform hover:scale-105"
          >
            + Create Project
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-purple-100">
        <h3 className="text-xl font-semibold mb-5 text-purple-700">Filters</h3>
        <div className="flex flex-wrap gap-6 items-end">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base"
            >
              <option value="">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDateFilter}
              onChange={(e) => setDueDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setPriorityFilter("");
                setDueDateFilter("");
                setMessage(null);
              }}
              className="px-5 py-2 rounded-lg border border-purple-500 text-purple-600 hover:bg-purple-50 text-base transition"
            >
              Clear
            </button>
            <button
              onClick={() => fetch({ priority: priorityFilter, due_date: dueDateFilter })}
              className="px-5 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg hover:opacity-90 text-base transition transform hover:scale-105"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Projects grid */}
      {loading ? (
        <div className="text-center text-gray-600 text-lg mt-12">Loading projects...</div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onDelete={user?.role === "trainer" ? () => handleDeleteRequest(p.id, p.title) : undefined}
              onEdit={user?.role === "trainer" ? () => handleEdit(p.id) : undefined}
              showTraineeList={user?.role === "trainer"}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 text-lg mt-12">
          No projects found. Try adjusting your filters.
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold">Confirm Delete</h3>
            <p className="mt-3 text-gray-600">
              Are you sure you want to delete <strong>{confirmDelete.title}</strong>? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={cancelDelete} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={performDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
