import Fuse from "fuse.js";
import Medicine from "../models/medicine.js";
import Pharmacy from "../models/pharmacy.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";
import { validateUser, validateEditFields } from "../service/commonService.js";
import mongoose from "mongoose";
import { sendNotificationEmail } from "../utils/notification.js";

// Helper: notify pharmacy for low/out-of-stock/expired
const notifyPharmacyStockOrExpiry = async (medicine) => {
  try {
    const pharmacy = await Pharmacy.findById(medicine.pharmacyId);
    if (!pharmacy) return;

    let title = "";
    let message = "";

    // Avoid sending multiple notifications for same status
    if (medicine.quantity > 0 && medicine.quantity <= 5 && !medicine.notifiedLowStock) {
      title = "Medicine Low Stock";
      message = `Medicine "${medicine.name}" is low in stock (${medicine.quantity} left).`;
      medicine.notifiedLowStock = true;
    }

    if (medicine.quantity === 0 && !medicine.notifiedOutOfStock) {
      title = "Medicine Out of Stock";
      message = `Medicine "${medicine.name}" is out of stock.`;
      medicine.notifiedOutOfStock = true;
    }

    if (medicine.expiryDate && new Date(medicine.expiryDate) < new Date() && !medicine.notifiedExpired) {
      title = "Medicine Expired";
      message = `Medicine "${medicine.name}" has expired.`;
      medicine.notifiedExpired = true;
    }

    if (message) {
      if (pharmacy.email) {
        await sendNotificationEmail(title, message, [pharmacy.email]);
      }

      await Notification.create({
        pharmacyId: pharmacy._id,
        title,
        message,
        role: "pharmacy",
        createdAt: new Date(),
        read: false,
      });

      await medicine.save(); // Save the notification flags
    }
  } catch (err) {
    console.error("Error notifying pharmacy about stock/expiry:", err);
  }
};


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
    const user = await validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingCode = await Medicine.findOne({
      identificationCode,
      pharmacyId: userId,
    });

    if (existingCode) {
      return res
        .status(409)
        .json({ message: "Identification code must be unique." });
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

    await notifyPharmacyStockOrExpiry(newMedicine);

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
    const user = await validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const noRestrictedFields = validateEditFields(updatedData);
    if (!noRestrictedFields) {
      return res
        .status(400)
        .json({ message: "Cannot update restricted fields" });
    }

    const errors = await validateMedicineData(updatedData);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(", ") });
    }

    let updatedMedicine = await Medicine.findByIdAndUpdate(
      medicineId,
      updatedData,
      { new: true }
    ).populate("pharmacyId", "name email");

    if (!updatedMedicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    // Notify pharmacy if low/out-of-stock/expired
    await notifyPharmacyStockOrExpiry(updatedMedicine);

    // Optional: notify wishlist users if stock increased
    if (updatedData.quantity && updatedData.quantity > 0) {
      const usersWithWishlist = await User.find({
        "wishlist.medicineId": medicineId,
      }).select("email _id name");

      const emails = usersWithWishlist.map((u) => u.email);

      if (emails.length > 0) {
        await sendNotificationEmail(
          "Medicine Restocked!",
          `The medicine "${updatedMedicine.name}" from "${updatedMedicine.pharmacyId.name}" is now back in stock.`,
          emails
        );

        const userNotifications = usersWithWishlist.map((u) => ({
          userId: u._id,
          pharmacyId: updatedMedicine.pharmacyId._id,
          medicineId,
          title: "Medicine Restocked!",
          message: `The medicine "${updatedMedicine.name}" from "${updatedMedicine.pharmacyId.name}" is now back in stock.`,
          role: "user",
        }));

        await Notification.insertMany(userNotifications);
      }
    }

    return res.status(200).json(updatedMedicine);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating medicine" });
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

export const getPharmaciesByMedicines = async (req, res) => {
  const { userId, email, role } = req.user;
  try {
    const user = validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { lng, lat, maxDistance = 10000, names } = req.query;

    if (!lng || !lat) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required." });
    }
    if (!names || (!Array.isArray(names) && typeof names !== "string")) {
      return res.status(400).json({
        message: "A medicine name or an array of medicine names is required.",
      });
    }

    const medicineNames = Array.isArray(names) ? names : [names];

    let medicines = await Medicine.find({}).populate("pharmacyId");

    const fuse = new Fuse(medicines, {
      keys: ["name", "description", "category", "brand"],
      threshold: 0.4,
    });
    medicines = medicineNames
      .flatMap((name) => fuse.search(name).map((r) => r.item))
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

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

    const result = nearbyPharmacies
      .map((pharmacy) => ({
        pharmacy: pharmacy,
        medicines: grouped[pharmacy._id.toString()].medicines,
        medicineCount: grouped[pharmacy._id.toString()].medicines.length,
      }))
      .sort((a, b) => b.medicineCount - a.medicineCount);

    res.json(result);
  } catch (error) {
    console.error("Error in getPharmaciesByMedicines:", error);
    res.status(500).json({ error: error.message });
  }
};

export const searchInPharmacy = async (req, res) => {
  const { userId, email, role } = req.user;
  const { pharmacyId } = req.params;
  const { names } = req.query;
  try {
    const user = validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!names || (!Array.isArray(names) && typeof names !== "string")) {
      return res.status(400).json({
        message: "A medicine name or an array of medicine names is required.",
      });
    }
    const medicineNames = Array.isArray(names) ? names : [names];
    let medicines = await Medicine.find({ pharmacyId }).populate("pharmacyId");

    const fuse = new Fuse(medicines, {
      keys: ["name", "description", "category", "brand"],
      threshold: 0.4,
    });
    medicines = medicineNames
      .flatMap((name) => fuse.search(name).map((r) => r.item))
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
    return res.status(200).json(medicines);
  } catch (error) {
    console.error("Search Error:", error);
    return res.status(500).json({ message: "Error searching medicines" });
  }
};
