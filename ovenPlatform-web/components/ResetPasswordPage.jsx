import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [validToken, setValidToken] = useState(true);
  const { token } = useParams();
  const { resetPassword, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Basic token validation (can be extended)
    if (!token || token.length < 10) {
      setValidToken(false);
      setMessage({ 
        type: 'error', 
        text: 'Invalid or expired reset token. Please request a new password reset link.' 
      });
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Basic validation
    if (!password) {
      setMessage({ type: 'error', text: 'Please enter a new password.' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    try {
      const result = await resetPassword(token, password);
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Your password has been reset successfully! Redirecting to login...' 
        });
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to reset password. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    }
  };

  if (!validToken) {
    return (
      <div className="auth-container">
        <div className="auth-header">
          <h1>Invalid Token</h1>
        </div>
        <div className="auth-message error">
          {message.text}
        </div>
        <div className="auth-alt-action">
          <Link to="/forgot-password">Request a new password reset</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>Create New Password</h1>
        <p>Enter a new password for your account</p>
      </div>

      {message.text && (
        <div className={`auth-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="password">New Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? 'Resetting Password...' : 'Reset Password'}
        </button>
      </form>

      <div className="auth-alt-action">
        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
