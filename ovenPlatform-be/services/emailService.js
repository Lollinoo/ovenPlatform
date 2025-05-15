import { Resend } from "resend";
import config from "../config.js";

/**
 * Email Service for sending transactional emails
 * Uses Resend for email delivery
 */
class EmailService {
  constructor() {
    this.resend = new Resend(config.email.resendApiKey);
    this.sender = config.email.senderEmail;
    this.senderName = config.email.senderName;
  }

  /**
   * Send an email using Resend
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - Email HTML content
   * @param {string} options.text - Email plaintext content
   */
  async sendEmail(options) {
    try {
      const response = await this.resend.emails.send({
        from: `${this.senderName} <${this.sender}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log("Email sent:", response);
      if (response.error) {
        throw new Error(`Failed to send email: ${response.error.message}`);
      }

      console.log(
        `Email sent successfully to ${options.to} with ID: ${response.data.id}`
      );
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }
  }

  /**
   * Send a verification email to the user
   * @param {string} email - User's email address
   * @param {string} token - Verification token
   */
  async sendVerificationEmail(email, token) {
    const baseUrl = config.app.frontendUrl;
    const verificationUrl = `${baseUrl}/verify-email/${token}`;

    const html = `
      <h1>Email Verification</h1>
      <p>Thank you for registering with OvenPlatform!</p>
      <p>Please click the button below to verify your email address:</p>
      <a href="${verificationUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>If you did not create an account, please ignore this email.</p>
      <p>This link will expire in 24 hours.</p>
    `;

    const text = `
      Email Verification
      
      Thank you for registering with OvenPlatform!
      
      Please visit the following link to verify your email address:
      ${verificationUrl}
      
      If you did not create an account, please ignore this email.
      
      This link will expire in 24 hours.
    `;

    await this.sendEmail({
      to: email,
      subject: "Verify Your Email Address",
      html,
      text,
    });
  }

  /**
   * Send a password reset email to the user
   * @param {string} email - User's email address
   * @param {string} token - Password reset token
   */
  async sendPasswordResetEmail(email, token) {
    const baseUrl = config.app.frontendUrl;
    const resetUrl = `${baseUrl}/reset-password/${token}`;

    const html = `
      <h1>Password Reset</h1>
      <p>You requested a password reset for your OvenPlatform account.</p>
      <p>Please click the button below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
      <p>This link will expire in 1 hour.</p>
    `;

    const text = `
      Password Reset
      
      You requested a password reset for your OvenPlatform account.
      
      Please visit the following link to reset your password:
      ${resetUrl}
      
      If you did not request a password reset, please ignore this email and your password will remain unchanged.
      
      This link will expire in 1 hour.
    `;

    await this.sendEmail({
      to: email,
      subject: "Reset Your Password",
      html,
      text,
    });
  }
}

const emailService = new EmailService();

// Export the specific methods for ease of use
export const sendVerificationEmail = (email, token) =>
  emailService.sendVerificationEmail(email, token);
export const sendPasswordResetEmail = (email, token) =>
  emailService.sendPasswordResetEmail(email, token);
