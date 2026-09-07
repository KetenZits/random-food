import { AIProviderError, type MealGenerationProvider } from "@/services/ai/provider";
import { generatedMealsResponseSchema, type GeneratedMealsResponse, type MealGenerationInput } from "@/services/ai/schemas";

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

export class GeminiMealProvider implements MealGenerationProvider {
  readonly name = "gemini";
  constructor(private readonly apiKey: string, private readonly model = "gemini-2.5-flash") {}

  async generateMeals(input: MealGenerationInput): Promise<GeneratedMealsResponse> {
    const prompt = [
      "คุณเป็นเชฟอาหารไทยและนักวางแผนลดขยะอาหาร สร้างเมนูที่ทำได้จริงเป็นภาษาไทย",
      `ต้องการ ${input.desiredMeals} เมนู, แนวอาหาร ${input.cuisine}, ยอมให้ขาดวัตถุดิบ ${input.strictness === 99 ? "ไม่จำกัด" : `${input.strictness} อย่าง`}`,
      `วัตถุดิบปัจจุบัน: ${JSON.stringify(input.ingredients)}`,
      `หลีกเลี่ยงเมนูเหล่านี้: ${input.alreadySelectedMeals.join(", ") || "ไม่มี"}`,
      "ให้ความสำคัญกับของใกล้หมดอายุ ปริมาณที่มี ความหลากหลาย และลดของที่ต้องซื้อเพิ่ม",
      "ตอบเป็น JSON เท่านั้นตาม schema ที่กำหนด ห้ามใส่ markdown",
    ].join("\n");
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: .75 },
        }),
        signal: AbortSignal.timeout(18_000),
      });
      if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
      const data = await response.json() as GeminiResponse;
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error("Provider returned an empty response");
      return generatedMealsResponseSchema.parse(JSON.parse(raw) as unknown);
    } catch (error) {
      throw new AIProviderError("ไม่สามารถสร้างเมนูจาก AI ได้", this.name, error);
    }
  }
}
