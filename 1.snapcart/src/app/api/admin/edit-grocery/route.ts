import { auth } from "@/auth";
import uploadOnCloudinary from "@/lib/cloudinary";
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
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
        const description = formData.get("description") as string | null
        const stockQuantity = formData.get("stockQuantity") ? parseInt(formData.get("stockQuantity") as string) : 0
        const stockUnit = formData.get("stockUnit") as string | null
        const discountPercent = formData.get("discountPercent") ? parseInt(formData.get("discountPercent") as string) : 0
        
        const variantsString = formData.get("variants") as string | null
        let variants = []
        if (variantsString) {
            try { variants = JSON.parse(variantsString) } catch (e) { }
        }

        const file = formData.get("image") as Blob | null
        let imageUrl
        if (file) {
            imageUrl = await uploadOnCloudinary(file)
        }
        
        const dataToUpdate: any = { 
            name, price, category, unit, description, stockQuantity, stockUnit, discountPercent 
        }
        if (imageUrl) dataToUpdate.image = imageUrl

        // Execute as a transaction to ensure variants are safely synced
        const result = await prisma.$transaction(async (tx) => {
            const grocery = await tx.grocery.update({
                where: { id: groceryId },
                data: dataToUpdate
            })

            // Wipe existing variants
            await tx.groceryVariant.deleteMany({
                where: { groceryId }
            })

            // Bulk Insert current valid list
            if (variants && variants.length > 0) {
                const variantData = variants.map((v: any) => ({
                    groceryId: grocery.id,
                    label: v.label,
                    price: Number(v.price),
                    stock: Number(v.stock) || 0
                }))

                await tx.groceryVariant.createMany({
                    data: variantData
                })
            }
            
            return grocery;
        })

        return NextResponse.json(
            result,
            { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: `edit grocery error ${error}` },
            { status: 500 }
        )
    }
}


