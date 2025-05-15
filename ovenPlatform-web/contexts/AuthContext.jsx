import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../utils/authService";

// Create the context
const AuthContext = createContext();

// Hook for using the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const userData = await authService.getCurrentUser();
        setCurrentUser(userData);
      } catch (err) {
        console.error("Failed to load user:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError("");
      const response = await authService.login({ email, password });

      if (!response.success) {
        throw new Error(response.message || "Login failed");
      }

      setCurrentUser(response.user);
      return { success: true };
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      setLoading(true);
      setError("");
      const response = await authService.register({
        username,
        email,
        password,
      });

      if (!response.success) {
        throw new Error(response.message || "Registration failed");
      }

      return { success: true, message: response.message };
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setCurrentUser(null);
      navigate("/login");
      return { success: true };
    } catch (err) {
      setError("Logout failed. Please try again.");
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      setError("");
      const response = await authService.forgotPassword(email);

      if (!response.success) {
        throw new Error(response.message || "Password reset request failed");
      }

      return { success: true, message: response.message };
    } catch (err) {
      setError(
        err.message || "Password reset request failed. Please try again."
      );
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (token, password) => {
    try {
      setLoading(true);
      setError("");
      const response = await authService.resetPassword(token, password);

      if (!response.success) {
        throw new Error(response.message || "Password reset failed");
      }

      return { success: true, message: response.message };
    } catch (err) {
      setError(err.message || "Password reset failed. Please try again.");
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Verify email function
  const verifyEmail = async (token) => {
    try {
      setLoading(true);
      setError("");
      const response = await authService.verifyEmail(token);

      if (!response.success) {
        throw new Error(response.message || "Email verification failed");
      }

      return { success: true, message: response.message };
    } catch (err) {
      setError(err.message || "Email verification failed. Please try again.");
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
