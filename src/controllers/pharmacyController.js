import bcrypt from "bcryptjs";
import Pharmacy from "../models/pharmacy.js";
import { validateUser, validateEditFields } from "../service/commonService.js";

export const registerPharmacy = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      phone,
      location,
      suggestedAddress,
      openingDays,
      openingTime,
      closingTime,
    } = req.body;

    const existingPharmacy = await Pharmacy.findOne({ email });
    if (existingPharmacy) {
      return res.status(400).json({ message: "Pharmacy already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newPharmacy = new Pharmacy({
      email,
      password: hashedPassword,
      name,
      phone,
      location,
      suggestedAddress,
      openingDays,
      openingTime,
      closingTime,
      role: "pharmacy",
    });

    await newPharmacy.save();

    res.status(201).json({ message: "Pharmacy registered successfully" });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const editPharmacy = async (req, res) => {
  const { userId, email, role } = req.user;
  const updatedData = req.body;

  try {
    const user = validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const noRestrictedFirlds = validateEditFields(updatedData);

    if (!noRestrictedFirlds) {
      return res
        .status(400)
        .json({ message: "Cannot update restricted fields" });
    }

    const updatedPharmacy = await Pharmacy.findByIdAndUpdate(
      userId,
      updatedData,
      { new: true }
    );

    if (!updatedPharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    const { password, ...safeData } = updatedPharmacy.toObject();
    return res.status(200).json(safeData);
  } catch (error) {
    console.error("Edit Pharmacy Error:", error);
    return res.status(500).json({ message: "Error editing pharmacy" });
  }
};
