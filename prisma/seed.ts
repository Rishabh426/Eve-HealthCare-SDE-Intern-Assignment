import { prisma } from "../src/lib/prisma.js"

const centres = [
    {
        name: "Star Lab",
        location: "Heera Nagar, Haldwani",
        tests: [
            { name: "CBC", price: 400 },
            { name: "Blood Sugar", price: 150 },
            { name: "Thyroid Profile", price: 700 },
            { name: "Lipid Profile", price: 600 },
            { name: "Vitamin D", price: 1000 },
        ],
    },
    {
        name: "Dr Lal PathLabs",
        location: "Nawabi Road, Haldwani",
        tests: [
            { name: "CBC", price: 450 },
            { name: "Blood Sugar", price: 150 },
            { name: "Thyroid Profile", price: 750 },
            { name: "Lipid Profile", price: 650 },
            { name: "HbA1c", price: 500 },
        ],
    },
    {
        name: "Maxcare Diagnostic and Onco Research Centre",
        location: "Heera Nagar, Mukhani, Haldwani",
        tests: [
            { name: "CBC", price: 400 },
            { name: "Liver Function Test", price: 800 },
            { name: "Kidney Function Test", price: 800 },
            { name: "Thyroid Profile", price: 700 },
            { name: "Vitamin D", price: 950 },
        ],
    },
    {
        name: "Pathkind Labs",
        location: "Kaladhungi Road, Kusumkhera, Haldwani",
        tests: [
            { name: "CBC", price: 400 },
            { name: "Blood Sugar", price: 150 },
            { name: "Lipid Profile", price: 600 },
            { name: "HbA1c", price: 500 },
            { name: "Vitamin D", price: 900 },
        ],
    },
    {
        name: "Agilus Diagnostics",
        location: "Kaladhungi Road, Haldwani",
        tests: [
            { name: "CBC", price: 500 },
            { name: "Blood Sugar", price: 200 },
            { name: "Thyroid Profile", price: 800 },
            { name: "Liver Function Test", price: 850 },
            { name: "Kidney Function Test", price: 850 },
        ],
    },
];

async function main() {
    await prisma.diagnosticTest.deleteMany();
    await prisma.diagnosticCentre.deleteMany();

    for (const centre of centres) {
        await prisma.diagnosticCentre.create({
            data: {
                name: centre.name,
                location: centre.location,
                tests: {
                    create: centre.tests,
                },
            },
        });
    }

    console.log("Diagnostic centre data seeded successfully.");
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });