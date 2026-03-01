"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import "../../styles/dashboard.css";

export default function AttendancePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    leaveDays: 0,
    totalHours: 0,
    averageHours: 0,
  });

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      const userdata = await fetch("/api/users/getData", {
        method: "GET",
        credentials: "include",
      });

      const ReceivedData = await userdata.json();
      const userDataJson = JSON.parse(ReceivedData);
      const userId = userDataJson.user.userId;
      const companyId = userDataJson.user.companyId;

      if (userdata.status === 200) {
        setUser(userDataJson.user);
        setEmployee(userDataJson.Employee);
      }

      // Load attendance
      const GetAttendance = await fetch(
        `/api/users/attendance?userId=${userId}&companyId=${companyId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const attendanceData = await GetAttendance.json();
      if (GetAttendance.status === 200) {
        setAttendance(attendanceData);
        calculateStats(attendanceData);
      }
    } catch (error) {
      console.error("Error loading attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (attendanceRecords) => {
    let totalHours = 0;
    let presentDays = 0;
    let absentDays = 0;
    let leaveDays = 0;

    attendanceRecords.forEach((record) => {
      if (record.clockIn && record.clockOut) {
        const clockInTime = new Date(record.clockIn);
        const clockOutTime = new Date(record.clockOut);
        const hours =
          (clockOutTime - clockInTime) / (1000 * 60 * 60);
        totalHours += hours;
        presentDays++;
      } else if (record.status === "leave") {
        leaveDays++;
      } else if (record.status === "absent") {
        absentDays++;
      }
    });

    setStats({
      totalDays: attendanceRecords.length,
      presentDays,
      absentDays,
      leaveDays,
      totalHours: totalHours.toFixed(2),
      averageHours: (totalHours / (presentDays || 1)).toFixed(2),
    });
  };

  const getHoursWorked = (record) => {
    if (record.clockIn && record.clockOut) {
      const clockInTime = new Date(record.clockIn);
      const clockOutTime = new Date(record.clockOut);
      const hours = (clockOutTime - clockInTime) / (1000 * 60 * 60);
      return hours.toFixed(2);
    }
    return "0";
  };

  if (loading) {
    return (
      <div>
        <Navbar onLogout={() => router.push("/")} />
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar onLogout={() => router.push("/")} />
      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-brand">keka</div>
          <ul className="sidebar-menu">
            <li onClick={() => router.push("/dashboard")}>Home</li>
            <li className="menu-item-with-submenu">
              <div className="menu-item-header">
                Me
                <span className="arrow">›</span>
              </div>
              <ul className="submenu">
                <li onClick={() => router.push("/me/attendance")}>
                  Attendance
                </li>
                <li onClick={() => router.push("/me/leave")}>Leave</li>
              </ul>
            </li>
            <li>Inbox</li>
            <li>My Team</li>
            <li>My Finances</li>
            <li>Org</li>
            <li>Engage</li>
            <li>Performance</li>
          </ul>
        </aside>

        <main className="dashboard-container">
          <div className="welcome-section">
            <h1>My Attendance</h1>
            <p>View your attendance history and work hours</p>
          </div>

          {/* Statistics Cards */}
          <div className="stats-container">
            <div className="stat-card">
              <h4>Total Days</h4>
              <div className="stat-number">{stats.totalDays}</div>
            </div>
            <div className="stat-card">
              <h4>Present Days</h4>
              <div className="stat-number" style={{ color: "#00d084" }}>
                {stats.presentDays}
              </div>
            </div>
            <div className="stat-card">
              <h4>Absent Days</h4>
              <div className="stat-number" style={{ color: "#ff6b6b" }}>
                {stats.absentDays}
              </div>
            </div>
            <div className="stat-card">
              <h4>Leave Days</h4>
              <div className="stat-number" style={{ color: "#ffc300" }}>
                {stats.leaveDays}
              </div>
            </div>
            <div className="stat-card">
              <h4>Total Hours</h4>
              <div className="stat-number">{stats.totalHours}h</div>
            </div>
            <div className="stat-card">
              <h4>Average Hours/Day</h4>
              <div className="stat-number">{stats.averageHours}h</div>
            </div>
          </div>

          {/* Attendance Records Table */}
          <div className="card full-width">
            <h3>Attendance Records</h3>
            {attendance.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Clock In</th>
                      <th>Clock Out</th>
                      <th>Hours Worked</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance
                      .slice()
                      .reverse()
                      .map((record, index) => (
                        <tr key={index}>
                          <td>
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td>
                            {record.clockIn
                              ? new Date(record.clockIn).toLocaleTimeString()
                              : "-"}
                          </td>
                          <td>
                            {record.clockOut
                              ? new Date(record.clockOut).toLocaleTimeString()
                              : "-"}
                          </td>
                          <td>{getHoursWorked(record)} hrs</td>
                          <td>
                            <span
                              className={`status status-${
                                record.status?.toLowerCase() || "present"
                              }`}
                            >
                              {record.status || "Present"}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No attendance records found</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
