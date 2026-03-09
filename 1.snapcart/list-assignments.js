const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const assignments = await prisma.deliveryAssignment.findMany({
            include: { order: true }
        });
        console.log("All Assignments:", JSON.stringify(assignments, null, 2));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
