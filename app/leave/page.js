'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authAPI from '@/lib/authAPI';
import Navbar from '@/components/Navbar';
import '../styles/dashboard.css';

export default function ViewLeaves() {
  const router = useRouter();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      router.push('/');
      return;
    }

    loadLeaves();
  }, [router]);

  const loadLeaves = async () => {
    try {
      const companyId = authAPI.getCompanyId();
      const userId = authAPI.getUserId();

      const result = await authAPI.getUserLeaves(companyId, userId);
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
          <h1>Your Leave Applications</h1>
          <p>View and manage your leave requests</p>
        </div>

        <div className="card full-width">
          <button className="btn btn-primary" onClick={() => router.push('/leave/apply')}>
            Apply New Leave
          </button>
        </div>

        {leaves.length > 0 ? (
          <div className="card full-width">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => {
                    const days = Math.ceil(
                      (new Date(leave.endDate) - new Date(leave.startDate)) /
                        (1000 * 60 * 60 * 24)
                    ) + 1;
                    return (
                      <tr key={leave.id}>
                        <td>{leave.leaveTypeName}</td>
                        <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                        <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                        <td>{days}</td>
                        <td>
                          <span className={`status status-${leave.status?.toLowerCase()}`}>
                            {leave.status}
                          </span>
                        </td>
                        <td>{leave.reason}</td>
                        <td>{new Date(leave.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card full-width">
            <p className="no-data">No leave applications found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
