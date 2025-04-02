import User from "../models/user.js";
import Pharmacy from "../models/pharmacy.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const isUser = true;
  await loginByEntity(isUser, email, password, res);
};

export const loginPharmacy = async (req, res) => {
  const { email, password } = req.body;
  const isUser = false;
  await loginByEntity(isUser, email, password, res);
};

export const changePassword = async (req, res) => {
 try {
   const { oldPassword, newPassword } = req.body;
   const userId = req.user._id;
   const email = req.user.email; 
   const role = req.user.role;
 
   const Model = role === "user" ? User : Pharmacy;
 
   const user = Model.findOne({_id: userId,email: email});
   if(!user) return res.status(404).json({ message: "User not found" });
 
   const isMatch = await bcrypt.compare(oldPassword, user.password);
   if (!isMatch)
     return res.status(401).json({ message: "Invalid old password" });
 
   const hashedPassword = await bcrypt.hash(newPassword, 10);
 
   user.password = hashedPassword;
   await user.save();
 
   res.status(200).json({ message: "Password changed successfully" });
 
 } catch (error) {
  console.error("Change Password Error:", error);
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
