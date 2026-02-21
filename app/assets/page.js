'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authAPI from '@/lib/authAPI';
import Navbar from '@/components/Navbar';
import '../styles/dashboard.css';

export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      router.push('/');
      return;
    }

    loadAssets();
  }, [router]);

  const loadAssets = async () => {
    try {
      const companyId = authAPI.getCompanyId();
      const userId = authAPI.getUserId();
      
      // This is a placeholder - integrate with your actual assets API
      // const result = await authAPI.getUserAssets(companyId, userId);
      setAssets([
        {
          id: 1,
          name: 'Laptop',
          type: 'Electronics',
          serialNumber: 'DELL-001',
          issuedDate: new Date().toISOString(),
          status: 'Active',
        },
        {
          id: 2,
          name: 'Monitor',
          type: 'Electronics',
          serialNumber: 'LG-002',
          issuedDate: new Date().toISOString(),
          status: 'Active',
        },
      ]);
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
          <h1>Company Assets</h1>
          <p>Your assigned company assets</p>
        </div>

        {assets.length > 0 ? (
          <div className="card full-width">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Asset Name</th>
                    <th>Type</th>
                    <th>Serial Number</th>
                    <th>Issued Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id}>
                      <td>{asset.name}</td>
                      <td>{asset.type}</td>
                      <td>{asset.serialNumber}</td>
                      <td>{new Date(asset.issuedDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`status status-${asset.status?.toLowerCase()}`}>
                          {asset.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card full-width">
            <p className="no-data">No assets assigned to you.</p>
          </div>
        )}
      </div>
    </div>
  );
}
