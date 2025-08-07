import React, { useState } from "react";
import Login from "./login";
import Register from "./Register";
import SymptomForm from "./SymptomForm";
import DoctorPage from "./DoctorPage";
import AdminPage from "./AdminPage";

function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);

  const handleRegisterSuccess = () => setPage("login");
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setPage("symptom");
  };

  // Optionally, you can add a logout function
  const handleLogout = () => {
    setUser(null);
    setPage("login");
  };

  return (
    <div>
      {/* Add a persistent Admin button for testing/demo */}
      <div style={{ textAlign: "right", padding: "12px" }}>
        <button onClick={() => setPage("admin")}>Admin: Doctors</button>
        <button onClick={() => setPage("doctor")} style={{ marginLeft: 8 }}>Doctor Dashboard</button>
        {user && <button style={{ marginLeft: 8 }} onClick={handleLogout}>Logout</button>}
      </div>
      
      {page === "login" && (
        <>
          <Login onLoginSuccess={handleLoginSuccess} />
          <p style={{ textAlign: "center", marginTop: "12px" }}>
            Don’t have an account?{" "}
            <button onClick={() => setPage("register")}>Register</button>
          </p>
        </>
      )}

      {page === "register" && (
        <>
          <Register onRegisterSuccess={handleRegisterSuccess} />
          <p style={{ textAlign: "center", marginTop: "12px" }}>
            Already have an account?{" "}
            <button onClick={() => setPage("login")}>Login</button>
          </p>
        </>
      )}

      {page === "symptom" && (
        <SymptomForm user={user} />
      )}

      {page === "admin" && (
        <AdminPage />
      )}

      {page === "doctor" && (
        <DoctorPage />
      )}
    </div>
  );
}

export default App;
