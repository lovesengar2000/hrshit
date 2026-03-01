'use client';

import Link from 'next/link';

export default function Navbar({ onLogout }) {

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>HR Dashboard</h2>
        </div>
        <div className="nav-menu">
          <Link href="/dashboard" className="nav-link">Dashboard</Link>
          <Link href="/leave/apply" className="nav-link">Apply Leave</Link>
          <Link href="/attendance" className="nav-link">Attendance</Link>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => {
              onLogout();
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
