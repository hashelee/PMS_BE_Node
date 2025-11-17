import Notification from "../models/notification.js";

export const getNotifications = async (req, res) => {
  const { userId, role } = req.user;

  try {
    let query = {};
    if (role === "user") query = { userId, role: "user" };
    else if (role === "pharmacy") query = { pharmacyId: userId, role: "pharmacy" };

    const notifications = await Notification.find(query)
      .populate("medicineId", "name")
      .populate("pharmacyId", "name")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

export const markNotificationRead = async (req, res) => {
  const { notificationId } = req.params;
  const { userId, role } = req.user;

  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      ...(role === "user" ? { userId } : { pharmacyId: userId })
    });

    if (!notification) return res.status(404).json({ message: "Notification not found" });

    notification.read = true;
    await notification.save();

    res.status(200).json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating notification" });
  }
};

export const deleteNotification = async (req, res) => {
  const { notificationId } = req.params;
  const { userId, role } = req.user;

  try {
    // Find the notification for this user or pharmacy
    const notification = await Notification.findOne({
      _id: notificationId,
      ...(role === "user" ? { userId } : { pharmacyId: userId }),
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Delete the notification
    await Notification.deleteOne({ _id: notificationId });

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting notification" });
  }
};

