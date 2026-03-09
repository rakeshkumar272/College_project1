const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const id = "cm82b0ehe0009w18mxx04nzz0"; // This is the delivery assignment ID from the screenshot
        const assignment = await prisma.deliveryAssignment.findUnique({
            where: { id },
            include: { broadcastedTo: true }
        });
        console.log("Assignment:", JSON.stringify(assignment, null, 2));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
