import express from 'express';
const router = express.Router();
import { userControllers } from '../controllers/userControllers.js';
import { verifyToken } from '../middleware/auth.js';

router.post('/register', userControllers.registerUser);
router.post('/login', userControllers.loginUser);
router.post('/logout', verifyToken, userControllers.logoutUser);
router.get('/users/:id', verifyToken, userControllers.getUsers);

//We dont put verifyToken - users can't be logged in when resetting password!
router.post('/requestPasswordReset', userControllers.requestPasswordReset);
router.post('/resetPassword', userControllers.resetPassword);

export default router;