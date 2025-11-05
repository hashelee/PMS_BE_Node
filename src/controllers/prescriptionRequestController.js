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
