import Order from "../models/order.js";
import Medicine from "../models/medicine.js";
import { orderStatusEnum } from "../enum/order_status_enum.js";

const processCreateOrder = async (
  user,
  pharmacyId,
  items,
  isPrescriptionRequest
) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error("Item list cannot be empty");
  }

  const validationPromises = items.map(async (item) => {
    if (!item.medicineId || !item.quantity || item.quantity < 1) {
      throw new Error(
        "Each item must have a valid medicine ID and quantity greater than 0"
      );
    }

    const medicine = await Medicine.findById(item.medicineId);
    if (!medicine) {
      throw new Error(`Medicine with ID ${item.medicineId} does not exist`);
    }

    if (medicine.pharmacyId.toString() !== pharmacyId.toString()) {
      throw new Error(
        `Medicine with ID ${item.medicineId} does not belong to the specified pharmacy`
      );
    }

    if (
      isPrescriptionRequest == true &&
      medicine.onHoldQuantity >= item.quantity
    ) {
      medicine.onHoldQuantity -= item.quantity;
    } else if (medicine.quantity >= item.quantity) {
      medicine.quantity -= item.quantity;
    } else {
      throw new Error(`Insufficient stock for medicine ID ${item.medicineId}`);
    }
    await medicine.save();

    if (Array.isArray(user.cart)) {
      const cartItemIndex = user.cart.findIndex(
        (cartItem) =>
          cartItem.medicineId.toString() === item.medicineId.toString()
      );

      if (cartItemIndex !== -1) {
        if (user.cart[cartItemIndex].quantity > item.quantity) {
          user.cart[cartItemIndex].quantity -= item.quantity;
        } else if (user.cart[cartItemIndex].quantity === item.quantity) {
          user.cart.splice(cartItemIndex, 1); // Remove the item from the cart
        }
      }
    }
  });

  await Promise.all(validationPromises);

  // Save user cart once after all items are processed
  if (user.cart) {
    await user.save();
  }

  const newOrder = {
    userId: user._id,
    pharmacyId: pharmacyId,
    medicines: items,
    status: orderStatusEnum.PendingApproval,
  };

  const order = await Order.create(newOrder);
  const orderWithDetails = await order.populate("medicines.medicineId");
  return orderWithDetails;
};
export { processCreateOrder };
