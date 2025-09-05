import React from "react";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="centered">
      <h1>Welcome to mediCore</h1>
      <p>Please choose an option:</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 250 }}>
        <button onClick={() => navigate("/admin-login")} style={{ padding: '12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}>
          👨‍💼 Admin Login
        </button>
        <button onClick={() => navigate("/register")} style={{ padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
          📝 User Registration
        </button>
        <button onClick={() => navigate("/login")} style={{ padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>
          🔑 User Login 
        </button>
        
        {/* Emergency Access Section */}
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: '#fff3cd', 
          border: '2px solid #ffc107', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>🚨 Emergency Access</h3>
          <p style={{ color: '#856404', margin: '0 0 15px 0', fontSize: '14px' }}>
            For authorized doctors and admins only
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              onClick={() => navigate("/emergency-access")}
              style={{ 
                padding: '12px 20px', 
                backgroundColor: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)'
              }}
            >
              🚨 Emergency Access
            </button>
            <p style={{ color: '#856404', margin: '0', fontSize: '12px' }}>
              Direct access to emergency patient records
            </p>
          </div>
        </div>
      </div>
      
      {/* <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Note:</strong> User Login handles Patients, Doctors, and Staff automatically</p>
        <p>Admin Login is separate for system administration</p>
      </div> */}
    </div>
  );
}

export default LandingPage;
