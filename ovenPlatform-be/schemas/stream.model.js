import mongoose from "mongoose";

const streamSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      index: true,
    },
    rtmpUrl: {
      type: String,
      required: [true, "RTMP URL is required"],
      unique: true,
    },
    rtmpUrlExpiresAt: {
      type: Date,
      required: [true, "RTMP URL expiration is required"],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    lastStreamStartedAt: {
      type: Date,
      default: null,
    },
    lastStreamEndedAt: {
      type: Date,
      default: null,
    },
    streamSessionId: {
      type: String,
      default: null,
    },
    streamKey: {
      type: String,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Campi statistici
    viewers: {
      type: Number,
      default: 0,
    },
    videoBitrate: {
      type: Number,
      default: 0,
    },
    videoResolution: {
      type: String,
      default: null,
    },
    lastUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

streamSchema.index({ username: 1, isActive: 1 });

export const Stream = mongoose.model("Stream", streamSchema);
