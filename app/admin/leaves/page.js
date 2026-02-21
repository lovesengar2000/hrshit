'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authAPI from '@/lib/authAPI';
import Navbar from '@/components/Navbar';
import '../../styles/dashboard.css';

export default function ManageLeaves() {
  const router = useRouter();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authAPI.isAuthenticated() || !authAPI.isAdmin()) {
      router.push('/');
      return;
    }

    loadLeaves();
  }, [router]);

  const loadLeaves = async () => {
    try {
      const companyId = authAPI.getCompanyId();
      const result = await authAPI.getAllLeaveRequestsAdmin(companyId);
      if (result.success) {
        setLeaves(result.data);
      } else {
        setMessage('Failed to load leaves');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      const companyId = authAPI.getCompanyId();
      const result = await authAPI.approveLeave(leaveId, companyId);
      if (result.success) {
        setMessage('Leave approved successfully');
        loadLeaves();
      } else {
        setMessage('Failed to approve leave');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      const companyId = authAPI.getCompanyId();
      const result = await authAPI.rejectLeave(leaveId, companyId, 'Rejected by admin');
      if (result.success) {
        setMessage('Leave rejected successfully');
        loadLeaves();
      } else {
        setMessage('Failed to reject leave');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        {message && <div className="alert">{message}</div>}

        <div className="welcome-section">
          <h1>Manage Leave Requests</h1>
          <p>Review and approve employee leave requests</p>
        </div>

        <div className="card full-width">
          <button className="btn btn-primary" onClick={() => router.push('/admin')}>
            ← Back to Admin
          </button>
        </div>

        {leaves.length > 0 ? (
          <div className="card full-width">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Leave Type</th>
                    <th>From Date</th>
                    <th>To Date</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave.id}>
                      <td>{leave.employeeName}</td>
                      <td>{leave.leaveTypeName}</td>
                      <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                      <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`status status-${leave.status?.toLowerCase()}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td>{leave.reason}</td>
                      <td>
                        {leave.status === 'PENDING' && (
                          <div className="action-buttons">
                            <button
                              className="btn btn-small btn-success"
                              onClick={() => handleApproveLeave(leave.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => handleRejectLeave(leave.id)}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card full-width">
            <p className="no-data">No leave requests found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
