import Notification from "../models/notification.model.js";

// 1️⃣ Get all visible notifications (newest first)
const getNotification = async (req, res) => {
  const userId = req.userId;
  try {
    const notifications = await Notification.find({ userId, isHidden: false })
      .sort({ createdAt: -1 });
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error });
  }
};

// 2️⃣ Get unread notification count (only visible)
const notificationCounter = async (req, res) => {
  const userId = req.userId;
  try {
    const count = await Notification.countDocuments({
      userId,
      isRead: false,
      isHidden: false
    });
    res.status(200).json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching notification count", error });
  }
};

// 3️⃣ Mark a single notification as read (only if visible)
const markAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const result = await Notification.updateOne(
      { _id: id, userId, isHidden: false },
      { isRead: true }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Notification not found, hidden, or already read" });
    }

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error marking notification as read", error });
  }
};

// 4️⃣ Clear all notifications (mark as hidden)
const clearNotifications = async (req, res) => {
  const userId = req.userId;

  try {
    const result = await Notification.updateMany(
      { userId, isHidden: false },
      { isHidden: true }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "No notifications found" });
    }

    res.status(200).json({ message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ message: "Error clearing notifications", error });
  }
};

// 5️⃣ Create a new notification
const createNotification = async (req, res) => {
  const { userId, taskId, type, message } = req.body;

  try {
    const notification = await Notification.create({ userId, taskId, type, message });
    res.status(201).json({ message: "Notification created successfully", notification });
  } catch (error) {
    res.status(400).json({ message: "Error creating notification", error });
  }
};

export default {
  getNotification,
  notificationCounter,
  markAsRead,
  clearNotifications,
  createNotification,
};
