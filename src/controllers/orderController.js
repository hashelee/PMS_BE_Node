import { validateUser } from "../service/commonService.js";
import Order from "../models/order.js";
import User from "../models/user.js";
import Pharmacy from "../models/pharmacy.js";
import Medicine from "../models/medicine.js";
import Notification from "../models/notification.js";
import { processCreateOrder } from "../service/orderService.js";
import { orderStatusEnum } from "../enum/order_status_enum.js";
import { sendNotificationEmail } from "../utils/notification.js";

const getPharmacyName = (order) =>
  order?.pharmacyId?.name || "Selected Pharmacy";

// 🔔 Helper to send email + save notification in DB
const notifyUserOrPharmacy = async ({ userId, pharmacyId, medicineId = null, title, message, role }) => {
  try {
    if (role === "user" && userId) {
      const user = await User.findById(userId);
      if (user?.email) {
        await sendNotificationEmail(title, message, [user.email]);
      }
    } else if (role === "pharmacy" && pharmacyId) {
      const pharmacy = await Pharmacy.findById(pharmacyId);
      if (pharmacy?.email) {
        await sendNotificationEmail(title, message, [pharmacy.email]);
      }
    }

    // Save notification in DB
    await Notification.create({
      userId,
      pharmacyId,
      medicineId,
      title,
      message,
      role,
      createdAt: new Date(),
      read: false,
    });
  } catch (err) {
    console.error("Error sending notification:", err);
  }
};


export const createOrder = async (req, res) => {
  const { userId, email, role } = req.user;
  const { pharmacyId } = req.query;
  const { items } = req.body;

  try {
    const user = await validateUser(userId, email, role);
    if (!user) return res.status(404).json({ message: "User not found" });

    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy) return res.status(404).json({ message: "Pharmacy not found" });

    const order = await processCreateOrder(user, pharmacyId, items, false);

    // Notify pharmacy
    await notifyUserOrPharmacy({
      pharmacyId,
      role: "pharmacy",
      title: "New Order Received",
      message: `A new order has been placed. Order ID: ${order.orderId}`,
    });

    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserOrders = async (req, res) => {
  const { userId, email, role } = req.user;

  try {
    const user = await validateUser(userId, email, role);
    if (!user) return res.status(404).json({ message: "User not found" });

    const orders = await Order.find({ userId: user._id })
      .populate("medicines.medicineId")
      .populate("pharmacyId", "name")
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
    if (!pharmacy) return res.status(404).json({ message: "Pharmacy not found" });

    const orders = await Order.find({ pharmacyId: pharmacy._id })
      .populate("medicines.medicineId")
      .populate("userId", "name email phone suggestedAddress")
      .sort({ createdAt: -1 });

    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching pharmacy orders:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await validateOrder(req, res);
    res.status(200).json({ order });
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ---------------- ORDER ACTIONS ----------------

export const approveOrder = async (req, res) => {
  try {
    const order = await validateOrder(req, res);

    if (order.status !== orderStatusEnum.PendingApproval)
      return res.status(400).json({ message: "Only pending orders can be approved" });

    order.status = orderStatusEnum.Approved;
    await order.populate("pharmacyId", "name");
    await order.save();

    // Notify user
    await notifyUserOrPharmacy({
      userId: order.userId,
      pharmacyId: order.pharmacyId._id,
      role: "user",
      title: "Order Approved",
      message: `Your order #${order.orderId} has been approved by ${getPharmacyName(order)}.`,
    });

    res.status(200).json({ message: "Order approved successfully", order });
  } catch (error) {
    console.error("Error approving order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const declineOrder = async (req, res) => {
  try {
    const order = await validateOrder(req, res);

    if (order.status !== orderStatusEnum.PendingApproval)
      return res.status(400).json({ message: "Only pending orders can be declined" });

    // Restore stock
    for (const medicine of order.medicines) {
      const med = await Medicine.findById(medicine.medicineId);
      if (!med) return res.status(404).json({ message: `Medicine ${medicine.medicineId} not found` });
      med.quantity += medicine.quantity;
      await med.save();
    }

    order.status = orderStatusEnum.Declined;
    await order.populate("pharmacyId", "name");
    await order.save();

    // Notify user
    await notifyUserOrPharmacy({
      userId: order.userId,
      pharmacyId: order.pharmacyId._id,
      role: "user",
      title: "Order Declined",
      message: `Your order #${order.orderId} was declined by ${getPharmacyName(order)}.`,
    });

    res.status(200).json({ message: "Order declined successfully", order });
  } catch (error) {
    console.error("Error declining order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const allocateToDelivery = async (req, res) => {
  try {
    const order = await validateOrder(req, res);

    if (order.status !== orderStatusEnum.Approved)
      return res.status(400).json({ message: "Only approved orders can be allocated to delivery" });

    order.status = orderStatusEnum.AllottedToDelivery;
    await order.populate("pharmacyId", "name");
    await order.save();

    const orderTypeText = order.orderType === 0 ? "ready for pickup" : "out for delivery";

    await notifyUserOrPharmacy({
      userId: order.userId,
      pharmacyId: order.pharmacyId._id,
      role: "user",
      title: `Order ${orderTypeText.charAt(0).toUpperCase() + orderTypeText.slice(1)}`,
      message: `Your order #${order.orderId} from ${getPharmacyName(order)} is now ${orderTypeText}.`,
    });

    res.status(200).json({ message: "Order allocated to delivery successfully", order });
  } catch (error) {
    console.error("Error allocating order to delivery:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const completeOrder = async (req, res) => {
  try {
    const order = await validateOrder(req, res);

    if (![orderStatusEnum.AllottedToDelivery, orderStatusEnum.Approved].includes(order.status))
      return res.status(400).json({ message: "Only orders in Approved or AllottedToDelivery status can be completed" });

    order.status = orderStatusEnum.Completed;
    await order.populate("pharmacyId", "name");
    await order.save();

    // Notify user
    await notifyUserOrPharmacy({
      userId: order.userId,
      pharmacyId: order.pharmacyId._id,
      role: "user",
      title: "Order Delivered",
      message: `Your order #${order.orderId} from ${getPharmacyName(order)} has been successfully delivered.`,
    });

    res.status(200).json({ message: "Order completed successfully", order });
  } catch (error) {
    console.error("Error completing order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ---------------- HELPER ----------------
const validateOrder = async (req, res) => {
  const { userId, email, role } = req.user;
  const { orderId } = req.params;

  try {
    const pharmacy = await validateUser(userId, email, role);
    if (!pharmacy) return res.status(404).json({ message: "Pharmacy not found" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.pharmacyId.toString() !== pharmacy._id.toString()) {
      return res.status(403).json({ message: "You are not authorized for this action" });
    }

    return order;
  } catch (error) {
    console.error("Error validating order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
