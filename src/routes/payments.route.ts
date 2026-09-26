import { Router } from "express";
import generateId from "../utils/generateId.js";

const router = Router();

router.post("/payments", async (req, res) => {
    try {
        const { bookingId, amount } = req.body;

        if (!bookingId || !amount) {
            return res.status(400).json({
                message: "bookingId and amount are required",
            });
        }

        const paymentId = generateId();
        const eventId = generateId();

        await fetch("http://localhost:3000/api/webhooks/payment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                eventId,
                paymentId,
                bookingId,
                amount,
                status: "SUCCESS",
            }),
        });

        return res.status(200).json({
            eventId,
            paymentId,
            bookingId,
            amount,
            status: "SUCCESS",
        });
    } 
    catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Payment failed",
        });
    }
});

export default router;