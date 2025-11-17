import Pharmacy from "../models/pharmacy.js";
import Medicine from "../models/medicine.js";
import PrescriptionRequest from "../models/prescription_request.js";
import { validateUser } from "../service/commonService.js";
import prescriptionRequestEnum from "../enum/prescription_request_status_enum.js";
import { processCreateOrder } from "../service/orderService.js";
import { orderStatusEnum } from "../enum/order_status_enum.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";
import { sendNotificationEmail } from "../utils/notification.js";

// 🔔 Helper to send email + save notification
const notifyUserOrPharmacy = async ({
  userId,
  pharmacyId,
  title,
  message,
  role,
}) => {
  try {
    if (role === "user" && userId) {
      const user = await User.findById(userId);
      if (user?.email)
        await sendNotificationEmail(title, message, [user.email]);
    } else if (role === "pharmacy" && pharmacyId) {
      const pharmacy = await Pharmacy.findById(pharmacyId);
      if (pharmacy?.email)
        await sendNotificationEmail(title, message, [pharmacy.email]);
    }

    // Save in DB
    await Notification.create({
      userId,
      pharmacyId,
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

export const createPrescriptionRequest = async (req, res) => {
  const { userId, email, role } = req.user;
  const { filepath, notes, orderType } = req.body;
  const { pharmacyId } = req.query;

  try {
    const user = await validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    const newRequest = new PrescriptionRequest({
      userId,
      pharmacyId,
      filepath,
      notes,
      orderType,
    });

    await newRequest.save();

    await notifyUserOrPharmacy({
      pharmacyId,
      role: "pharmacy",
      title: "New Prescription Request",
      message: `A new prescription request has been submitted by ${user.name}.`,
    });

    return res.status(201).json(newRequest);
  } catch (error) {
    console.error("Create Prescription Request Error:", error);
    return res
      .status(500)
      .json({ message: "Error creating prescription request" });
  }
};

export const getPrescriptionRequestById = async (req, res) => {
  const { requestId } = req.params;

  try {
    const request = await PrescriptionRequest.findById(requestId)
      .populate("userId", "name email phone suggestedAddress")
      .populate("pharmacyId", "-password");
    if (!request) {
      return res
        .status(404)
        .json({ message: "Prescription request not found" });
    }
    return res.status(200).json(request);
  } catch (error) {
    console.error("Get Prescription Request Error:", error);
    return res
      .status(500)
      .json({ message: "Error fetching prescription request" });
  }
};

export const approveRequesByPharmacy = async (req, res) => {
  const { userId, email, role } = req.user;
  const { requestId } = req.params;
  const { medicines, estimatedPrice } = req.body;

  try {
    const user = await validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const request = await PrescriptionRequest.findById(requestId);
    if (!request) {
      return res
        .status(404)
        .json({ message: "Prescription request not found" });
    }

    if (request.status !== prescriptionRequestEnum.PENDING) {
      return res.status(409).json({
        message: "Request should be in PENDING status to be approved",
      });
    }

    // Validate medicines array
    if (medicines && Array.isArray(medicines)) {
      const isValid = medicines.every(
        (medicine) =>
          medicine &&
          typeof medicine.medicineId === "string" &&
          typeof medicine.quantity === "number" &&
          Object.keys(medicine).length === 2
      );

      if (!isValid) {
        return res.status(400).json({
          message:
            "Invalid medicines format. Each medicine must have only 'medicineId' (string) and 'quantity' (number).",
        });
      }

      for (const med of medicines) {
        const medicine = await Medicine.findById(med.medicineId);
        if (!medicine) {
          return res.status(400).json({
            message: `Medicine with ID ${med.medicineId} does not exist.`,
          });
        }
        medicine.quantity -= med.quantity;
        if (medicine.quantity < 0) {
          return res.status(400).json({
            message: `Insufficient stock for medicine ID ${med.medicineId}.`,
          });
        }
        medicine.onHoldQuantity += med.quantity;
        await medicine.save();
      }
      await notifyUserOrPharmacy({
        userId: request.userId,
        pharmacyId: request.pharmacyId,
        role: "user",
        title: `Prescription Request Approved #${request.prescriptionRequestId}`,
        message: `Your prescription request has been approved by pharmacy.`,
      });
      request.availableMedicines = medicines;
      request.estimatedPrice = estimatedPrice;
    }

    request.status = prescriptionRequestEnum.PHARMACY_APPROVED;
    await request.save();
    return res.status(200).json(request);
  } catch (error) {
    console.error("Approve Prescription Request Error:", error);
    return res
      .status(500)
      .json({ message: "Error approving prescription request" });
  }
};

export const approveRequestByUser = async (req, res) => {
  const { userId, email, role } = req.user;
  const { requestId } = req.params;

  try {
    const user = await validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const request = await PrescriptionRequest.findById(requestId);
    if (!request) {
      return res
        .status(404)
        .json({ message: "Prescription request not found" });
    }

    if (request.status !== prescriptionRequestEnum.PHARMACY_APPROVED) {
      return res.status(409).json({
        message:
          "Request should be in PHARMACY_APPROVED status to be approved by user",
      });
    }

    const medicines = request.availableMedicines;

    const order = await processCreateOrder(
      user,
      request.pharmacyId,
      medicines,
      true
    );
    order.status = orderStatusEnum.Approved;
    order.save();

    await notifyUserOrPharmacy({
      pharmacyId: request.pharmacyId,
      userId: request.userId,
      role: "pharmacy",
      title: "Prescription Request Confirmed by User",
      message: `The user has approved the prescription request. Order #${order.orderId} created.`,
    });

    request.status = prescriptionRequestEnum.USER_APPROVED;
    await request.save();

    return res.status(200).json({
      message: "order created successfully",
      request: request,
      order: order,
    });
  } catch (error) {
    console.error("Approve Prescription Request by User Error:", error);
    return res
      .status(500)
      .json({ message: "Error approving prescription request by user" });
  }
};

export const declineRequestByUser = async (req, res) => {
  const { userId, email, role } = req.user;
  const { requestId } = req.params;

  try {
    const user = await validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const request = await PrescriptionRequest.findById(requestId);
    if (!request) {
      return res
        .status(404)
        .json({ message: "Prescription request not found" });
    }
    if (request.status !== prescriptionRequestEnum.PHARMACY_APPROVED) {
      return res.status(409).json({
        message:
          "Request should be in PHARMACY_APPROVED status to be declined by user",
      });
    }
    request.status = prescriptionRequestEnum.USER_REJECTED;
    await request.save();

    await notifyUserOrPharmacy({
      pharmacyId: request.pharmacyId,
      userId: request.userId,
      role: "pharmacy",
      title: "Prescription Request Declined by User",
      message: `The user declined the prescription request.`,
    });

    return res.status(200).json(request);
  } catch (error) {
    console.error("Decline Prescription Request by User Error:", error);
    return res
      .status(500)
      .json({ message: "Error declining prescription request by user" });
  }
};

export const declineRequestByPharmacy = async (req, res) => {
  const { userId, email, role } = req.user;
  const { requestId } = req.params;
  const { reason } = req.body;
  try {
    const user = await validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const request = await PrescriptionRequest.findById(requestId);
    if (!request) {
      return res
        .status(404)
        .json({ message: "Prescription request not found" });
    }
    if (request.status !== prescriptionRequestEnum.PENDING) {
      return res.status(409).json({
        message: "Request should be in PENDING status to be declined",
      });
    }
    request.status = prescriptionRequestEnum.PHARMACY_REJECTED;
    request.reason = reason;
    await request.save();

    await notifyUserOrPharmacy({
      userId: request.userId,
      pharmacyId: request.pharmacyId,
      role: "user",
      title: "Prescription Request Declined",
      message: `Your prescription request was declined by ${request.pharmacyId.name}. Reason: ${reason}`,
    });

    return res.status(200).json(request);
  } catch (error) {
    console.error("Decline Prescription Request Error:", error);
    return res
      .status(500)
      .json({ message: "Error declining prescription request" });
  }
};

export const cancelRequestByPharmacy = async (req, res) => {
  const { userId, email, role } = req.user;
  const { requestId } = req.params;

  try {
    const user = await validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const request = await PrescriptionRequest.findById(requestId);
    if (!request) {
      return res
        .status(404)
        .json({ message: "Prescription request not found" });
    }
    if (
      request.status !== prescriptionRequestEnum.PHARMACY_APPROVED &&
      request.status !== prescriptionRequestEnum.USER_APPROVED
    ) {
      return res.status(409).json({
        message:
          "Request should be in PHARMACY_APPROVED or USER_APPROVED status to be cancelled",
      });
    }
    request.status = prescriptionRequestEnum.CANCELLED;
    await request.save();

    await notifyUserOrPharmacy({
      userId: request.userId,
      pharmacyId: request.pharmacyId,
      role: "user",
      title: "Prescription Request Cancelled",
      message: `Your prescription request was cancelled by ${request.pharmacyId.name}.`,
    });

    return res.status(200).json(request);
  } catch (error) {
    console.error("Cancel Prescription Request Error:", error);
    return res
      .status(500)
      .json({ message: "Error cancelling prescription request" });
  }
};
