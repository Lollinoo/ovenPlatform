# Authentication System Setup Guide

This guide provides instructions for setting up and configuring the user authentication system for OvenPlatform.

## Prerequisites

- MongoDB server running (local or remote)
- Node.js (v16 or higher recommended)
- npm or yarn package manager

## Environment Variables

Make sure to set the following environment variables in your `.env` or `.env.development` file:

```plaintext
# MongoDB Database Configuration
MONGODB_URI=mongodb://localhost:27017/ovenplatform

# JWT Authentication
JWT_SECRET=your-secure-secret-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Email Configuration (Resend.com)
RESEND_API_KEY=your-resend-api-key
EMAIL_SENDER=noreply@ovenplatform.com
EMAIL_SENDER_NAME=OvenPlatform Team

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3001
```

## Setting Up Resend for Email Delivery

1. Sign up for an account at [Resend.com](https://resend.com)
2. Create a new API key from the dashboard
3. Copy the API key and set it as the `RESEND_API_KEY` in your environment variables
4. For production, make sure to verify your domain in Resend for better email deliverability

### Configuring a Domain for Production (Optional)

For production environments, you'll want to configure a custom domain for better email deliverability:

1. Go to the Resend dashboard and navigate to "Domains"
2. Click "Add Domain" and follow the instructions to add your domain
3. Set up the required DNS records as instructed by Resend
4. Once verified, update your `EMAIL_SENDER` in the environment variables to use an email address from your verified domain

### Testing Email Delivery

To test if your email configuration is working correctly:

1. Register a new user account through the `/v1/auth/signup` endpoint
2. Check if the verification email was sent successfully (check the logs for any errors)
3. Use the verification link to verify the account
4. Test the password reset functionality by using the `/v1/auth/forgot-password` endpoint

## Authentication Routes

The following routes are available for user authentication:

### 1. User Registration

```
POST /v1/auth/signup
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

### 2. User Login

```
POST /v1/auth/login
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

This route sets an HTTP-only cookie containing the JWT token.

### 3. User Logout

```
POST /v1/auth/logout
```

No request body needed. This route clears the authentication cookie.

### 4. Email Verification

```
POST /v1/auth/verify-email
```

Request body:
```json
{
  "token": "verification-token-from-email"
}
```

### 5. Password Recovery Request

```
POST /v1/auth/forgot-password
```

Request body:
```json
{
  "email": "user@example.com"
}
```

### 6. Password Reset

```
POST /v1/auth/reset-password/:token
```

Request body:
```json
{
  "password": "newSecurePassword123"
}
```

## Protecting Routes with Authentication

To protect a route and require authentication, use the `authenticate` middleware:

```javascript
import { authenticate } from '../middleware/authMiddleware.js';
import express from 'express';

const router = express.Router();

// Public route - no authentication required
router.get('/public', (req, res) => {
  res.json({ message: 'This is a public endpoint' });
});

// Protected route - requires authentication
router.get('/protected', authenticate, (req, res) => {
  // The authenticated user is available as req.user
  res.json({ 
    message: 'This is a protected endpoint',
    user: req.user
  });
});

export default router;
```

## Frontend Integration

When making requests to authenticated endpoints from the frontend, remember to include credentials:

```javascript
// Using fetch API
fetch('/v1/auth/protected-endpoint', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Using axios
axios.get('/v1/auth/protected-endpoint', {
  withCredentials: true
})
```

## Security Considerations

- The JWT secret key should be long, random, and kept secure
- In production, ensure HTTPS is enabled for secure cookie transmission
- Review the cookie settings in userAuthController.js if deploying to production
- Consider adding rate limiting for authentication routes to prevent brute force attacks
