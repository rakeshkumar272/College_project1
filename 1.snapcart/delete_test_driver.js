const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function execute() {
  const drivers = await prisma.user.findMany({
    where: {
      role: 'deliveryBoy',
      email: {
        startsWith: 'testdriver',
        mode: 'insensitive'
      }
    }
  });

  if (drivers.length === 0) {
    console.log("No test driver found.");
    return;
  }

  const driverId = drivers[0].id;
  console.log(`Found test driver: ${drivers[0].email} (ID: ${driverId})`);

  // Update orders to delivered
  await prisma.order.updateMany({
    where: { assignedDeliveryBoyId: driverId },
    data: { 
      status: 'delivered',
      assignedDeliveryBoyId: null, // Nullify to allow deleting driver
      deliveredAt: new Date(),
      isPaid: true
    }
  });
  console.log("Updated orders to 'delivered'.");

  // Update assignments to completed
  await prisma.deliveryAssignment.updateMany({
    where: { assignedToId: driverId },
    data: { 
      status: 'completed',
      assignedToId: null // Nullify to allow deleting driver
    }
  });
  console.log("Updated assignments to 'completed'.");

  // Delete messages sent by this driver (if any exist, to avoid FK error)
  await prisma.message.deleteMany({
    where: { senderId: driverId }
  });

  // Finally, delete the driver
  await prisma.user.delete({
    where: { id: driverId }
  });
  
  console.log("Test driver deleted successfully.");
}

execute()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
