import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, 
  name: { type: String, required: true },
  phone: { type: String, required: true },
  
  location: {
    type: { type: String, enum: ["Point"], default: "Point" }, 
    coordinates: { type: [Number], required: true }, 
  },

  suggestedAddress: { type: String, required: true }
}, { timestamps: true });

userSchema.index({ location: "2dsphere" });

export default mongoose.model("User", userSchema);
