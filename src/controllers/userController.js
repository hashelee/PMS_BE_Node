import  User  from "../models/user.js"; 
import bcrypt from "bcryptjs";

export const createUser = async (req, res) => {
  try {
    const { email, password, name, phone, suggestedAddress } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
      suggestedAddress,
      role: "user"
    });

    res.status(201).json({ message: "User created successfully!", user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

