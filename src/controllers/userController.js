import User from "../models/user.js";
import bcrypt from "bcryptjs";
import { validateUser, validateEditFields } from "../service/commonService.js";

export const createUser = async (req, res) => {
  try {
    const { email, password, name, phone, suggestedAddress } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
      suggestedAddress,
      role: "user",
    });

    res
      .status(201)
      .json({ message: "User created successfully!", user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUser = async (req, res) => {
  const { userId, email, role } = req.user;
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

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updatedData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...safeData } = updatedUser.toObject();
    return res.status(200).json(safeData);
  } catch (error) {
    console.error("Edit User Error:", error);
    return res.status(500).json({ message: "Error editing user" });
  }
};
