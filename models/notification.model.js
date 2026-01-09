import mongoose from "mongoose";
const { Schema } = mongoose;

const notificationSchema = new Schema({

 userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }, // optional, if it's related to a task
  type: { type: String, default: 'task-overdue' },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
   createdAt: { type: Date, default: Date.now },
 isHidden: {
    type: Boolean,
    default: false // << when user “clears” task, set this to true
  }
});
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ taskId: 1, type: 1 }); 

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;