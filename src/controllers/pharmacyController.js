import bcrypt from "bcryptjs";
import Pharmacy from "../models/pharmacy.js";

export const registerPharmacy = async (req, res) => {
    try {
      const { email, password, name, phone, location, suggestedAddress, openingDays, openingTime, closingTime } = req.body;
  
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
        closingTime
      });
  
      await newPharmacy.save();
  
      res.status(201).json({ message: "Pharmacy registered successfully" });
  
    } catch (error) {
      console.error("Signup Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };