import bcrypt from "bcryptjs";
import Medicine from "../models/medicine.js";
import Pharmacy from "../models/pharmacy.js";
import User from "../models/user.js";
import Fuse from "fuse.js";
import { validateUser, validateEditFields } from "../service/commonService.js";
import mongoose from "mongoose";

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
      deliveryAvailability,
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
      deliveryAvailability,
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

    const noRestrictedFields = validateEditFields(updatedData);

    if (!noRestrictedFields) {
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

export const deletePharmacy = async (req, res) => {
  const { userId, email, role } = req.user;
  const password = req.body.password;
  try {
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    const user = await validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Fetch all medicine IDs associated with the pharmacy
    const medicines = await Medicine.find({ pharmacyId: userId }).select("_id");
    const medicineIds = medicines.map((medicine) => medicine._id);

    // Delete all medicines associated with the pharmacy
    await Medicine.deleteMany({ pharmacyId: userId });

    // Delete all wishlist items containing those medicines
    await User.updateMany(
      { "wishlist.medicineId": { $in: medicineIds } },
      { $pull: { wishlist: { medicineId: { $in: medicineIds } } } }
    );

    // Delete all cart items containing those medicines
    await User.updateMany(
      { "cart.medicineId": { $in: medicineIds } },
      { $pull: { cart: { medicineId: { $in: medicineIds } } } }
    );

    // Delete the pharmacy itself
    await Pharmacy.findByIdAndDelete(userId);

    return res.status(200).json({ message: "Pharmacy and associated data deleted successfully" });
  } catch (error) {
    console.error("Delete Pharmacy Error:", error);
    return res.status(500).json({ message: "Error deleting pharmacy" });
  }
};

export const getMedicine = async (req, res) => {
  const { userId, email, role } = req.user;

  try {
    const user = validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const medicines = await Medicine.find({ pharmacyId: userId });

    return res.status(200).json(medicines);
  } catch (error) {
    console.error("Get Medicine Error:", error);
    return res.status(500).json({ message: "Error fetching medicines" });
  }
};

export const getNearbyPharmacies = async (req, res) => {
  const { userId, email, role } = req.user;

  try {
    const user = validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { lng, lat, maxDistance = 10000 } = req.query;

    if (!lng || !lat) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required." });
    }

    const pharmacies = await Pharmacy.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          distanceField: "distance",
          maxDistance: parseInt(maxDistance),
          spherical: true,
        },
      },
    ]);

    res.json(pharmacies);
  } catch (error) {
    console.error("Error in getNearbyPharmacies:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getNearbyPharmaciesByName = async (req, res) => {
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

    let pharmacies = await Pharmacy.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          distanceField: "distance",
          maxDistance: parseInt(maxDistance),
          spherical: true,
        },
      },
      {
        $sort: { distance: 1 },
      },
    ]);

    if (name) {
      const fuse = new Fuse(pharmacies, {
        keys: ["name", "suggestedAddress"],
        threshold: 0.4,
      });
      const searchResults = fuse.search(name).map((result) => result.item);

      const nameMatches = searchResults.filter((pharmacy) =>
        pharmacy.name.toLowerCase().includes(name.toLowerCase())
      );
      
      const addressMatches = searchResults.filter((pharmacy) =>
        pharmacy.suggestedAddress.toLowerCase().includes(name.toLowerCase()) &&
        !pharmacy.name.toLowerCase().includes(name.toLowerCase())
      );

      nameMatches.sort((a, b) => a.distance - b.distance);
      addressMatches.sort((a, b) => a.distance - b.distance);

      pharmacies = [...nameMatches, ...addressMatches];
    }

    res.json(pharmacies);
  } catch (error) {
    console.error("Error in getNearbyPharmaciesByName:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getPharmacyDetails = async (req, res) => {
  const { userId, email, role } = req.user;

  try {
    const user = validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { pharmacyId } = req.query;
    if (!pharmacyId) {
      return res.status(400).json({ message: "Pharmacy ID is required" });
    }

    let pharmacy;

    if (mongoose.Types.ObjectId.isValid(pharmacyId)) {
      // search by MongoDB ObjectId
      pharmacy = await Pharmacy.findById(pharmacyId).lean();
    } else {
      // fallback: search by custom field (e.g. numeric pharmacyCode)
      pharmacy = await Pharmacy.findOne({ pharmacyCode: pharmacyId }).lean();
    }

    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    const medicines = await Medicine.find({ pharmacyId: pharmacy._id }).lean();

    const { password, ...safePharmacy } = pharmacy;

    return res.status(200).json({
      ...safePharmacy,
      medicines,
    });
  } catch (error) {
    console.error("Error in getPharmacyDetails:", error);
    return res.status(500).json({ message: "Error fetching pharmacy details" });  // add order count
  }
};


