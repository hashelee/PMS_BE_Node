import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who gets notified (user)
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacy" }, // for pharmacy notifications
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" }, // related medicine
    title: { type: String, required: true },
    message: { type: String, required: true },
    role: { type: String, enum: ["user", "pharmacy"], required: true }, // who this notification is for
    read: { type: Boolean, default: false }, // unread by default
    type: { type: String, default: "info" } // optional: info, alert, etc.
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
