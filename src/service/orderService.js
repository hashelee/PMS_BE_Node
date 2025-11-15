import Order from "../models/order.js";
import Medicine from "../models/medicine.js";
import { orderStatusEnum } from "../enum/order_status_enum.js";

const processCreateOrder = async (user, items,isPrescriptionRequest) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error("Item list cannot be empty");
  }

  const validationPromises = items.map(async (item) => {
    if (!item.medicineId || !item.quantity || item.quantity < 1) {
      throw new Error(
        "Each item must have a valid medicine ID and quantity greater than 0"
      );
    }

    const medicineExists = await Medicine.findById(item.medicineId);
    if (!medicineExists) {
      throw new Error(`Medicine with ID ${item.medicineId} does not exist`);
    }
    if(isPrescriptionRequest == true && medicineExists.onHoldQuantity >= medicineExists.quantity){
      medicineExists.onHoldQuantity -= item.quantity;
    }
    else if (medicineExists.quantity >= item.quantity) {
      medicineExists.quantity -= item.quantity;
    } else {
      throw new Error(
        `Insufficient stock for medicine ID ${item.medicineId}`
      );
    }
    await medicineExists.save();
  });

  await Promise.all(validationPromises);

  const newOrder = {
    userId: user._id,
    medicines: items,
    status: orderStatusEnum.PendingApproval,
  };

  const order = await Order.create(newOrder);
  return order;
};
export { processCreateOrder };