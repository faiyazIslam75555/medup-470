import React, { useState } from "react";
import axios from "axios";
import "./Register.css"; // Make sure this import matches the file name exactly

export default function Register({ onRegisterSuccess }) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  const [msg, setMsg] = useState("");

  // Email validation: checks if email includes '@'
  const validateEmail = (email) => email.includes("@");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!validateEmail(form.email)) {
      setMsg("Please enter a valid email address.");
      return;
    }

    try {
      const toSend = {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        dob: form.dob,
        gender: form.gender,
        address: form.address,
        emergency_contact: {
          name: form.emergency_contact_name,
          phone: form.emergency_contact_phone,
        },
      };
      const res = await axios.post("http://localhost:3000/api/users/register", toSend);
      setMsg(res.data.msg);
      if (res.data.msg && res.data.msg.toLowerCase().includes("success")) {
        setTimeout(() => {
          setMsg("");
          onRegisterSuccess();
        }, 1000);
      }
    } catch (err) {
      setMsg(err.response?.data?.msg || "Registration error");
    }
  };

  return (
    <div className="form-background">
      <div className="form-container">
        <h2 style={{ marginBottom: "1.5rem" }}>Register</h2>
        <form onSubmit={handleSubmit} className="form-main">
          <input name="full_name" placeholder="Full Name" value={form.full_name} onChange={handleChange} required />
          <input name="email" placeholder="Email" type="email" value={form.email} onChange={handleChange} required />
          <input name="password" placeholder="Password" type="password" value={form.password} onChange={handleChange} required />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required />
          <input name="dob" placeholder="Date of Birth (YYYY-MM-DD)" value={form.dob} onChange={handleChange} required />
          <select name="gender" value={form.gender} onChange={handleChange} required>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <input name="address" placeholder="Address" value={form.address} onChange={handleChange} required />
          <input name="emergency_contact_name" placeholder="Emergency Contact Name" value={form.emergency_contact_name} onChange={handleChange} required />
          <input name="emergency_contact_phone" placeholder="Emergency Contact Phone" value={form.emergency_contact_phone} onChange={handleChange} required />
          <button type="submit" className="form-button">Register</button>
        </form>
        <div className="form-message" style={{ color: msg.toLowerCase().includes("success") ? "green" : "crimson" }}>
          {msg}
        </div>
      </div>
    </div>
  );
}
