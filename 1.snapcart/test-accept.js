const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const id = "cm82b0ehe0009w18mxx04nzz0"; // This is the delivery assignment ID from the screenshot
        const deliveryBoyId = "cm81w8vxs0000w1zow4myi5o3"; // Hardcoding to User Id for testing. Assuming one exists based on earlier delivery dashboard views

        // Test the sequence of the API exactly
        console.log("Finding assignment...");
        const assignment = await prisma.deliveryAssignment.findUnique({
            where: { id }
        });
        console.log("Assignment:", assignment?.status);

        const updatedAssignment = await prisma.deliveryAssignment.update({
            where: { id },
            data: {
                assignedToId: deliveryBoyId, // Requires delivery boy id to be valid user id
                status: "assigned",
                acceptedAt: new Date()
            }
        });
        console.log("Assignment updated");

        console.log("Updating order...");
        const order = await prisma.order.update({
            where: { id: assignment.orderId },
            data: { assignedDeliveryBoyId: deliveryBoyId },
            include: { assignedDeliveryBoy: true }
        });
        console.log("Order updated");

    } catch (err) {
        console.error("Test Script Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
