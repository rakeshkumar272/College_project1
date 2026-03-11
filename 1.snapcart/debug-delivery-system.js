const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const prisma = new PrismaClient()

async function debug() {
    let output = '--- SYSTEM STATE DEBUG ---\n'

    const rock = await prisma.user.findFirst({
        where: { name: { contains: 'rock', mode: 'insensitive' } }
    })
    if (rock) {
        output += 'ROCK: id=' + rock.id + '\n'
        output += 'ROCK: Online=' + rock.isOnline + '\n'
        output += 'ROCK: Lat=' + rock.latitude + '\n'
        output += 'ROCK: Lon=' + rock.longitude + '\n'
        output += 'ROCK: Socket=' + rock.socketId + '\n'
    } else {
        output += 'ROCK NOT FOUND\n'
    }

    const latestOrder = await prisma.order.findFirst({
        include: { assignment: { include: { broadcastedTo: true } } },
        orderBy: { createdAt: 'desc' }
    })
    if (latestOrder) {
        output += 'LATEST ORDER: ID=' + latestOrder.id + ' (#' + latestOrder.id.slice(-6) + ')\n'
        output += 'LATEST ORDER: Lat=' + latestOrder.addressLatitude + '\n'
        output += 'LATEST ORDER: Lon=' + latestOrder.addressLongitude + '\n'
        output += 'LATEST ORDER: Status=' + latestOrder.status + '\n'
        if (latestOrder.assignment) {
            output += 'ASSIGNMENT: Status=' + latestOrder.assignment.status + '\n'
            output += 'ASSIGNMENT: BroadcastedTo count=' + latestOrder.assignment.broadcastedTo.length + '\n'
            latestOrder.assignment.broadcastedTo.forEach(u => {
                output += ' - Broadcasted to User: ' + u.name + ' (ID: ' + u.id + ')\n'
            })
        }
    }

    fs.writeFileSync('debug_results.txt', output)
    process.exit(0)
}

debug()
