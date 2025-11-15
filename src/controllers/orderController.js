import { validateUser } from "../service/commonService";
import Order from "../models/order.js";
import { processCreateOrder } from "../service/orderService.js";

export const createOrder = async (req, res) => {
  const { userId, email, role } = req.user;
  const items = req.body;
  try {
    const user = await validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const order = await processCreateOrder(user, items, false);

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
    const orders = await Order.find({ userId: user._id })
      .populate("medicines.medicine")
      .sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
