import React from "react";
import { Link } from "react-router-dom";

export default function ProjectCard({ project, onDelete, onEdit, showTraineeList }) {
  const priorityColors = {
    low: "bg-green-100 text-green-700 border-green-300",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
    high: "bg-red-100 text-red-700 border-red-300",
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-[1.02] transition transform">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-bold text-gray-800">{project.title}</h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium border ${priorityColors[project.priority] || "bg-gray-100 text-gray-600 border-gray-300"}`}
        >
          {project.priority || "N/A"}
        </span>
      </div>

      <p className="text-base text-gray-700 leading-relaxed mb-4">
        {project.description}
      </p>

      <div className="text-sm text-gray-600 mb-4">
        <span className="font-medium">Assigned:</span>{" "}
        {showTraineeList
          ? project.assigned_to_details.map((u) => u.username).join(", ")
          : project.assigned_to_details
              .map((u) => u.username)
              .slice(0, 3)
              .join(", ")}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4 text-base">
          <Link
            to={`/projects/${project.id}`}
            className="text-purple-700 font-semibold hover:underline"
          >
            Open
          </Link>
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-purple-500 text-purple-600 hover:bg-purple-50 transition"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-red-500 text-red-600 hover:bg-red-50 transition"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <div>📅 <span className="font-medium">Given:</span> {new Date(project.created_at).toLocaleDateString()}</div>
        <div>⏳ <span className="font-medium">Due:</span> {project.due_date || "—"}</div>
      </div>
    </div>
  );
}
