import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

const swaggerDocument = {
    openapi: "3.0.3",

    info: {
        title: "EVE Healthcare API",
        version: "1.0.0",
        description:
            "Backend API for diagnostic test discovery, booking, asynchronous payment processing, and payment webhook handling.",
    },

    servers: [
        {
            url: process.env.API_URL,
            description: "Local development server",
        },
    ],

    tags: [
        {
            name: "Authentication",
            description: "User registration and authentication",
        },
        {
            name: "Diagnostic Centres",
            description: "Diagnostic centre and test discovery",
        },
        {
            name: "Bookings",
            description: "Diagnostic test booking management",
        },
        {
            name: "Payments",
            description: "Internal mock payment processing",
        },
        {
            name: "Webhooks",
            description: "Payment webhook processing",
        },
    ],

    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },

        schemas: {
            SignupRequest: {
                type: "object",
                required: ["name", "email", "password", "confirmPassword"],
                properties: {
                    name: {
                        type: "string",
                        example: "Rishabh Sharma",
                    },
                    email: {
                        type: "string",
                        format: "email",
                        example: "rishabh@example.com",
                    },
                    password: {
                        type: "string",
                        format: "password",
                        example: "StrongPassword123",
                    },
                    confirmPassword: {
                        type: "string",
                        format: "password",
                        example: "StrongPassword123",
                    },
                },
            },

            LoginRequest: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: {
                        type: "string",
                        format: "email",
                        example: "rishabh@example.com",
                    },
                    password: {
                        type: "string",
                        format: "password",
                        example: "StrongPassword123",
                    },
                },
            },

            User: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        example: "cm123abc456",
                    },
                    name: {
                        type: "string",
                        example: "Rishabh Sharma",
                    },
                    email: {
                        type: "string",
                        example: "rishabh@example.com",
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                    },
                },
            },

            DiagnosticTest: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        example: "test_123",
                    },
                    name: {
                        type: "string",
                        example: "Complete Blood Count",
                    },
                    price: {
                        type: "number",
                        example: 500,
                    },
                    centreId: {
                        type: "string",
                        example: "centre_123",
                    },
                },
            },

            DiagnosticCentre: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        example: "centre_123",
                    },
                    name: {
                        type: "string",
                        example: "EVE Diagnostics Delhi",
                    },
                },
            },

            BookingRequest: {
                type: "object",
                required: [
                    "diagnosticTestId",
                    "diagnosticCentreId",
                    "appointmentDateTime",
                ],
                properties: {
                    diagnosticTestId: {
                        type: "string",
                        example: "test_123",
                    },
                    diagnosticCentreId: {
                        type: "string",
                        example: "centre_123",
                    },
                    appointmentDateTime: {
                        type: "string",
                        format: "date-time",
                        example: "2026-10-05T10:30:00+05:30",
                    },
                },
            },

            Booking: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        example: "booking_123",
                    },
                    diagnosticTestId: {
                        type: "string",
                        example: "test_123",
                    },
                    diagnosticCentreId: {
                        type: "string",
                        example: "centre_123",
                    },
                    appointmentDateTime: {
                        type: "string",
                        format: "date-time",
                        example: "2026-10-05T05:00:00.000Z",
                    },
                    amount: {
                        type: "number",
                        example: 500,
                    },
                    status: {
                        type: "string",
                        enum: [
                            "PENDING",
                            "CONFIRMED",
                            "FAILED",
                            "CANCELLED",
                        ],
                        example: "PENDING",
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                    },
                },
            },

            PaymentRequest: {
                type: "object",
                required: ["bookingId", "amount"],
                properties: {
                    bookingId: {
                        type: "string",
                        example: "booking_123",
                    },
                    amount: {
                        type: "number",
                        example: 500,
                    },
                },
            },

            PaymentWebhook: {
                type: "object",
                required: [
                    "eventId",
                    "paymentId",
                    "bookingId",
                    "amount",
                    "status",
                ],
                properties: {
                    eventId: {
                        type: "string",
                        example: "event_123",
                    },
                    paymentId: {
                        type: "string",
                        example: "payment_123",
                    },
                    bookingId: {
                        type: "string",
                        example: "booking_123",
                    },
                    amount: {
                        type: "number",
                        example: 500,
                    },
                    status: {
                        type: "string",
                        enum: ["SUCCESS"],
                        example: "SUCCESS",
                    },
                },
            },

            Error: {
                type: "object",
                properties: {
                    message: {
                        type: "string",
                        example: "Invalid request",
                    },
                },
            },
        },
    },

    paths: {
        "/auth/signup": {
            post: {
                tags: ["Authentication"],
                summary: "Register a new user",

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/SignupRequest",
                            },
                        },
                    },
                },

                responses: {
                    "201": {
                        description: "User registered successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "User registered successfully",
                                        },
                                        user: {
                                            $ref: "#/components/schemas/User",
                                        },
                                    },
                                },
                            },
                        },
                    },

                    "400": {
                        description: "Invalid request",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/Error",
                                },
                            },
                        },
                    },

                    "409": {
                        description: "Email already registered",
                    },

                    "500": {
                        description: "Internal server error",
                    },
                },
            },
        },

        "/auth/login": {
            post: {
                tags: ["Authentication"],
                summary: "Login user",

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/LoginRequest",
                            },
                        },
                    },
                },

                responses: {
                    "200": {
                        description: "User logged in successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "User logged in successfully",
                                        },
                                        token: {
                                            type: "string",
                                            example: "eyJhbGciOiJIUzI1NiIs...",
                                        },
                                    },
                                },
                            },
                        },
                    },

                    "400": {
                        description: "Missing credentials",
                    },

                    "401": {
                        description: "Invalid email or password",
                    },

                    "500": {
                        description: "Internal server error",
                    },
                },
            },
        },

        "/api/centers": {
            get: {
                tags: ["Diagnostic Centres"],
                summary: "Get all diagnostic centres",

                responses: {
                    "200": {
                        description: "Diagnostic centres retrieved successfully",
                    },

                    "500": {
                        description: "Internal server error",
                    },
                },
            },
        },

        "/api/centers/{id}": {
            get: {
                tags: ["Diagnostic Centres"],
                summary: "Get a diagnostic centre",

                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                    },
                ],

                responses: {
                    "200": {
                        description: "Diagnostic centre found",
                    },

                    "404": {
                        description: "Diagnostic centre not found",
                    },

                    "500": {
                        description: "Internal server error",
                    },
                },
            },
        },

        "/api/centers/{id}/tests": {
            get: {
                tags: ["Diagnostic Centres"],
                summary: "Get tests available at a diagnostic centre",

                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                    },
                ],

                responses: {
                    "200": {
                        description: "Tests retrieved successfully",
                    },

                    "404": {
                        description: "Diagnostic centre not found",
                    },

                    "500": {
                        description: "Internal server error",
                    },
                },
            },
        },

        "/api/bookings": {
            post: {
                tags: ["Bookings"],
                summary: "Create a diagnostic test booking",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/BookingRequest",
                            },
                        },
                    },
                },

                responses: {
                    "201": {
                        description: "Booking created successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "Booking created successfully",
                                        },
                                        booking: {
                                            $ref: "#/components/schemas/Booking",
                                        },
                                    },
                                },
                            },
                        },
                    },

                    "400": {
                        description: "Invalid booking request",
                    },

                    "401": {
                        description: "Authentication required",
                    },

                    "404": {
                        description:
                            "Diagnostic centre or diagnostic test not found",
                    },

                    "500": {
                        description: "Internal server error",
                    },
                },
            },
        },

        "/api/booking": {
            get: {
                tags: ["Bookings"],
                summary: "Get all bookings for the authenticated user",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                responses: {
                    "200": {
                        description: "Bookings retrieved successfully",
                    },

                    "401": {
                        description: "Authentication required",
                    },

                    "500": {
                        description: "Internal server error",
                    },
                },
            },
        },

        "/api/booking/{id}": {
            get: {
                tags: ["Bookings"],
                summary: "Get a booking by ID",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                    },
                ],

                responses: {
                    "200": {
                        description: "Booking retrieved successfully",
                    },

                    "400": {
                        description: "Invalid booking ID",
                    },

                    "401": {
                        description: "Authentication required",
                    },

                    "404": {
                        description: "Booking not found",
                    },

                    "500": {
                        description: "Internal server error",
                    },
                },
            },
        },

        "/api/booking/{id}/cancel": {
            patch: {
                tags: ["Bookings"],
                summary: "Cancel a booking",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                    },
                ],

                responses: {
                    "200": {
                        description: "Booking cancelled successfully",
                    },

                    "400": {
                        description: "Invalid booking ID",
                    },

                    "401": {
                        description: "Authentication required",
                    },

                    "404": {
                        description:
                            "Booking not found or cannot be cancelled",
                    },

                    "500": {
                        description: "Internal server error",
                    },
                },
            },
        },

        "/api/payments": {
            post: {
                tags: ["Payments"],
                summary: "Initiate mock payment",
                description:
                    "Internal endpoint used by the background booking worker to initiate mock payment processing.",

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/PaymentRequest",
                            },
                        },
                    },
                },

                responses: {
                    "200": {
                        description: "Payment processed successfully",
                    },

                    "400": {
                        description: "Invalid payment request",
                    },

                    "500": {
                        description: "Payment failed",
                    },
                },
            },
        },

        "/api/webhooks/payment": {
            post: {
                tags: ["Webhooks"],
                summary: "Process payment webhook",
                description:
                    "Internal webhook endpoint used to update a booking after successful payment. Webhook events are processed idempotently using eventId.",

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/PaymentWebhook",
                            },
                        },
                    },
                },

                responses: {
                    "200": {
                        description:
                            "Webhook processed or event already processed",
                    },

                    "400": {
                        description: "Invalid webhook or payment status",
                    },

                    "404": {
                        description: "Booking not found",
                    },

                    "500": {
                        description: "Webhook processing failed",
                    },
                },
            },
        },
    },
};

export const setupSwagger = (app: Express) => {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};