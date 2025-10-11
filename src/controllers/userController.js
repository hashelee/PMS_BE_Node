import User from "../models/user.js";
import bcrypt from "bcryptjs";
import { validateUser, validateEditFields } from "../service/commonService.js";
import Medicine from "../models/medicine.js";

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

export const deleteUser = async (req, res) => {
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

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    await User.findByIdAndDelete(userId);
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error);
    return res.status(500).json({ message: "Error deleting user" });
  }
};

export const getUserProfile = async (req, res) => {
  const { userId, email, role } = req.user;
  try {
    const user = await validateUser(userId, email, role); 
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password,wishlist,cart, ...safeData } = user.toObject();
    return res.status(200).json(safeData);
  } catch (error) {
    console.error("Get User Profile Error:", error);
    return res.status(500).json({ message: "Error fetching user profile" });
  }
};

export const addToWishlist = async (req, res) => {
  const { userId, email, role } = req.user;
  const { medicineId } = req.body;
  try {
    const user = await validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    const existingItem = user.wishlist.find(
      (item) => item.medicineId.toString() === medicineId
    );
    if (existingItem) {
      return res.status(400).json({ message: "Item already in wishlist" });
    }
    user.wishlist.push({ medicineId });
    await user.save();
    return res.status(200).json({ message: "Item added to wishlist" });
  } catch (error) {
    console.error("Add to Wishlist Error:", error);
    return res.status(500).json({ message: "Error adding item to wishlist" });
  }
};

export const removeFromWishlist = async (req, res) => {
  const { userId, email, role } = req.user;
  const { medicineId } = req.body;
  try {
    const user = await validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.wishlist = user.wishlist.filter(
      (item) => item.medicineId.toString() !== medicineId
    );
    await user.save();
    return res.status(200).json({ message: "Item removed from wishlist" });
  } catch (error) {
    console.error("Remove from Wishlist Error:", error);
    return res.status(500).json({ message: "Error removing item from wishlist" });
  }
};

export const getUserWishlist = async (req, res) => {
  const { userId, email, role } = req.user;
  try {
    const user = await validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const wishlist = await User.findById(userId)
      .populate({
        path: "wishlist.medicineId",
        select: "name price description quantity pharmacyId",
        populate: { path: "pharmacyId", select: "-password" },
      })
      .select("wishlist");

      const mappedWishList = wishlist.wishlist.reduce((acc, item) => {
      const pharmacy = item.medicineId.pharmacyId;
      const existingPharmacy = acc.find(entry => entry.pharmacy._id.toString() === pharmacy._id.toString());
      const itemWithoutPharmacyId = { ...item.toObject(), medicineId: { ...item.medicineId.toObject() } };
      delete itemWithoutPharmacyId.medicineId.pharmacyId;

      if (!existingPharmacy) {
      acc.push({
        pharmacy,
        items: [itemWithoutPharmacyId],
      });
      } else {
      existingPharmacy.items.push(itemWithoutPharmacyId);
      }
      return acc;
    }, []);

    return res.status(200).json(mappedWishList);
  } catch (error) {
    console.error("Get User Wishlist Error:", error);
    return res.status(500).json({ message: "Error fetching wishlist" });
  }
};

export const addToCart = async (req, res) => {
  const { userId, email, role } = req.user;
  const { medicineId, quantity } = req.body;
  try {
    const user = await validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    const existingItem = user.cart.find(
      (item) => item.medicineId.toString() === medicineId
    );  
    if (existingItem) {
      existingItem.quantity += quantity;
    }
    else {
      user.cart.push({ medicineId, quantity });
    }
    await user.save();
    return res.status(200).json({ message: "Item added to cart" });
  }
  catch (error) {
    console.error("Add to Cart Error:", error);
    return res.status(500).json({ message: "Error adding item to cart" });
  }
};

export const removeFromCart = async (req, res) => {
  const { userId, email, role } = req.user;
  const { medicineId } = req.body;
  try {
    const user = await validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.cart = user.cart.filter(
      (item) => item.medicineId.toString() !== medicineId
    );
    await user.save();
    return res.status(200).json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Remove from Cart Error:", error);
    return res.status(500).json({ message: "Error removing item from cart" });
  }
};

export const getUserCart = async (req, res) => {
  const { userId, email, role } = req.user;
  try {
    const user = await validateUser(userId, email, role);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const cart = await User.findById(userId)
      .populate({
        path: "cart.medicineId",
        select: "name price description quantity pharmacyId",
        populate: { path: "pharmacyId", select: "-password" },
      })
      .select("cart");

    const mappedCart = cart.cart.reduce((acc, item) => {
      const pharmacy = item.medicineId.pharmacyId;
      const existingPharmacy = acc.find(entry => entry.pharmacy._id.toString() === pharmacy._id.toString());
      const itemWithoutPharmacyId = { ...item.toObject(), medicineId: { ...item.medicineId.toObject() } };
      delete itemWithoutPharmacyId.medicineId.pharmacyId;

      if (!existingPharmacy) {
      acc.push({
        pharmacy,
        items: [itemWithoutPharmacyId],
      });
      } else {
      existingPharmacy.items.push(itemWithoutPharmacyId);
      }
      return acc;
    }, []);

    return res.status(200).json(mappedCart);
  } catch (error) {
    console.error("Get User Cart Error:", error);
    return res.status(500).json({ message: "Error fetching cart" });
  }
};
