'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authAPI from '@/lib/authAPI';
import './styles/auth.css';

export default function AuthPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState('');
  const [otp, setOtp] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [employeeConfirmPassword, setEmployeeConfirmPassword] = useState('');

  useEffect(() => {
    // Check if already authenticated
    if (authAPI.isAuthenticated()) {
      if (authAPI.isAdmin()) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const showMessage = (msg, type = 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    if (!email) {
      showMessage('Please enter email');
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.checkEmail(email);
      if (result.success) {
        const status = result.data.status || result.data.exists;
        if (status === 'exists') {
          setCurrentStep(2); // Login
          showMessage('Email exists. Please login.', 'info');
        } else {
          setCurrentStep(3); // Register Company
          showMessage('Email available. Please create company.', 'info');
        }
      } else {
        showMessage(result.data?.message || 'Error checking email');
      }
    } catch (error) {
      showMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      showMessage('Please enter password');
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.login(email, password);
      if (result.success) {
        showMessage('Login successful!', 'success');
        setTimeout(() => {
          if (authAPI.isAdmin()) {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        }, 1000);
      } else {
        showMessage(result.data?.message || 'Login failed');
      }
    } catch (error) {
      showMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCompany = async (e) => {
    e.preventDefault();
    if (!companyName || !domain || !password || !confirmPassword) {
      showMessage('Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      showMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.registerCompany(
        email,
        companyName,
        domain,
        password
      );
      if (result.success) {
        showMessage('Company registered successfully!', 'success');
        setTimeout(() => {
          router.push('/admin');
        }, 1000);
      } else {
        showMessage(result.data?.message || 'Registration failed');
      }
    } catch (error) {
      showMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterEmployee = async (e) => {
    e.preventDefault();
    if (!otp || !employeePassword || !employeeConfirmPassword) {
      showMessage('Please fill all fields');
      return;
    }

    if (employeePassword !== employeeConfirmPassword) {
      showMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.registerEmployee(
        email,
        employeePassword,
        otp
      );
      if (result.success) {
        showMessage('Registration successful!', 'success');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        showMessage(result.data?.message || 'Registration failed');
      }
    } catch (error) {
      showMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const result = await authAPI.resendOTP(email);
      if (result.success) {
        showMessage('OTP sent to your email', 'success');
      } else {
        showMessage(result.data?.message || 'Failed to resend OTP');
      }
    } catch (error) {
      showMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Welcome</h1>
        <p>Sign in or create an account to continue</p>
      </div>

      <div className="step-indicator">
        <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
        <div className="step-line"></div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
        <div className="step-line"></div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
      </div>

      <div className="form-container">
        {message && (
          <div className={`message message-${messageType}`}>{message}</div>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Processing...</p>
          </div>
        )}

        {/* Step 1: Email Check */}
        {currentStep === 1 && (
          <form className="form-step active" onSubmit={handleCheckEmail}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="btn" disabled={loading}>
              Continue
            </button>
          </form>
        )}

        {/* Step 2: Login */}
        {currentStep === 2 && (
          <form className="form-step active" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="loginPassword">Password</label>
              <input
                type="password"
                id="loginPassword"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn" disabled={loading}>
              Sign In
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setCurrentStep(1);
                setPassword('');
              }}
            >
              Back
            </button>
          </form>
        )}

        {/* Step 3: Company Registration */}
        {currentStep === 3 && (
          <form className="form-step active" onSubmit={handleRegisterCompany}>
            <div className="form-group">
              <label htmlFor="companyName">Company Name</label>
              <input
                type="text"
                id="companyName"
                placeholder="Enter company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="domain">Domain</label>
              <input
                type="text"
                id="domain"
                placeholder="Enter company domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="registerPassword">Password</label>
              <input
                type="password"
                id="registerPassword"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn" disabled={loading}>
              Create Account
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setCurrentStep(1);
                setCompanyName('');
                setDomain('');
                setPassword('');
                setConfirmPassword('');
              }}
            >
              Back
            </button>
          </form>
        )}
      </div>

      <div className="footer">
        <p>Secure Authentication System © 2025</p>
      </div>
    </div>
  );
}
