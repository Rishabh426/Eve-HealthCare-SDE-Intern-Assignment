import { Router } from "express";
import { prisma } from "../lib/prisma.js"
import { authenticate } from "../middleware/auth.middleware.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { redis } from "../lib/redis.js";

const router = Router();

router.post("/bookings", authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        const {
            diagnosticTestId,
            diagnosticCentreId,
            appointmentDateTime,
        } = req.body;

        if (!diagnosticTestId) {
            return res.status(400).json({
                message: "Diagnostic test is required",
            });
        }

        if (!diagnosticCentreId) {
            return res.status(400).json({
                message: "Diagnostic centre is required",
            });
        }

        if (!appointmentDateTime) {
            return res.status(400).json({
                message: "Appointment date and time are required",
            });
        }

        const centre = await prisma.diagnosticCentre.findUnique({
            where: {
                id: diagnosticCentreId,
            },
        });

        if (!centre) {
            return res.status(404).json({
                message: "Diagnostic centre not found",
            });
        }

        const test = await prisma.diagnosticTest.findUnique({
            where: {
                id: diagnosticTestId,
            },
        });

        if (!test) {
            return res.status(404).json({
                message: "Diagnostic test not found",
            });
        }

        if (test.centreId !== diagnosticCentreId) {
            return res.status(400).json({
                message: "Test is not available at this diagnostic centre",
            });
        }

        const booking = await prisma.booking.create({
            data: {
                userId,
                diagnosticTestId,
                diagnosticCentreId,
                appointmentDateTime: new Date(appointmentDateTime),
                amount: test.price,
                status: "PENDING",
            },
            select: {
                id: true,
                diagnosticTestId: true,
                diagnosticCentreId: true,
                appointmentDateTime: true,
                amount: true,
                status: true,
                createdAt: true,
            },
        });
        
        redis.lPush("booking_queue", booking.id);

        return res.status(201).json({
            message: "Booking created successfully",
            booking,
        });
    } 
    catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

router.get("/booking", authenticate, async (req: AuthRequest, res) => {

    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const bookings = await prisma.booking.findMany({
            where: {
                userId,
            },
            include: {
                DiagnosticTest: true,
                DiagnosticCentre: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            bookings,
        });
    }
    catch(err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal server error",
        })
    }
});

router.get("/booking/:id", authenticate, async (req: AuthRequest, res) => {

    const userid = req.userId;
    const { id } = req.params;

    if(!userid) {
        return res.status(401).json({
            message: "Authentication is required",
        })
    }
    if(typeof id !== "string") {
        return res.status(400).json({
            message: "Invalid booking id",
        })
    }

    const booking = await prisma.booking.findUnique({
        where: {
            id: id,
            userId: userid,
        },
        include: {
            DiagnosticTest: true,
            DiagnosticCentre: true,
        }
    })
    if (!booking) {
        return res.status(404).json({
            message: "Booking not found",
        });
    }
    return res.status(200).json({
        booking,
    })
})

router.patch("/booking/:id/cancel", authenticate, async (req: AuthRequest, res) => {

    try {
        const userId = req.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication is required",
            });
        }

        if (typeof id !== "string") {
            return res.status(400).json({
                message: "Invalid booking id",
            });
        }

        const result = await prisma.booking.updateMany({
            where: {
                id,
                userId,
                status: {
                    in: ["PENDING", "CONFIRMED"],
                },
            },
            data: {
                status: "CANCELLED",
            },
        });

        if (result.count === 0) {
            return res.status(404).json({
                message: "Booking not found or cannot be cancelled",
            });
        }

        return res.status(200).json({
            message: "Booking cancelled successfully",
        });
    } 
    catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});
export default router;