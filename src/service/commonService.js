import User from "../models/user.js";
import Pharmacy from "../models/pharmacy.js";

const validateUser = async (userId,email,role) => {
  try {
    
    const Model = role === "user" ? User : Pharmacy;

    const user = await Model.findOne({ _id: userId, email });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return null;
    }

    return user;
  } catch (error) {
    console.error("Validate User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
    return null;
  }
};

export {validateUser};
