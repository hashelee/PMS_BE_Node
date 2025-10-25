import { validateUser } from "../service/commonService";
import Order from "../models/order.js";

export const createOrder = async (req, res) => {
  const { userId, email, role } = req.user;
  const items = req.body;
  try {
    const user = await validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Item list cannot be empty" });
    }
    for (const item of items) {
        if (!item.medicine || !item.quantity || item.quantity < 1) {
            return res.status(400).json({ message: "Each item must have a valid medicine ID and quantity greater than 0" });
        }

        const medicineExists = await Medicine.findById(item.medicine);
        if (!medicineExists) {
            return res.status(400).json({ message: `Medicine with ID ${item.medicine} does not exist` });
        }
    }
    const newOrder = {
      userId: user._id,
      medicines: items,
      status: OrderStatusEnum.PendingApproval,
    };

    const order = await Order.create(newOrder);

    res
      .status(201)
      .json({ message: "Order created successfully", order: order });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserOrders = async (req, res) => {
  const { userId, email, role } = req.user;
    try {
        const user = await validateUser(userId, email, role);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const orders = await Order.find({ userId: user._id }).populate('medicines.medicine').sort({ createdAt: -1 });
        res.status(200).json({ orders });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

ex
