import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import connectDatabase from "./config/database.js";
import authRoutes from "./routes/auth.route.js";   
import userRoutes from "./routes/user.route.js";
import resourceRoutes from "./routes/resource.route.js";
import uploadImageRoute from "./routes/uploadImage.route.js";
import bookingRoutes from "./routes/booking.route.js";

dotenv.config();    
connectDatabase();
      
const app = express()
const PORT = process.env.PORT || 8000;
 
app.use(cookieParser());     
           
app.use(
  cors({  
    origin: ["http://localhost:5173", ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);


app.use(express.json());

const _dirname = path.resolve();

app.use("/api", authRoutes); 
app.use("/api", userRoutes);
app.use("/api", resourceRoutes);
app.use("/api", uploadImageRoute);
app.use("/api", bookingRoutes);


// app.use(express.static(path.join(_dirname, "/frontend/dist")));

// app.get("/*", (req, res) => {
//   res.sendFile(path.join(_dirname, "/frontend/dist/index.html"));
// });

app.listen(PORT, () => {
  console.log(` App running on port ${PORT}`);
});
