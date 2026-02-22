import { auth } from "@/auth";
import uploadOnCloudinary from "@/lib/cloudinary";
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (session?.user?.role !== "admin") {
            return NextResponse.json(
                { message: "you are not admin" },
                { status: 400 }
            )
        }
        const formData = await req.formData()
        const name = formData.get("name") as string
        const groceryId = formData.get("groceryId") as string
        const category = formData.get("category") as string
        const unit = formData.get("unit") as string
        const price = formData.get("price") as string
        const file = formData.get("image") as Blob | null
        let imageUrl
        if (file) {
            imageUrl = await uploadOnCloudinary(file)
        }
        const dataToUpdate: any = { name, price, category, unit }
        if (imageUrl) dataToUpdate.image = imageUrl

        const grocery = await prisma.grocery.update({
            where: { id: groceryId },
            data: dataToUpdate
        })
        return NextResponse.json(
            grocery,
            { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: `edit grocery error ${error}` },
            { status: 500 }
        )
    }
}


