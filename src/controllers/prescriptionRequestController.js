import Pharmacy from "../models/pharmacy.js";
import PrescriptionRequest from "../models/prescription_request.js";
import { validateUser } from "../service/commonService.js";

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
    return res.status(201).json(newRequest);
  } catch (error) {
    console.error("Create Prescription Request Error:", error);
    return res
      .status(500)
      .json({ message: "Error creating prescription request" });
  }
};

export const getPrescriptionRequestById = async (req, res) => {
  // Implementation for fetching a prescription request by ID
};
