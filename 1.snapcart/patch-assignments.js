const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function patch() {
    console.log('Patching delivery assignments...')

    const onlineRiders = await prisma.user.findMany({
        where: { role: 'deliveryBoy', isOnline: true }
    })

    if (onlineRiders.length === 0) {
        console.log('No online riders found to patch into assignments.')
        process.exit(0)
    }

    const assignments = await prisma.deliveryAssignment.findMany({
        where: { status: 'brodcasted' }
    })

    for (const a of assignments) {
        console.log(`Updating assignment ${a.id}...`)
        await prisma.deliveryAssignment.update({
            where: { id: a.id },
            data: {
                broadcastedTo: {
                    connect: onlineRiders.map(r => ({ id: r.id }))
                }
            }
        })
    }

    console.log('Done.')
    process.exit(0)
}

patch()
