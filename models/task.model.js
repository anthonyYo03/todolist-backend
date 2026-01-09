import mongoose from "mongoose";
const { Schema } = mongoose;
const tasksSchema=new Schema({ 
    name:{
    type:String,
    required:true
},
    description:
    {
    type:String, 
    required:true
},
    status:{type:String, required:true, enum:['pending','in-progress','completed'], default:'pending'},
    creationDate:{type:Date, default:Date.now},
    dueDate:{type:Date, required:true},
    
    createdBy:{
    type:Schema.Types.ObjectId,
    ref:"User",
    required:true
    }
   



    
})
tasksSchema.index({ createdBy: 1 });
const Task=mongoose.model('Task', tasksSchema);

export default Task;