import { validateUser } from "../service/commonService.js";
import Order from "../models/order.js";
import { processCreateOrder } from "../service/orderService.js";
import Pharmacy from "../models/pharmacy.js";

export const createOrder = async (req, res) => {
  const { userId, email, role } = req.user;
  const {pharmacyId} = req.query;
  const {items} = req.body;
  try {
    const user = await validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    const order = await processCreateOrder(user,pharmacyId, items, false);

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
      .populate("medicines.medicineId")
      .sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getPharmacyOrders = async (req, res) => {
  const { userId, email, role } = req.user;
  try {
    const pharmacy = await validateUser(userId, email, role);
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }
    const orders = await Order.find({ pharmacyId: pharmacy._id })
      .populate("medicines.medicineId")
      .sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching pharmacy orders:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
