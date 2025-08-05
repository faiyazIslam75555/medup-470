import React, { useEffect, useState } from "react";
import axios from "axios";

// Utility to generate all 3-hour slots from 8:00 to 23:00
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMES = [
  { start: "08:00", end: "11:00" },
  { start: "11:00", end: "14:00" },
  { start: "14:00", end: "17:00" },
  { start: "17:00", end: "20:00" },
  { start: "20:00", end: "23:00" }
];

export default function AdminDoctorPage() {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSlots, setAssignSlots] = useState({});

  // Load doctors and specialties
  useEffect(() => {
    fetchDoctors();
    fetchSpecialties();
  }, []);

  const fetchDoctors = async () => {
    const res = await axios.get("http://localhost:3000/api/admin/doctors");
    setDoctors(res.data);
  };
  const fetchSpecialties = async () => {
    const res = await axios.get("http://localhost:3000/api/symptoms/specialties");
    setSpecialties(res.data);
  };

  // Show assign slots modal
  const handleAssignSlots = (doctor) => {
    setSelectedDoctor(doctor);
    // Initialize with current assigned unbooked slots
    let current = {};
    for (const slot of doctor.available_slots || []) {
      if (!slot.isBooked) {
        current[`${slot.day}_${slot.start}`] = true;
      }
    }
    setAssignSlots(current);
    setShowAssignModal(true);
  };

  // Toggle slot selection in modal
  const toggleSlot = (day, start, end) => {
    const key = `${day}_${start}`;
    setAssignSlots(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Save assigned slots for doctor
  const saveSlots = async () => {
    const slots = [];
    for (const day of DAYS) {
      for (const time of TIMES) {
        const key = `${day}_${time.start}`;
        if (assignSlots[key]) {
          slots.push({ day, start: time.start, end: time.end, isBooked: false });
        }
      }
    }
    await axios.put(`http://localhost:3000/api/admin/doctors/${selectedDoctor._id}/slots`, { available_slots: slots });
    setShowAssignModal(false);
    fetchDoctors();
  };

  // Book a slot (set isBooked true)
  const bookSlot = async (doctorId, slot) => {
    await axios.put(`http://localhost:3000/api/admin/doctors/${doctorId}/slots/book`, {
      day: slot.day,
      start: slot.start,
      end: slot.end
    });
    fetchDoctors();
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto" }}>
      <h2>Doctor Management (Admin)</h2>
      <table border="1" cellPadding="8" style={{ width: "100%", background: "#fff", borderRadius: 8 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Specialty</th>
            <th>Department</th>
            <th>Experience (yrs)</th>
            <th>Available Slots</th>
            <th>Assign Slots</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map(doc => (
            <tr key={doc._id}>
              <td>{doc.name}</td>
              <td>
                {doc.specialty?.name || (
                  <span style={{ color: "#aaa" }}>Not set</span>
                )}
              </td>
              <td>{doc.department}</td>
              <td>{doc.experience_years}</td>
              <td>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {(doc.available_slots || []).map((slot, i) => (
                    <li key={i}
                      style={{
                        textDecoration: slot.isBooked ? "line-through" : "none",
                        color: slot.isBooked ? "#b00020" : "#098658"
                      }}>
                      {slot.day} {slot.start}-{slot.end}
                      {!slot.isBooked && (
                        <button style={{ marginLeft: 8 }} onClick={() => bookSlot(doc._id, slot)}>
                          Book
                        </button>
                      )}
                      {slot.isBooked && <span style={{ marginLeft: 8 }}>(booked)</span>}
                    </li>
                  ))}
                </ul>
              </td>
              <td>
                <button onClick={() => handleAssignSlots(doc)}>
                  Assign/Change Slots
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showAssignModal && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
          <div style={{ background: "#fff", padding: 32, borderRadius: 8, minWidth: 400 }}>
            <h3>Assign Slots for {selectedDoctor.name}</h3>
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {DAYS.map(day => (
                <div key={day} style={{ marginBottom: 6 }}>
                  <b>{day}:</b>{" "}
                  {TIMES.map(time => {
                    const key = `${day}_${time.start}`;
                    return (
                      <label key={key} style={{ marginRight: 14 }}>
                        <input
                          type="checkbox"
                          checked={!!assignSlots[key]}
                          onChange={() => toggleSlot(day, time.start, time.end)}
                        />
                        {time.start}-{time.end}
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
            <button onClick={saveSlots} style={{ marginTop: 18, marginRight: 10 }}>Save</button>
            <button onClick={() => setShowAssignModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
