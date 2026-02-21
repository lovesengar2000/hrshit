'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authAPI from '@/lib/authAPI';
import Navbar from '@/components/Navbar';
import '../../styles/dashboard.css';

export default function ApplyLeave() {
  const router = useRouter();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [totalDays, setTotalDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      router.push('/');
      return;
    }

    loadLeaveData();
  }, [router]);

  const loadLeaveData = async () => {
    try {
      const companyId = authAPI.getCompanyId();
      const userId = authAPI.getUserId();

      // Load leave types
      const typesData = await authAPI.getLeaveTypes(companyId);
      if (typesData.success) {
        setLeaveTypes(typesData.data);
      }

      // Load leave balance
      const balanceData = await authAPI.getLeaveBalance(companyId, userId);
      if (balanceData.success) {
        setLeaveBalance(balanceData.data);
      }
    } catch (error) {
      console.error('Error loading leave data:', error);
      setMessage('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(0, days);
  };

  const handleDateChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    if (newData.startDate && newData.endDate) {
      setTotalDays(calculateDays(newData.startDate, newData.endDate));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      setMessage('Please fill all fields');
      return;
    }

    setSubmitting(true);
    try {
      const companyId = authAPI.getCompanyId();
      const result = await authAPI.applyLeave({
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        companyId,
      });

      if (result.success) {
        setMessage('Leave applied successfully');
        setTimeout(() => {
          router.push('/leave');
        }, 1500);
      } else {
        setMessage(result.data?.message || 'Failed to apply leave');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setSubmitting(false);
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
          <h1>Apply for Leave</h1>
          <p>Submit your leave application for approval</p>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="card full-width">
            <div className="form-group">
              <label htmlFor="leaveType">Leave Type *</label>
              <select
                id="leaveType"
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                required
              >
                <option value="">Select Leave Type</option>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.maxDaysPerYear} days/year)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">End Date *</label>
              <input
                type="date"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Total Days: <strong>{totalDays}</strong></label>
            </div>

            <div className="form-group">
              <label htmlFor="reason">Reason for Leave *</label>
              <textarea
                id="reason"
                rows="4"
                placeholder="Please provide a reason for your leave..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
              ></textarea>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Leave Application'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.push('/leave')}
              >
                Cancel
              </button>
            </div>
          </form>

          {Object.keys(leaveBalance).length > 0 && (
            <div className="card full-width">
              <h3>Your Leave Balance</h3>
              <div className="leave-balance-cards">
                {Object.entries(leaveBalance).map(([type, balance]) => (
                  <div key={type} className="balance-card">
                    <h4>{type}</h4>
                    <div className="balance-details">
                      <p>Total: <strong>{balance.total}</strong></p>
                      <p>Used: <strong>{balance.used}</strong></p>
                      <p>Remaining: <strong>{balance.remaining}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
