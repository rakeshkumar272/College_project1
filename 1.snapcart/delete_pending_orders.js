const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pendingOrders = await prisma.order.findMany({
    where: { status: 'pending' },
    select: { id: true }
  });

  const orderIds = pendingOrders.map(o => o.id);

  if (orderIds.length === 0) {
    console.log("No pending orders found to delete.");
    return;
  }

  console.log(`Found ${orderIds.length} pending orders. Deleting related records...`);

  // Delete related DeliveryAssignments
  const deletedAssignments = await prisma.deliveryAssignment.deleteMany({
    where: { orderId: { in: orderIds } }
  });
  console.log(`Deleted ${deletedAssignments.count} delivery assignments.`);

  // Delete related Messages
  const deletedMessages = await prisma.message.deleteMany({
    where: { roomId: { in: orderIds } }
  });
  console.log(`Deleted ${deletedMessages.count} messages.`);

  // Delete related OrderItems
  const deletedItems = await prisma.orderItem.deleteMany({
    where: { orderId: { in: orderIds } }
  });
  console.log(`Deleted ${deletedItems.count} order items.`);

  // Delete the Orders
  const deletedOrders = await prisma.order.deleteMany({
    where: { id: { in: orderIds } }
  });
  console.log(`Successfully deleted ${deletedOrders.count} pending orders!`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
