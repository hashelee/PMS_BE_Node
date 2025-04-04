import Medicine from "../models/medicine.js";
import Pharmacy from "../models/pharmacy.js";
import { validateUser } from "../service/commonService.js";

export const createMedicine = async (req, res) => {
  const { userId, email, role } = req.user;
  const { name, brand, description, price, quantity, dosage, category, expiryDate } =
    req.body;

  try {
    validateUser(userId, email, role);

    const newMedicine = new Medicine({
      pharmacyId: userId,
      name,
      brand,
      description,
      price,
      quantity,
      dosage,
      category,
      expiryDate,
    });

    await newMedicine.save();

    return res.status(201).json(newMedicine);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error creating medicine" });
  }
};
