import User from "../models/user.js";
import Pharmacy from "../models/pharmacy.js";

const validateUser = async (userId, email, role) => {
  try {
    const Model = role === "user" ? User : Pharmacy;

    const user = await Model.findOne({ _id: userId, email });
    if (!user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error("Validate User Error:", error);
    return null;
  }
};

const validateEditFields = (fields) => {
  const restrictedFields = [
    "email",
    "password",
    "role",
    "pharmacyId",
    "userId",
    "medicineId",
    "_id",
    "identificationCode",
  ];

  for (const field of restrictedFields) {
    if (fields.hasOwnProperty(field)) {
      return false;
    }
  }
  return true;
};

export { validateUser, validateEditFields };
