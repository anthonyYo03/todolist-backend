import express from 'express';
const router = express.Router();
import notificationControllers from '../controllers/notificationControllers.js';
import { verifyToken } from '../middleware/auth.js'; // ✅ ADD THIS IMPORT

// ✅ ADD verifyToken TO ALL ROUTES
router.get('/task/notifications', verifyToken, notificationControllers.getNotification);
router.get('/task/notifications/unread-count', verifyToken, notificationControllers.notificationCounter);
router.put('/task/notifications/clear', verifyToken, notificationControllers.clearNotifications);
router.post('/task/notifications', verifyToken, notificationControllers.createNotification);
router.put('/task/notifications/:id/mark-as-read', verifyToken, notificationControllers.markAsRead); // ✅ ADD THIS NEW ROUTE

export default router;