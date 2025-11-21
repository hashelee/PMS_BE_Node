import Rating from "../models/rating.js";
import Order from "../models/order.js";

export const addRating = async (req, res) => {
  const { userId } = req.user;
  const { orderId, rating } = req.body;

  try {
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // Validate order ownership
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: "Order not found or not yours" });
    }

    // Prevent duplicate rating
    const existing = await Rating.findOne({ orderId });
    if (existing) {
      return res.status(400).json({ message: "You already rated this order" });
    }

    // Save rating
    const newRating = await Rating.create({
      orderId,
      userId,
      pharmacyId: order.pharmacyId,
      rating,
    });

    return res.status(201).json({
      message: "Rating added successfully",
      rating: newRating,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error adding rating" });
  }
};

export const getUserRatings = async (req, res) => {
  const { userId, role } = req.user;

  try {
    if (role !== "user") {
      return res.status(403).json({ message: "Access denied" });
    }

    const ratings = await Rating.find({ userId })
      .populate("orderId", "orderId totalPrice status createdAt pharmacyId")
      .populate("pharmacyId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json(ratings);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching user ratings" });
  }
};

export const getPharmacyRatings = async (req, res) => {
  const { userId, role } = req.user;

  try {
    if (role !== "pharmacy") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Fetch all ratings for logged-in pharmacy
    const ratings = await Rating.find({ pharmacyId: userId })
      .populate("userId", "name email") // user who rated
      .populate("orderId", "totalPrice status createdAt") // basic order info
      .sort({ createdAt: -1 });

    return res.status(200).json(ratings);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching pharmacy ratings" });
  }
};

// Get average rating for a pharmacy
export const getPharmacyAverageRating = async (req, res) => {
  const { pharmacyId } = req.params; // pharmacy ID from URL

  try {
    if (!pharmacyId) {
      return res.status(400).json({ message: "Pharmacy ID is required" });
    }

    // Fetch ratings for this pharmacy
    const ratings = await Rating.find({ pharmacyId });

    if (!ratings || ratings.length === 0) {
      return res.status(200).json({ averageRating: 0, totalRatings: 0 });
    }

    // Calculate average
    const totalRatings = ratings.length;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = sum / totalRatings;

    return res.status(200).json({ averageRating, totalRatings });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Error fetching pharmacy average rating" });
  }
};
