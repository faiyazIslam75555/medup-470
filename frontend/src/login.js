import React, { useState } from "react";
import axios from "axios";

export default function Login({ onLoginSuccess }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const res = await axios.post("http://localhost:3000/api/users/login", form);
      setMsg(res.data.msg);
      if (res.data.msg && res.data.msg.toLowerCase().includes("success")) {
        setTimeout(() => {
          setMsg("");
          onLoginSuccess(res.data.user);
        }, 1000);
      }
    } catch (err) {
      setMsg(err.response?.data?.msg || "Error logging in");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Login</button>
      </form>
      <div>{msg}</div>
    </div>
  );
}
