import React, { useState } from "react";
import axios from "axios";

export default function SymptomForm({ user }) {
  const [input, setInput] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // All possible symptoms (your provided list)
  const ALL_SYMPTOMS = [
    "abdominal pain", "acne", "blisters", "blood in stool", "blood in urine",
    "body ache", "blurred vision", "chest pain", "cold intolerance", "constipation", "cough",
    "diarrhea", "difficulty speaking", "difficulty swallowing", "dizziness", "double vision",
    "dry skin", "ear pain", "fatigue", "fainting", "fever", "flank pain", "frequent urination",
    "hair loss", "headache", "hearing loss", "heartburn", "hoarseness", "incontinence",
    "increased thirst", "itching", "itchy eyes", "joint pain", "joint swelling", "jaundice",
    "loss of appetite", "memory loss", "morning stiffness", "muscle pain", "nail changes",
    "nausea", "nasal congestion", "night sweats", "numbness", "palpitations", "painful urination",
    "rapid heartbeat", "rash", "red eyes", "redness", "runny nose", "seizure",
    "shortness of breath", "skin rash", "sore throat", "sputum", "swelling in legs",
    "tingling", "vomiting", "vision loss", "watery eyes", "weakness", "weight gain",
    "weight loss", "wheezing"
  ];

  // Suggestions: filter symptoms
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    setSuggestions(
      val
        ? ALL_SYMPTOMS.filter(
            (s) =>
              s.toLowerCase().startsWith(val.toLowerCase()) &&
              !symptoms.includes(s)
          ).slice(0, 6)
        : []
    );
  };

  // Add a symptom
  const addSymptom = (sym) => {
    const normalized = sym.trim().toLowerCase();
    if (normalized && !symptoms.includes(normalized)) {
      setSymptoms([...symptoms, normalized]);
    }
    setInput("");
    setSuggestions([]);
  };

  // Remove a symptom
  const removeSymptom = (sym) => {
    setSymptoms(symptoms.filter((s) => s !== sym));
  };

  // Search by symptoms
  const handleSearch = async () => {
    if (symptoms.length === 0) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await axios.post("http://localhost:3000/api/symptoms/search", {
        symptoms,
      });
      setResults(res.data);
      console.log("API Response:", res.data);
    } catch (err) {
      setResults({ error: "Sorry, could not process your symptoms." });
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        minHeight: "90vh", background: "#f8fafc"
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 900, margin: "40px auto", padding: 32,
          background: "#fff", borderRadius: 24, boxShadow: "0 6px 24px rgba(0,0,0,0.12)"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ margin: 0, textAlign: "left" }}>
              What are your <br />
              <span style={{ color: "#111" }}>symptoms, {user?.full_name || "USER"}?</span>
            </h2>
          </div>
        </div>
        {/* Symptom Input */}
        <div style={{ margin: "28px 0 10px 0", display: "flex", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Enter your medical condition"
            value={input}
            onChange={handleInputChange}
            onKeyDown={e => {
              if (e.key === "Enter" && input) addSymptom(input);
            }}
            style={{
              flex: 1, border: "none", background: "#e9ecef", padding: "12px 16px",
              borderRadius: 18, fontSize: 16, outline: "none"
            }}
          />
          <button
            style={{
              marginLeft: 12, padding: "8px 18px", borderRadius: 12,
              background: "#2dce89", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer"
            }}
            disabled={!input}
            onClick={() => addSymptom(input)}
          >
            Add
          </button>
        </div>
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {suggestions.map(s => (
              <span
                key={s}
                style={{
                  display: "inline-block", background: "#f3f4f6", borderRadius: 14,
                  margin: "0 7px 7px 0", padding: "6px 15px", fontSize: 15, cursor: "pointer",
                  border: "1px solid #2dce89", color: "#2dce89", fontWeight: 600
                }}
                onClick={() => addSymptom(s)}
              >
                {s}
              </span>
            ))}
          </div>
        )}
        {/* My Symptoms Chips */}
        <div>
          <div style={{ fontWeight: 600, margin: "16px 0 8px 0", fontSize: 18 }}>
            MY Symptoms
          </div>
          <div style={{ marginBottom: 18 }}>
            {symptoms.length === 0 && (
              <span style={{ color: "#adb5bd" }}>No symptoms added.</span>
            )}
            {symptoms.map(sym => (
              <span
                key={sym}
                style={{
                  display: "inline-block", background: "#e9ecef", borderRadius: 14,
                  margin: "0 7px 7px 0", padding: "6px 15px", fontSize: 15, fontWeight: 600,
                  position: "relative"
                }}
              >
                {sym}
                <button
                  onClick={() => removeSymptom(sym)}
                  style={{
                    background: "none", border: "none", color: "#dc3545", marginLeft: 6,
                    fontWeight: 700, cursor: "pointer", fontSize: 16
                  }}
                  title="Remove"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        {/* Search Button */}
        <div style={{ margin: "20px 0 22px 0" }}>
          <button
            style={{
              background: "#467fd0", color: "#fff", padding: "12px 34px",
              border: "none", borderRadius: 16, fontWeight: 700, fontSize: 18, cursor: "pointer"
            }}
            onClick={handleSearch}
            disabled={loading || symptoms.length === 0}
          >
            {loading ? "Searching..." : "Search by speciality"}
          </button>
        </div>
        {/* API results */}
        {results && (
          <div style={{ marginTop: 34 }}>
            {results.error ? (
              <div style={{ color: "#d90429", fontWeight: 700, fontSize: 18, textAlign: "center" }}>
                {results.error}
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 20, textAlign: "center" }}>
                  {results.recommended_doctors.length > 0
                    ? "Recommended Doctors"
                    : "No doctors found"}
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                  gap: 24
                }}>
                  {results.recommended_doctors.map((doc, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#f3f7fa", borderRadius: 18,
                        padding: "20px 16px", boxShadow: "0 2px 8px #e3e9f7",
                        display: "flex", flexDirection: "column", alignItems: "center"
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 2 }}>
                        {doc.name}
                      </div>
                      <div style={{ color: "#515760", marginBottom: 10, fontSize: 15 }}>
                        {doc.specialty}
                      </div>
                      <button
                        style={{
                          background: "#2dce89", color: "#fff", fontWeight: 700, border: "none",
                          padding: "7px 20px", borderRadius: 12, cursor: "pointer", fontSize: 15
                        }}
                      >
                        Book Appointment
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
