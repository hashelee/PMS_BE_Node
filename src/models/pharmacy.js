import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const connection = mongoose.connection;
const AutoIncrement = AutoIncrementFactory(connection);

const pharmacySchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },

    role: {
      type: String,
      enum: ["pharmacy"],
      default: "pharmacy",
    },

    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },

    suggestedAddress: { type: String, required: true },

    openingDays: {
      type: [String],
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },

    openingTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    closingTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    activeStatus: { type: Boolean, default: true },

    deliveryAvailability: { type: Boolean, default: false, required: true },

    deliveryStatus: { type: Boolean, default: false },

    rating: {type: mongoose.Schema.Types.Double, default: 0.0, min: 0.0, max: 5.0},
  },
  { timestamps: true, strict: true }
);

pharmacySchema.index({ location: "2dsphere" });

pharmacySchema.plugin(AutoIncrement, { inc_field: "pharmacyId" });

export default mongoose.model("Pharmacy", pharmacySchema);
