import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/centers", async (req, res) => {

    try {   
        const centers = await prisma.diagnosticCentre.findMany({
            include: {
                tests: true
            }
        });
        if(!centers) {
            return res.status(400).json({
                message: "Error in fetching center in your location",
            })
        }
        return res.status(200).json({
            centers,
            message: "Centers fetched successfully",
        })
    }
    catch(err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal server error",
        })
    }
})

router.get("/centers/:id", async (req, res) => {

    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                message: "Center ID is required"
            });
        }
        const center = await prisma.diagnosticCentre.findUnique({
            where: {
                id
            }
        })
        if(!center) {
            return res.status(404).json({
                message: "Diagonstic Center not found",
            })
        }
        return res.status(200).json({
            center,
            message: "Diagonstic Center fetched successfully."
        })
    }
    catch(err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal server error",
        })
    }
})

router.get("/centers/:id/tests", async (req, res) => {
    
    try {
        const { id } = req.params;
        const center = await prisma.diagnosticCentre.findUnique({
            where: {
                id
            },
            include: {
                tests: true
            }
        });
        if(!center) {
            return res.status(404).json({
                message: "Diagonstic Center not found",
            })
        }
        return res.status(200).json({
            centerId: center.id,
            centerName: center.name,
            tests: center.tests,
            message: "Feteched Available tests"
        })
    }
    catch(err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
        })
    }
})
export default router;