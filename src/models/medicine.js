import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const connection = mongoose.connection;
const AutoIncrement = AutoIncrementFactory(connection);

const medicineSchema = new mongoose.Schema({
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pharmacy",
    required: true,
  },
  identificationCode: { type: String, required: true },
  name: { type: String, required: true },
  brand: { type: String, required: false },
  description: { type: String, required: false },

  price: { type: Number, required: true, min: 0 },

  quantity: { type: Number, required: true, min: 0 },
  onHoldQuantity: { type: Number, required: false, min: 0, default: 0 },

  dosage: { type: String, required: true },

  category: {
    type: String,
    enum: [
      "Tablet",
      "Syrup",
      "Capsule",
      "Injection",
      "Ointment",
      "Cream",
      "Gel",
      "Lotion",
      "Drops",
      "Inhaler",
      "Patch",
      "Powder",
      "Solution",
      "Suspension",
      "Elixir",
      "Suppository",
      "Spray",
      "Lozenge",
      "Nebulizer Solution",
      "Chewable Tablet",
      "Oral Film",
      "Other",
    ],
    default: "Other",
  },

  expiryDate: { type: Date, required: true },

  prescriptionRequired: { type: Boolean, required: true, default: false },
});

medicineSchema.index({ pharmacyId: 1 });
medicineSchema.plugin(AutoIncrement, { inc_field: "medicineId" });

export default mongoose.model("Medicine", medicineSchema);
