import mongoose from "mongoose";
import { orderStatusEnum } from "../enum/order_status_enum.js";
import AutoIncrementFactory from "mongoose-sequence";

const connection = mongoose.connection;
// const AutoIncrement = AutoIncrementFactory(connection);

const AutoIncrement = AutoIncrementFactory(connection);

// orderSchema defines the structure for Order documents, including references to Medicine and order status.
const orderSchema = mongoose.Schema({
    medicines: [{
        medicineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Medicine",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    status: {
        type: Number,
        enum: orderStatusEnum,
        default: orderStatusEnum.PendingApproval,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true, strict: true });

orderSchema.index({ medicineId: 1 });
orderSchema.plugin(AutoIncrement, { inc_field: "orderId" });

export default mongoose.model("Order", orderSchema);