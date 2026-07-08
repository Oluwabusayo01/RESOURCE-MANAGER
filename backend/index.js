import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDatabase from "./config/database.js";
import authRoutes from "./routes/auth.route.js";   
import userRoutes from "./routes/user.route.js";
import resourceRoutes from "./routes/resource.route.js";
import uploadImageRoute from "./routes/uploadImage.route.js";
import bookingRoutes from "./routes/booking.route.js";
import libraryRoutes from "./routes/library.route.js";
import notificationRoutes from "./routes/notification.route.js";
import adminRoutes from "./routes/admin.route.js";
    
  
dotenv.config();    
      
const app = express()
const PORT = process.env.PORT || 5000;
 
app.use(cookieParser());     
                
app.use(
  cors({  
    origin: ["http://localhost:5173", "https://faculty-resource-manager.vercel.app/" ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);  
              
  
app.use(express.json());
  
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, "../client/dist");

app.use("/api", authRoutes); 
app.use("/api", userRoutes);
app.use("/api", resourceRoutes);
app.use("/api", uploadImageRoute);
app.use("/api", bookingRoutes);
app.use("/api", libraryRoutes);
app.use("/api", notificationRoutes);
app.use("/api", adminRoutes);
  
app.use(express.static(clientDistPath));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});
  
const startServer = async () => {
  try {        
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(` App running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
