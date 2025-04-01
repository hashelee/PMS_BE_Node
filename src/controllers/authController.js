import User from "../models/user.js";
import Pharmacy from "../models/pharmacy.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const generateToken = (userId,email) => {
  return jwt.sign({ userId,email }, process.env.JWT_SECRET, { expiresIn: "8h" });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const isUser = req.path.includes("user");

    const Model = isUser ? User : Pharmacy;
    const user = await Model.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = generateToken(user._id, user.email);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: isUser? user.userId: user.pharmacyId,
        name: user.name,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
