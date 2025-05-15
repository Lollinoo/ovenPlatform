# Email Service

This document provides an overview of the email service implementation for OvenPlatform.

## Overview

The email service is responsible for sending transactional emails within the OvenPlatform application, including:

- User registration verification emails
- Password reset emails
- System notifications (future implementation)

## Implementation

The service uses [Resend](https://resend.com) as the email delivery provider, which offers:

- High deliverability
- Email analytics
- Custom domains
- Simple API

## Configuration

The email service requires the following environment variables:

```
RESEND_API_KEY=your_resend_api_key
EMAIL_SENDER=noreply@yourdomain.com
EMAIL_SENDER_NAME=OvenPlatform
```

## Key Files

- `services/emailService.js`: The main service implementation
- `config.js`: Configuration settings for the email service
- `controllers/userAuthController.js`: Controller that uses the email service

## Email Templates

The service includes HTML and plain text templates for:

1. **Email Verification**
   - Sent when a new user registers
   - Contains a verification link that expires after 24 hours

2. **Password Reset**
   - Sent when a user requests a password reset
   - Contains a reset link that expires after 1 hour

## Testing

For testing purposes, you can:

1. Register a new user account to receive a verification email
2. Request a password reset to receive a password reset email

## Production Setup

For production environments:

1. Verify your domain in Resend's dashboard
2. Update the `EMAIL_SENDER` to use your verified domain
3. Consider customizing the email templates with your branding
4. Monitor email analytics in the Resend dashboard

## Troubleshooting

Common issues:

- **Emails not being sent**: Check the server logs for detailed error messages from the email service
- **Emails being marked as spam**: Ensure you've set up domain verification in Resend
- **Template rendering issues**: Check for missing or undefined template variables

## Future Improvements

Planned enhancements:

- Email templates stored as separate files
- Localization support for emails in multiple languages
- Email queue for handling large volumes of emails
- Email click tracking for security purposes
