const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const drivers = await prisma.user.findMany({
    where: {
      role: 'deliveryBoy',
      email: {
        startsWith: 'testdriver',
        mode: 'insensitive'
      }
    }
  });

  console.log("Drivers found:", drivers);

  if (drivers.length > 0) {
    const driverId = drivers[0].id;
    const assignments = await prisma.deliveryAssignment.findMany({
      where: {
        assignedToId: driverId
      }
    });
    console.log("Assignments for driver:", assignments);
    
    const orders = await prisma.order.findMany({
      where: {
        assignedDeliveryBoyId: driverId
      }
    });
    console.log("Orders assigned to driver:", orders);
  }
}

check()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
