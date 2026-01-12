import Task from "../models/task.model.js";

const createTask = async (req, res) => {
  const { name, description, status, dueDate } = req.body;
  const userId = req.userId;

  // Convert to Date
const [year, month, day] = dueDate.split('-');
const due = new Date(year, month - 1, day); // local midnight
  
due.setHours(23, 59, 59, 999);
  // Normalize today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (due < today) {
    return res.status(400).send({
      message: "Due date cannot be in the past",
    });
  }

  try {
    await Task.create({
      name,
      description,
      status,
      dueDate: due,
      createdBy: userId,
    });

    res.status(201).send({ message: "Task created successfully" });
  } catch (error) {
    res.status(400).send({ message: "Error creating task", error });
  }
};


const getTasks = async (req, res) => {
     const userId = req.userId;
    try {
        const tasks = await Task.find({createdBy:userId});
        res.status(200).send(tasks);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching tasks', error });
    }
}






const getOneTask = async (req, res) => {
     const userId = req.userId;
     const { id } = req.params;//Get task ID from request parameters
    try {
        const task = await Task.findOne({createdBy:userId, _id:id});
        if(!task){
          return res.status(404).send({message:'Task not found'});
        }
        res.status(200).send(task);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching tasks', error });
    }
}




const updateTask = async (req, res) => {
  const { id } = req.params;
  const { name, description, status, dueDate } = req.body;
  const userId = req.userId;

  //Only validate and format if dueDate is provided
  let formattedDueDate = dueDate;
  
  if (dueDate) {
    const [year, month, day] = dueDate.split('-');
    const due = new Date(year, month - 1, day);
    
    // Set to end of day
    due.setHours(23, 59, 59, 999);
    
    // Normalize today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (due < today) {
      return res.status(400).send({
        message: "Due date cannot be in the past",
      });
    }
    
    //Use the formatted date
    formattedDueDate = due;
  }

  try {
    const task = await Task.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { name, description, status, dueDate: formattedDueDate }, // ✅ Use formattedDueDate
      { new: true }
    );

    if (!task) {
      return res
        .status(404)
        .send({ message: "Task not found or not authorized" });
    }

    res.status(200).send({ message: "Task updated successfully", task });
  } catch (error) {
    res.status(400).send({ message: "Error updating task", error });
  }
};

const deleteTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const task = await Task.findOneAndDelete({ _id: id, createdBy: userId });

    if (!task) {
      return res.status(404).send({ message: 'Task not found or not authorized' });
    }

    res.status(200).send({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(400).send({ message: 'Error deleting task', error });
  }
};

export default { createTask, getTasks, updateTask, deleteTask,getOneTask };