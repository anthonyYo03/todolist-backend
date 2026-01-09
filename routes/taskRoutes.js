import express from 'express';
const router = express.Router();
import taskControllers from '../controllers/taskControllers.js';
import { verifyToken } from '../middleware/auth.js';





router.post('/api/tasks',verifyToken,taskControllers.createTask);
router.get('/api/tasks',verifyToken, taskControllers.getTasks);
router.get('/api/task/:id',verifyToken, taskControllers.getOneTask);
router.put('/api/tasks/:id',verifyToken,  taskControllers.updateTask);
router.delete('/api/tasks/:id', verifyToken, taskControllers.deleteTask);
export default router;