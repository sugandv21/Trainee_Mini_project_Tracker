import React from "react";

export default function Footer() {
  return (
    <footer
      className="py-6 mt-10 text-white"
      style={{
        background: "linear-gradient(90deg, #6b21a8, #9333ea)", 
      }}
    >
      <div className="container mx-auto text-center text-sm">
        © {new Date().getFullYear()}{" "}
        <span className="font-semibold">Trainee Mini Project Tracker</span>. All rights reserved.
      </div>
    </footer>
  );
}
