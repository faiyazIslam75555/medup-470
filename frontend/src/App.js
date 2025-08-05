import React, { useState } from "react";
import Login from "./login";
import Register from "./Register";
import SymptomForm from "./SymptomForm"; // <-- Import the new form

function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);

  const handleRegisterSuccess = () => setPage("login");
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setPage("symptom");
  };

  return (
    <div>
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
    </div>
  );
}

export default App;
