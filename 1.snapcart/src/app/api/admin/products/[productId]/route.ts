import { auth } from "@/auth";
import uploadOnCloudinary from "@/lib/cloudinary";
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
    try {
        const { productId } = await params;
        const session = await auth();
        
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
        }

        const formData = await req.formData();
        const name = formData.get("name") as string;
        const category = formData.get("category") as string;
        const unit = formData.get("unit") as string;
        const price = formData.get("price") as string;
        const description = formData.get("description") as string | null;
        const stockQuantity = formData.get("stockQuantity") ? parseInt(formData.get("stockQuantity") as string) : 0;
        const stockUnit = formData.get("stockUnit") as string | null;
        const discountPercent = formData.get("discountPercent") ? parseInt(formData.get("discountPercent") as string) : 0;
        
        const variantsString = formData.get("variants") as string | null;
        let variants = [];
        if (variantsString) {
            try { variants = JSON.parse(variantsString); } catch (e) { console.error("Error parsing variants", e); }
        }

        const file = formData.get("image") as Blob | null;
        let imageUrl;
        if (file) {
            imageUrl = await uploadOnCloudinary(file);
        }
        
        const dataToUpdate: any = { 
            name, price, category, unit, description, stockQuantity, stockUnit, discountPercent 
        };
        if (imageUrl) dataToUpdate.image = imageUrl;

        const result = await prisma.$transaction(async (tx) => {
            const grocery = await tx.grocery.update({
                where: { id: productId },
                data: dataToUpdate
            });

            // Sync Variants
            await tx.groceryVariant.deleteMany({ where: { groceryId: productId } });

            if (variants && variants.length > 0) {
                const variantData = variants.map((v: any) => {
                    const qty = Number(v.stockQuantity || v.stock || 0);
                    let status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
                    if (qty <= 0) status = "OUT_OF_STOCK";
                    else if (qty <= 5) status = "LOW_STOCK";

                    return {
                        groceryId: grocery.id,
                        weightInGrams: v.weightInGrams ? Number(v.weightInGrams) : 0,
                        label: v.label || (v.weightInGrams ? `${v.weightInGrams}g` : ""),
                        price: Number(v.price),
                        stockQuantity: qty,
                        stockStatus: status
                    };
                });

                await tx.groceryVariant.createMany({ data: variantData });
            }
            
            return grocery;
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Edit product error:", error);
        return NextResponse.json({ message: `Internal Server Error: ${error}` }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
    try {
        const { productId } = await params;
        const session = await auth();

        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
        }

        // Delete variants first (though schema has Cascade, defensive check or explicit delete is fine)
        await prisma.grocery.delete({ where: { id: productId } });

        return NextResponse.json({ message: "Product deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Delete product error:", error);
        return NextResponse.json({ message: `Internal Server Error: ${error}` }, { status: 500 });
    }
}
