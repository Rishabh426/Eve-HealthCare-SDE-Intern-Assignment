import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.post("/webhooks/payment", async (req, res) => {
    try {
        const {
            eventId,
            paymentId,
            bookingId,
            amount,
            status
        } = req.body;

        if (!eventId || !paymentId || !bookingId || !amount || !status) {
            return res.status(400).json({
                message: "Invalid webhook payload",
            });
        }

        if (status !== "SUCCESS") {
            return res.status(400).json({
                message: "Payment was not successful",
            });
        }
        
        const payment = await prisma.webhookEvent.findUnique({
            where: {
                id: eventId,
            }
        });
        if(payment) {
            return res.status(200).json({
                message: "Booking already confirmed",
            });
        }
        const booking = await prisma.booking.findUnique({
            where: {
                id: bookingId,
            },
        });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        if (booking.status !== "PENDING") {
            return res.status(400).json({
                message: "Booking cannot be confirmed",
            });
        }

        await prisma.booking.update({
            where: {
                id: bookingId,
            },
            data: {
                status: "CONFIRMED",
            },
        });
        
        await prisma.webhookEvent.create({
            data: {
                id: eventId,
                eventType: "payment.success",
                paymentId,
                bookingId,
            },
        });

        return res.status(200).json({
            message: "Booking confirmed",
        });
    } 
    catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Webhook processing failed",
        });
    }
});

export default router;