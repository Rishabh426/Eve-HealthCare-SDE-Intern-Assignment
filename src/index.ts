import express from "express"
import authRoutes from "./routes/auth.routes.js"
import centerRoutes from "./routes/center.routes.js"

const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/api", centerRoutes);

app.listen(PORT, () => console.log(`APLLICATION RUNNING ON PORT ${PORT}`));