'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authAPI from '@/lib/authAPI';
import Navbar from '@/components/Navbar';
import '../../styles/dashboard.css';

export default function ManageUsers() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authAPI.isAuthenticated() || !authAPI.isAdmin()) {
      router.push('/');
      return;
    }

    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    try {
      const companyId = authAPI.getCompanyId();
      const result = await authAPI.getAllUsers(companyId);
      if (result.success) {
        setUsers(result.data);
      } else {
        setMessage('Failed to load users');
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
        {message && <div className="alert error">{message}</div>}

        <div className="welcome-section">
          <h1>Manage Users</h1>
          <p>View and manage all company employees</p>
        </div>

        <div className="card full-width">
          <button className="btn btn-primary" onClick={() => router.push('/admin')}>
            ← Back to Admin
          </button>
        </div>

        {users.length > 0 ? (
          <div className="card full-width">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name || user.email}</td>
                      <td>{user.email}</td>
                      <td>{user.department || 'N/A'}</td>
                      <td>{user.role || 'EMPLOYEE'}</td>
                      <td>
                        <span className="status status-approved">Active</span>
                      </td>
                      <td>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card full-width">
            <p className="no-data">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
