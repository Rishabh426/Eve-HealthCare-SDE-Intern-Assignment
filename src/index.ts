import express from "express"
import authRoutes from "./routes/auth.routes.js"
import centerRoutes from "./routes/center.routes.js"
import bookingRoutes from "./routes/booking.routes.js"
import { connectRedis } from "./lib/redis.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/api", centerRoutes);
app.use("/api", bookingRoutes);

const startServer = async () => {
    await connectRedis();
    app.listen(PORT, () => {
        console.log(`APPLICATION RUNNING ON ${PORT}`);
    })
}

startServer();