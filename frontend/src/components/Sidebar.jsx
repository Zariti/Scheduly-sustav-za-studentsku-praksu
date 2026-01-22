import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaFileAlt,
  FaBuilding,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaUsers,
  FaClipboardCheck,
  FaList,
  FaBook,
  FaAddressBook,
} from "react-icons/fa";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Sidebar({ role, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    console.log("Logging out with token:", token);

    if (token) {
      try {
        await axios.post(`${API_URL}/auth/logout`, null, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Logout error:", err);
      }
    }

    localStorage.removeItem("token");
    onLogout();
  };

  return (
    <div className="sidebar">
      <h3>Menu</h3>
      <ul>
        <li onClick={() => navigate("/dashboard")}>
          <FaHome style={{ marginRight: 8 }} /> Home
        </li>

        {role === "admin" && (
          <>
            <li onClick={() => navigate("/admin/users")}>
              <FaUsers style={{ marginRight: 8 }} /> User Management
            </li>
            <li onClick={() => navigate("/admin/company")}>
              <FaAddressBook /> Company Management
            </li>
          </>
        )}
        {(role === "professor" || role === "admin" || role === "faculty") && (
          <>
            <li onClick={() => navigate("/faculty/reports")}>
              <FaClipboardCheck style={{ marginRight: 8 }} /> Review Reports
            </li>
            <li onClick={() => navigate("/faculty/applications")}>
              <FaFileAlt style={{ marginRight: 8 }} /> Approve Applications
            </li>
          </>
        )}
        {role === "student" && (
          <>
            <li onClick={() => navigate("/work-diary")}>
              <FaBook style={{ marginRight: 8 }} /> Work Diary
            </li>
            <li onClick={() => navigate("/practice-report")}>
              <FaFileAlt style={{ marginRight: 8 }} /> Practice Report
            </li>
            <li onClick={() => navigate("/my-applications")}>
              <FaFileAlt style={{ marginRight: 8 }} /> My Applications
            </li>
          </>
        )}
        {role === "mentorr" && (
          <li>
            <FaBuilding style={{ marginRight: 8 }} /> Mentor Dashboard
          </li>
        )}

        <li onClick={() => navigate("/profile")}>
          <FaUser style={{ marginRight: 8 }} /> Profile
        </li>
        <li onClick={() => navigate("/certificates")}>
          <FaList style={{ marginRight: 8 }} /> Certificates
        </li>
        <li onClick={() => navigate("/settings")}>
          <FaCog style={{ marginRight: 8 }} /> Settings
        </li>

        <li
          onClick={handleLogout}
          style={{ cursor: "pointer", color: "#ffb4b4" }}
        >
          <FaSignOutAlt style={{ marginRight: 8 }} /> Logout
        </li>
      </ul>
    </div>
  );
}
