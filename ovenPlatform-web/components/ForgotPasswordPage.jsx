import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const { forgotPassword, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!email) {
      setMessage({ type: 'error', text: 'Please provide your email address.' });
      return;
    }

    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Password reset instructions have been sent to your email.' 
        });
        setEmail(''); // Clear the form
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to request password reset. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>Reset Password</h1>
        <p>Enter your email to receive password reset instructions</p>
      </div>

      {message.text && (
        <div className={`auth-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="auth-alt-action">
        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
