import mongoose from "mongoose";


async function connectToDatabase() {

    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connected to the database successfully!!");
    } catch (error) {
        console.error("Database connection error:", error);
    }
}

export default connectToDatabase;