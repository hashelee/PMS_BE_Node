import Fuse from "fuse.js";
import Medicine from "../models/medicine.js";
import Pharmacy from "../models/pharmacy.js";

import { validateUser, validateEditFields } from "../service/commonService.js";
import mongoose from "mongoose";

export const createMedicine = async (req, res) => {
  const { userId, email, role } = req.user;
  const {
    identificationCode,
    name,
    brand,
    description,
    price,
    quantity,
    dosage,
    category,
    expiryDate,
    prescriptionRequired,
  } = req.body;

  try {
    const user = validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newMedicine = new Medicine({
      pharmacyId: userId,
      identificationCode,
      name,
      brand,
      description,
      price,
      quantity,
      dosage,
      category,
      expiryDate,
      prescriptionRequired,
    });

    await newMedicine.save();

    return res.status(201).json(newMedicine);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Identification code must be unique." });
    }
    console.error(error);
    return res.status(500).json({ message: "Error creating medicine" });
  }
};

export const editMedicine = async (req, res) => {
  const { userId, email, role } = req.user;
  const { medicineId } = req.params;
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

    const errors = await validateMedicineData(updatedData);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(", ") });
    }

    const updatedMedicine = await Medicine.findByIdAndUpdate(
      medicineId,
      updatedData,
      { new: true }
    );

    if (!updatedMedicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    return res.status(200).json(updatedMedicine);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error creating medicine" });
  }
};

export const deleteMedicine = async (req, res) => {
  const { userId, email, role } = req.user;
  const { medicineId } = req.params;

  try {
    const user = validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const deletedMedicine = await Medicine.findByIdAndDelete(medicineId);

    if (!deletedMedicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    return res.status(200).json({ message: "Medicine deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error deleting medicine" });
  }
};

export const getMedicineById = async (req, res) => {
  const { userId, email, role } = req.user;
  const { medicineId } = req.params;

  try {
    const user = validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const medicine = await Medicine.findById(medicineId).populate(
      "pharmacyId",
      "name email"
    );
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    return res.status(200).json(medicine);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching medicine" });
  }
};

export const getAllMedicines = async (req, res) => {
  const { userId, email, role } = req.user;
  const { pharmacyId } = req.params;

  try {
    const user = validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const medicines = await Medicine.find({ pharmacyId }).populate(
      "pharmacyId",
      "name email"
    );
    if (!medicines || medicines.length === 0) {
      return res
        .status(404)
        .json({ message: "No medicines found for this pharmacy" });
    }
    return res.status(200).json(medicines);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching medicines" });
  }
};

const validateMedicineData = async (data) => {
  const { price, quantity, dosage, expiryDate } = data;
  const errors = [];
  if (price <= 0) errors.push("Price must be greater than 0");

  if (quantity <= 0) errors.push("Quantity must be greater than 0");
  if (dosage <= 0) errors.push("Dosage must be greater than 0");

  if (new Date(expiryDate) < new Date())
    errors.push("Expiry date must be in the future");
  return errors;
};

export const getPharmaciesByMedicine = async (req, res) => {
  const { userId, email, role } = req.user;
  try {
    const user = validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { lng, lat, maxDistance = 10000, name } = req.query;

    if (!lng || !lat) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required." });
    }
    if (!name) {
      return res.status(400).json({ message: "Medicine name is required." });
    }

    let medicines = await Medicine.find({}).populate("pharmacyId");

    
    const fuse = new Fuse(medicines, {
      keys: ["name", "description"],
      threshold: 0.4,
    });
    medicines = fuse.search(name).map((r) => r.item);

    if (medicines.length === 0) {
      return res.json([]);
    }

    const grouped = medicines.reduce((acc, med) => {
      const pid = med.pharmacyId._id.toString();
      if (!acc[pid]) {
        acc[pid] = {
          pharmacy: med.pharmacyId.toObject(),
          medicines: [],
        };
      }
      acc[pid].medicines.push(med);
      return acc;
    }, {});

    const pharmacyIds = Object.keys(grouped).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const nearbyPharmacies = await Pharmacy.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          distanceField: "distance",
          maxDistance: parseInt(maxDistance),
          spherical: true,
          query: { _id: { $in: pharmacyIds } },
        },
      },
      { $sort: { distance: 1 } },
    ]);

    const result = nearbyPharmacies.map((pharmacy) => ({
      medicines: grouped[pharmacy._id.toString()].medicines,
    }));

    res.json(result);
  } catch (error) {
    console.error("Error in getPharmaciesByMedicine:", error);
    res.status(500).json({ error: error.message });
  }
};
