import React from "react";
import { Link } from "react-router-dom";
import heroImg from "../assets/tracker.jpg"; 

export default function Home() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 px-6">
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Trainee Mini Project Tracker
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl">
            Track trainee projects, upload reports, and manage assignments.  
            Trainers can create and review projects, while trainees update their progress with ease.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center md:justify-start">
            <Link
              to="/dashboard"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg transition"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>

        <div className="flex-1">
          <img
            src={heroImg}
            alt="Trainee project dashboard preview"
            className="w-full max-w-md mx-auto drop-shadow-2xl rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}
