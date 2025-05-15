# User Authentication System

This document provides an overview of the user authentication system implemented in OvenPlatform.

## Features

- User registration with email verification
- Secure login with JWT tokens stored in HTTP-only cookies
- Password reset functionality
- Account verification via email

## API Endpoints

All authentication routes are prefixed with `/v1/auth`:

| Endpoint | Method | Description | Request Body | Success Response |
|----------|--------|-------------|--------------|------------------|
| `/signup` | POST | Register a new user | `{ email, password, name }` | `{ success: true, message: "User registered..." }` |
| `/login` | POST | Log in a user | `{ email, password }` | `{ success: true, message: "Login successful", user: {...} }` |
| `/logout` | POST | Log out a user | None | `{ success: true, message: "Logout successful" }` |
| `/verify-email` | POST | Verify user email | `{ token }` | `{ success: true, message: "Email verified..." }` |
| `/forgot-password` | POST | Request password reset | `{ email }` | `{ success: true, message: "If a user..." }` |
| `/reset-password/:token` | POST | Reset password | `{ password }` | `{ success: true, message: "Password has been reset..." }` |

## Security Measures

1. **Password Storage**: Passwords are hashed using bcryptjs with a salt round of 10.
2. **JWT Authentication**: Authentication tokens are stored in HTTP-only cookies.
3. **Token Expiration**: All tokens (JWT, verification, password reset) have expiration times.
4. **CSRF Protection**: HTTP-only cookies with SameSite policy help protect against CSRF attacks.
5. **Email Verification**: Users must verify their email before they can log in.
6. **Protected Routes**: All stream management routes under `/v1/ome/streams` require authentication.

## MongoDB Schema

The user schema includes:

- Email (unique identifier)
- Hashed password
- Name
- Last login timestamp
- Verification status
- Password reset tokens and expiration
- Email verification tokens and expiration

## Usage Example

### Registration
```javascript
const response = await fetch('/v1/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'securePassword123'
  })
});
```

### Login
```javascript
const response = await fetch('/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'securePassword123'
  })
};
```

## Implementation Details

- Authentication state is maintained via HTTP-only cookies
- Cookies are configured with:
  - `httpOnly: true` (not accessible by JavaScript)
  - `secure: true` (in production, requires HTTPS)
  - `sameSite: 'strict'` (prevents CSRF)
- Frontend must include `credentials: 'include'` in fetch/axios requests

## Protected Routes

All routes under `/v1/ome/streams` are protected and require authentication:

| Endpoint | Method | Description | Authentication Required |
|----------|--------|-------------|------------------------|
| `/v1/ome/streams` | GET | Get streams with stats | Yes |
| `/v1/ome/streams/active` | GET | Fetch all active streams | Yes |
| `/v1/ome/streams/:streamName/stats` | GET | Get specific stream info | Yes |
| `/v1/ome/streams/generate-signed-url` | POST | Generate signed URL for streaming | Yes |
| `/v1/ome/streams/:streamName/thumb.jpg` | GET | Get stream thumbnail | Yes |

To access these routes, the client must:
1. Successfully authenticate via `/v1/auth/login`
2. Include credentials in all requests to protected routes
3. Handle 401 responses appropriately (redirect to login)
