'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authAPI from '@/lib/authAPI';
import Navbar from '@/components/Navbar';
import '../styles/dashboard.css';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [clockStatus, setClockStatus] = useState('not-clocked-in');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      router.push('/');
      return;
    }

    if (authAPI.isAdmin()) {
      router.push('/admin');
      return;
    }

    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const userId = authAPI.getUserId();
      const companyId = authAPI.getCompanyId();

      // Load user data
      const userData = await authAPI.getUserData(userId, companyId);
      if (userData.success) {
        setUser(userData.data);
      }

      // Load leaves
      const leavesData = await authAPI.getUserLeaves(companyId, userId);
      if (leavesData.success) {
        setLeaves(leavesData.data);
      }

      // Load leave balance
      const balanceData = await authAPI.getLeaveBalance(companyId, userId);
      if (balanceData.success) {
        setLeaveBalance(balanceData.data);
      }

      // Load attendance
      const attendanceData = await authAPI.getAttendance(companyId, userId);
      if (attendanceData.success) {
        setAttendance(attendanceData.data);
        // Check clock status
        const today = new Date().toDateString();
        const todayRecord = attendanceData.data.find(
          (a) => new Date(a.date).toDateString() === today
        );
        if (todayRecord?.clockOut) {
          setClockStatus('clocked-out');
        } else if (todayRecord?.clockIn) {
          setClockStatus('clocked-in');
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setMessage('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      const userId = authAPI.getUserId();
      const companyId = authAPI.getCompanyId();
      const result = await authAPI.clockIn(companyId, userId);

      if (result.success) {
        setClockStatus('clocked-in');
        setMessage('Clocked in successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to clock in');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  const handleClockOut = async () => {
    try {
      const userId = authAPI.getUserId();
      const companyId = authAPI.getCompanyId();
      const result = await authAPI.clockOut(companyId, userId);

      if (result.success) {
        setClockStatus('clocked-out');
        setMessage('Clocked out successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to clock out');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar onLogout={() => router.push('/')} />
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar onLogout={() => router.push('/')} />
      <div className="dashboard-container">
        {message && <div className="alert">{message}</div>}

        <div className="welcome-section">
          <h1>Welcome, {user?.name || user?.email}!</h1>
          <p>Your HR Dashboard</p>
        </div>

        <div className="dashboard-content">
          {/* Attendance Card */}
          <div className="card">
            <h3>Attendance</h3>
            <div className="attendance-info">
              <p>Status: <strong>{clockStatus}</strong></p>
              {clockStatus === 'not-clocked-in' && (
                <button className="btn btn-primary" onClick={handleClockIn}>
                  Clock In
                </button>
              )}
              {clockStatus === 'clocked-in' && (
                <button className="btn btn-warning" onClick={handleClockOut}>
                  Clock Out
                </button>
              )}
            </div>
          </div>

          {/* Leave Balance Card */}
          <div className="card">
            <h3>Leave Balance</h3>
            {leaveBalance && Object.keys(leaveBalance).length > 0 ? (
              <div className="leave-balance-items">
                {Object.entries(leaveBalance).map(([key, value]) => (
                  <div key={key} className="balance-item">
                    <span>{key}:</span>
                    <strong>{value.remaining || 0}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No leave balance data</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={() => router.push('/leave/apply')}>
                Apply Leave
              </button>
              <button className="btn btn-secondary" onClick={() => router.push('/leave')}>
                View Leaves
              </button>
              <button className="btn btn-secondary" onClick={() => router.push('/attendance')}>
                Attendance
              </button>
              <button className="btn btn-secondary" onClick={() => router.push('/assets')}>
                Assets
              </button>
            </div>
          </div>
        </div>

        {/* Recent Leaves */}
        {leaves.length > 0 && (
          <div className="card full-width">
            <h3>Recent Leave Applications</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Status</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.slice(0, 5).map((leave) => (
                    <tr key={leave.id}>
                      <td>{leave.leaveTypeName}</td>
                      <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                      <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`status status-${leave.status?.toLowerCase()}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td>{leave.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
