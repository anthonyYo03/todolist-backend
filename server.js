import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectToDatabase from './utils/db.js';
import userRoutes from './routes/userRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import http from "http";
import { Server } from "socket.io";
import Task from "./models/task.model.js";
import Notification from "./models/notification.model.js";

dotenv.config();

const app = express();

//Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Routes
app.use("/api", userRoutes);
app.use("/", taskRoutes);
app.use("/", notificationRoutes);

// Connect to DB
connectToDatabase();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("New client connected");

  const interval = setInterval(() => checkAndEmitOverdueTasks(socket),60*1000); // every 60s

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearInterval(interval);
  });
});

//Function to create overdue notifications
async function createOverdueNotification(task) {
  const exists = await Notification.findOne({
    taskId: task._id,
    userId: task.createdBy,
    type: "task-overdue",
    
  });

  if (!exists) {
    await Notification.create({
      taskId: task._id,
      userId: task.createdBy,
      type: "task-overdue",
      message: `Task "${task.name}" is overdue!`
    });
  }
}

//Function to check overdue tasks and notify clients
async function checkAndEmitOverdueTasks(socket) {
  try {
    // Get all overdue tasks (pending/in-progress)
    const overdueTasks = await Task.find({
      status: { $in: ["pending", "in-progress"] },
      dueDate: { $lt: new Date() }
    });

    console.log("✅ Found overdue tasks:", overdueTasks.length);

    // Create notifications in DB if it does not exist
    for (const task of overdueTasks) {
      await createOverdueNotification(task);
    }

    // Get all notifications for all users and emit
    const notifications = await Notification.find({ isHidden: false }).sort({ createdAt: -1 });

    socket.emit("refreshNotifications", notifications);

  } catch (error) {
    console.error("❌ Error checking overdue tasks:", error);
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
