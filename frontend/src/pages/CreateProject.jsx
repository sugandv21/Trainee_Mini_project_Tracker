import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate, useParams } from "react-router-dom";

export default function CreateProject() {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [assigned, setAssigned] = useState([]); 
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    let mounted = true;

    api
      .get("/users/")
      .then((r) => {
        if (!mounted) return;
        setUsers(Array.isArray(r.data) ? r.data : []);
      })
      .catch((err) => {
        console.error("Failed to load users", err);
      });

    if (id) {
      api
        .get(`/mini-projects/${id}/`)
        .then((r) => {
          if (!mounted) return;
          const p = r.data || {};
          setTitle(p.title || "");
          setDescription(p.description || "");
          setPriority(p.priority || "medium");

          const dd = p.due_date || "";
          if (dd) {
            const dateOnly = dd.slice(0, 10);
            setDueDate(dateOnly);
          } else {
            setDueDate("");
          }

          const assignedRaw = p.assigned_to || [];
          const assignedIds = Array.isArray(assignedRaw)
            ? assignedRaw
                .map((it) => {
                  if (typeof it === "number") return it;
                  if (it && typeof it === "object" && ("id" in it || "pk" in it)) return it.id ?? it.pk;
                  const n = Number(it);
                  return Number.isNaN(n) ? null : n;
                })
                .filter((n) => n !== null && n !== undefined)
            : [];
          setAssigned(assignedIds);
        })
        .catch((err) => {
          console.error("Failed to fetch project", err);
        });
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const assignedNums = (assigned || [])
        .map((a) => (typeof a === "string" ? Number(a) : a))
        .filter((n) => !Number.isNaN(n));

      const payload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        ...(dueDate ? { due_date: dueDate } : {}),
        assigned_to: assignedNums,
      };

      if (id) {
        await api.put(`/mini-projects/${id}/`, payload);
      } else {
        await api.post("/mini-projects/", payload);
      }

      nav("/dashboard");
    } catch (err) {
      console.error("Save failed", err);

      const data = err?.response?.data;

      if (data && data.traceback) {
        console.error("Server traceback:\n", data.traceback);
        alert("Save failed on server — traceback printed to console (DEBUG=True).");
      } else {
        const serverMsg =
          data?.detail ||
          (data && typeof data === "string" ? data : null) ||
          JSON.stringify(data || err.message || "Unknown error");
        alert("Save failed: " + serverMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg mt-10">
      <h2 className="text-3xl font-bold text-purple-800 mb-6">{id ? "Edit Project" : "Create Project"}</h2>
      <form onSubmit={submit} className="space-y-5">

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project Title"
            className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Project Description"
            className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base resize-none"
            rows={4}
            required
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex-1 flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2">
            Assign to Trainees (select multiple)
          </label>
          <select
            multiple
            value={assigned.map((a) => String(a))}
            onChange={(e) =>
              setAssigned(Array.from(e.target.selectedOptions, (o) => Number(o.value)).filter((n) => !Number.isNaN(n)))
            }
            className="h-36 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 mt-4">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold text-lg shadow-lg hover:opacity-90 hover:scale-105 transition transform ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (id ? "Saving..." : "Creating...") : "Save"}
          </button>
          <button
            type="button"
            onClick={() => nav("/dashboard")}
            className="flex-1 px-6 py-3 rounded-2xl border border-purple-500 text-purple-700 font-semibold text-lg hover:bg-purple-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
