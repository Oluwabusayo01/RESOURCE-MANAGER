import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.log(`Error connecting to database: ${error.message}`);
  }
};

export default connectDatabase;
