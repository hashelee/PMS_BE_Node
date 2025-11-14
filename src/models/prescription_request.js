import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";
import prescriptionRequestEnum from "../enum/prescription_request_status_enum.js";
import orderTypeEnum from "../enum/order_type_enum.js";

const connection = mongoose.connection;
const AutoIncrement = AutoIncrementFactory(connection);

const availableMedicines = new mongoose.Schema({
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Medicine",
    required: true
  },
  quantity: { type: Number, default: 1, min: 1 }
}, { _id: false });

const prescriptionRequestSchema = new mongoose.Schema(
  {
    filepath: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
        required: true,
    },

    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pharmacy",
        required: true,
    },

    status: {
      type: Number,
      enum: prescriptionRequestEnum,
      default: prescriptionRequestEnum.PENDING,
      required: true,
    },

    notes: { type: String  },
    reason: { type: String  },
    availableMedicines: [availableMedicines],
    estimatedPrice: { type: Number, min: 0  },
    orderType: {
        type: Number,
        enum: orderTypeEnum,
        required: true,
    },
  },
  { timestamps: true, strict: true }
);

prescriptionRequestSchema.index({ location: "2dsphere" });

prescriptionRequestSchema.plugin(AutoIncrement, { inc_field: "prescriptionRequestId" });

export default mongoose.model("PrescriptionRequest", prescriptionRequestSchema);
