import React from "react";

export default function SymptomPage({ user }) {
  return (
    <div>
      <h2>Welcome, {user?.full_name || "User"}! This is your dashboard page.</h2>
    </div>
  );
}
