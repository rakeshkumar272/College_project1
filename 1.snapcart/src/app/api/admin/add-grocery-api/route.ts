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
        const category = formData.get("category") as string
        const unit = formData.get("unit") as string // Base unit
        const price = formData.get("price") as string // Base price
        const description = formData.get("description") as string | null
        const stockQuantity = formData.get("stockQuantity") ? parseInt(formData.get("stockQuantity") as string) : 0
        const stockUnit = formData.get("stockUnit") as string | null
        const discountPercent = formData.get("discountPercent") ? parseInt(formData.get("discountPercent") as string) : 0
        const expiryDateStr = formData.get("expiryDate") as string | null
        const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null
        const tagsString = formData.get("tags") as string | null
        let tags: any[] = []
        if (tagsString) {
            try { tags = JSON.parse(tagsString) } catch (e) { }
        }
        const sortOrder = formData.get("sortOrder") ? parseInt(formData.get("sortOrder") as string) : 0

        const variantsString = formData.get("variants") as string | null
        let variants = []
        if (variantsString) {
            try { variants = JSON.parse(variantsString) } catch (e) { }
        }

        const file = formData.get("image") as Blob | null
        let imageUrl = ""
        if (file) {
            imageUrl = await uploadOnCloudinary(file) || ""
        }

        const grocery = await prisma.grocery.create({
            data: { 
                name, 
                price, 
                category, 
                unit, 
                image: imageUrl,
                description,
                stockQuantity,
                stockUnit,
                discountPercent,
                expiryDate,
                tags,
                sortOrder
            }
        })

        if (variants && variants.length > 0) {
            const variantData = variants.map((v: any) => {
                const qty = Number(v.stockQuantity || v.stock || 0);
                let status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
                if (qty <= 0) status = "OUT_OF_STOCK";
                else if (qty <= 5) status = "LOW_STOCK";

                return {
                    groceryId: grocery.id,
                    weightInGrams: v.weightInGrams ? Number(v.weightInGrams) : 0,
                    label: v.weightInGrams ? `${v.weightInGrams}g` : "", // Fallback
                    price: Number(v.price),
                    stockQuantity: qty,
                    stockStatus: status
                };
            })

            await prisma.groceryVariant.createMany({
                data: variantData
            })
        }

        return NextResponse.json(
            { message: "Grocery and variants successfully created", groceryId: grocery.id },
            { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: `add grocery error ${error}` },
            { status: 500 }
        )
    }
}