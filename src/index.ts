import express from "express"
import authRoutes from "./routes/auth.routes.js"
import centerRoutes from "./routes/center.routes.js"
import bookingRoutes from "./routes/booking.routes.js"
import paymentWebhookRoute from "./routes/payment.webhook.js"
import paymentRoute from "./routes/payments.route.js"

import { connectRedis } from "./lib/redis.js";
import { startWorker } from "./worker.js";
const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/api", centerRoutes);
app.use("/api", bookingRoutes);
app.use("/api", paymentWebhookRoute);
app.use("/api", paymentRoute);

const startServer = async () => {
    await connectRedis();
    app.listen(PORT, () => {
        console.log(`APPLICATION RUNNING ON ${PORT}`);
    })
}

startServer();
startWorker();