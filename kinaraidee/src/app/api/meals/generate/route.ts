import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { generateMeals } from "@/services/ai/meal-generator";
import { mealGenerationInputSchema } from "@/services/ai/schemas";

export async function POST(request: Request) {
  try {
    const input = mealGenerationInputSchema.parse(await request.json());
    return NextResponse.json(await generateMeals(input));
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ message: "ข้อมูลสำหรับสร้างเมนูไม่ถูกต้อง", issues: error.issues }, { status: 400 });
    return NextResponse.json({ message: "ครัวยังคิดเมนูไม่ได้ในตอนนี้ ลองอีกครั้งนะ" }, { status: 500 });
  }
}
