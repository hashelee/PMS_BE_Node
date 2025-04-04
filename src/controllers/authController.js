import User from "../models/user.js";
import Pharmacy from "../models/pharmacy.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  await loginByEntity(true, email, password, res);
};

export const loginPharmacy = async (req, res) => {
  const { email, password } = req.body;
  await loginByEntity(false, email, password, res);
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await validateUser(req, res);
    if (!user) return;

    if (!oldPassword || !newPassword) {
      return res
        .status(400).json({ message: "oldPassword and newPassword are required" });
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
  forgotPassword(req, res, true);
};

export const forgotPasswordPharmacy = async (req, res) => {
  forgotPassword(req, res, false);
};

const forgotPassword = async (req, res, isUser) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "email is required" });
    }

    const Model = isUser ? User : Pharmacy;

    const user = await Model.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await saveNewPassword(newPassword, user, res);
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const validateUser = async (req, res) => {
  try {
    const { userId, email, role } = req.user;
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

const saveNewPassword = async (newPassword, user, res) => {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Save new Password Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const generateToken = (userId, email, role) => {
  return jwt.sign({ userId, email, role }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });
};

const loginByEntity = async (isUser, email, password, res) => {
  try {
    const Model = isUser ? User : Pharmacy;
    const user = await Model.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = generateToken(user._id, user.email, user.role);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: isUser ? user.userId : user.pharmacyId,
        name: user.name,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
