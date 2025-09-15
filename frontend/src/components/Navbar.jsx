import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../utils/auth";

export default function Navbar() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg transition-colors duration-200 
     ${isActive 
       ? "bg-purple-700 text-white" 
       : "text-white hover:bg-purple-600 hover:text-white"}`;

  return (
    <nav className="shadow text-white"
      style={{
        background: "linear-gradient(90deg, #6b21a8, #9333ea)", // purple shades
      }}
    >
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="font-bold text-xl text-white">
          TraineeTracker
        </Link>
        <div className="flex items-center gap-4">
          <NavLink to="/" className={linkClass}>Home</NavLink>
          <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
          {user?.role === "trainer" && (
            <NavLink to="/trainer/create" className={linkClass}>
              Create Project
            </NavLink>
          )}
          {user ? (
            <>
              <span className="text-sm text-gray-200">
                {user.username}
                {user.role && (
                  <span className="ml-2 text-gray-300 text-xs">
                    ({user.role})
                  </span>
                )}
              </span>
              <button
                onClick={logout}
                className="px-3 py-2 rounded-lg border border-white text-white hover:bg-purple-800 transition-colors duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className={linkClass}>
              Login
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
