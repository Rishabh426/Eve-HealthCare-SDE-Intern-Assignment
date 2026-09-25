import express from "express"
import { prisma } from "./lib/prisma.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Hello",
    })
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        if (!password) {
            return res.status(400).json({
                message: "Password is required",
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                email: email.trim().toLowerCase(),
            },
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not configured");
        }

        const token = jwt.sign(
            {
                userId: user.id,
            },
            jwtSecret,
            {
                expiresIn: "7d",
            }
        );

        return res.status(200).json({
            message: "User logged in successfully",
            token,
        });
    } 
    catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

app.post("/signup", async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Name is required",
            });
        }

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        if (!password) {
            return res.status(400).json({
                message: "Password is required",
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match",
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered",
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });

        return res.status(201).json({
            message: "User registered successfully",
            user,
        });
    } 
    catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

app.listen(PORT, () => console.log(`APLLICATION RUNNING ON PORT ${PORT}`));