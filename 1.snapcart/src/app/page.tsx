import { auth } from '@/auth'
import AdminDashboard from '@/components/AdminDashboard'
import DeliveryBoy from '@/components/DeliveryBoy'
import EditRoleMobile from '@/components/EditRoleMobile'
import Footer from '@/components/Footer'
import GeoUpdater from '@/components/GeoUpdater'

import Nav from '@/components/Nav'
import UserDashboard from '@/components/UserDashboard'
import prisma from '@/lib/db'


import { redirect } from 'next/navigation'



async function Home(props: {
  searchParams: Promise<{
    q: string
  }>
}) {

  const searchParams = await props.searchParams

  const session = await auth()
  if (!session || !session.user?.email) redirect("/login")
  console.log(session?.user)
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) redirect("/login")

  const inComplete = !user.mobile || !user.role || (!user.mobile && user.role == "user")
  if (inComplete) {
    return <EditRoleMobile />
  }

  const plainUser = JSON.parse(JSON.stringify(user))

  let groceryList: any[] = []

  if (user.role === "user") {
    if (searchParams.q) {
      groceryList = await prisma.grocery.findMany({
        where: {
          OR: [
            { name: { contains: searchParams.q, mode: 'insensitive' } },
            { category: { contains: searchParams.q, mode: 'insensitive' } },
          ]
        }
      })
    } else {
      groceryList = await prisma.grocery.findMany()


    }
  }



  return (
    <>
      <Nav user={plainUser} />
      <GeoUpdater userId={plainUser.id} />
      {user.role == "user" ? (
        <UserDashboard groceryList={groceryList} />
      ) : user.role == "admin" ? (
        <AdminDashboard />
      ) : <DeliveryBoy />}
      <Footer />
    </>
  )
}

export default Home
