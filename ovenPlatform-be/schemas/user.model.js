import mongoose from "mongoose";

/**
 * Email validation regex pattern
 * This pattern validates email addresses according to RFC 5322 standards
 */
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Password validation regex pattern
 * Requires at least:
 * - 8 characters
 * - 1 uppercase letter
 * - 1 lowercase letter
 * - 1 number
 * - 1 special character
 */
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&])[A-Za-z\d!@#$%&]{8,}$/;

/**
 * Username validation regex pattern
 * Allows only alphanumeric characters and underscores
 * Must be between 3 and 30 characters
 */
const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: [true, 'Email address is required'],
			unique: true,
			lowercase: true,
			trim: true,
			validate: {
				validator: function(v) {
					return emailRegex.test(v);
				},
				message: props => `${props.value} is not a valid email address`
			}
		},
		password: {
			type: String,
			required: [true, 'Password is required'],
			// Note: Password validation happens before hashing in the controller
		},
		username: {
			type: String,
			required: [true, 'Username is required'],
			unique: true,
			trim: true,
			validate: {
				validator: function(v) {
					return usernameRegex.test(v);
				},
				message: props => `${props.value} is not a valid username. Use 3-30 alphanumeric characters and underscores only.`
			}
		},
		lastLogin: {
			type: Date,
			default: Date.now,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		resetPasswordToken: String,
		resetPasswordExpiresAt: Date,
		verificationToken: String,
		verificationTokenExpiresAt: Date,
	},
	{ timestamps: true }
);

export const User = mongoose.model("User", userSchema);