import { redis } from "./lib/redis.js";
import { prisma } from "./lib/prisma.js"

export async function processBooking(bookingId: string) {

    const booking = await prisma.booking.findUnique({
        where: {
            id: bookingId,
        },
    });

    if (!booking) {
        console.log(`Booking ${bookingId} not found`);
        return;
    }

    if (booking.status !== "PENDING") {
        console.log(`Booking ${bookingId} is already ${booking.status}`);
        return;
    }

    const response = await fetch("http://localhost:3000/api/payments", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            bookingId: booking.id,
            amount: booking.amount,
        }),
    });

    if (!response.ok) {
        throw new Error(`Payment request failed: ${response.status}`);
    }

    const payment = await response.json();

    console.log(
        `Payment initiated for booking ${bookingId}:`,
        payment
    );
}

export async function startWorker() {

    console.log("Booking worker started");

    while (true) {
        try {
            const result = await redis.brPop("booking_queue", 0);

            if (!result) {
                continue;
            }

            const bookingId = result.element;

            console.log(`Processing booking: ${bookingId}`);

            await processBooking(bookingId);
        } 
        catch (error) {
            console.error("Worker error:", error);
        }
    }
}
