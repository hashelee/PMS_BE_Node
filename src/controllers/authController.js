import User from "../models/user.js";
import Pharmacy from "../models/pharmacy.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { validateUser } from "../service/commonService.js";

dotenv.config();

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await loginByEntity(true, email, password);
    res.status(200).json(result);
  } catch (err) {
    console.error("Login error:", err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Internal Server Error" });
  }
};

export const loginPharmacy = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await loginByEntity(false, email, password);
    res.status(200).json(result);
  } catch (err) {
    console.error("Login error:", err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Internal Server Error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { userId, email, role } = req.user;
    const { oldPassword, newPassword } = req.body;

    const user = await validateUser(userId, email, role);

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "oldPassword and newPassword are required" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid old password" });

    await saveNewPassword(newPassword, user, res);
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
    return null;
  }
};

export const forgotPasswordUser = async (req, res) => {
  const { email, newPassword } = req.body;

  await forgotPassword(email, newPassword, true);
  res.status(200).json({ message: "Password changed successfully" });
};

export const forgotPasswordPharmacy = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    await forgotPassword(email, newPassword, false);
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const forgotPassword = async (email, newPassword, isUser) => {
  if (!email || !newPassword) {
    return res
      .status(400)
      .json({ message: "Both email and newPassword are required" });
  }

  const Model = isUser ? User : Pharmacy;

  const user = await Model.findOne({ email });
  if (!user) throw { status: 404, message: "User not found" };
  await saveNewPassword(newPassword, user);
};

const saveNewPassword = async (newPassword, user) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;
  await user.save();
};

const generateToken = (userId, email, role) => {
  return jwt.sign({ userId, email, role }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });
};

const loginByEntity = async (isUser, email, password) => {
  const Model = isUser ? User : Pharmacy;
  const user = await Model.findOne({ email });
  if (!user) throw { status: 404, message: "User not found" };

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw { status: 401, message: "Invalid Credentials" };

  const token = generateToken(user._id, user.email, user.role);

  return {
    message: "Login successful",
    token,
    user: {
      id: isUser ? user.userId : user.pharmacyId,
      name: user.name,
    },
  };
};
