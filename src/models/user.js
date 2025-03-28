import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";


const connection = mongoose.connection;
const AutoIncrement = AutoIncrementFactory(connection);

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, 
  },
  suggestedAddress: { type: String, required: true },
}, { timestamps: true });

userSchema.index({ location: "2dsphere" }); 

userSchema.plugin(AutoIncrement, { inc_field: "userId" });

export default mongoose.model("User", userSchema);
