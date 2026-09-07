"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Check, PackagePlus } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CATEGORY_LABELS, UNIT_LABELS } from "@/constants/kitchen";
import { toIsoDate } from "@/lib/date/week";
import { ingredientCategories, units, type Ingredient, type IngredientDraft } from "@/types/kitchen";

const schema = z.object({
  name: z.string().trim().min(1, "ใส่ชื่อวัตถุดิบก่อนนะ").max(80),
  category: z.enum(ingredientCategories),
  quantity: z.coerce.number().positive("จำนวนต้องมากกว่า 0").max(1_000_000),
  unit: z.string().trim().min(1, "เลือกหรือระบุหน่วย"),
  purchaseDate: z.string().min(1, "เลือกวันที่ซื้อ"),
  expirationDate: z.string().optional(),
  notes: z.string().max(300).optional(),
});

type FormValues = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

function valuesFromIngredient(ingredient?: Ingredient): FormValues {
  return ingredient ? {
    name: ingredient.name,
    category: ingredient.category,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    purchaseDate: ingredient.purchaseDate,
    expirationDate: ingredient.expirationDate ?? "",
    notes: ingredient.notes ?? "",
  } : {
    name: "", category: "vegetables", quantity: 1, unit: "g",
    purchaseDate: toIsoDate(new Date()), expirationDate: "", notes: "",
  };
}

export function IngredientForm({ ingredient, onSubmit, onCancel }: { ingredient?: Ingredient; onSubmit: (draft: IngredientDraft) => void; onCancel: () => void }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema), defaultValues: valuesFromIngredient(ingredient) });
  useEffect(() => reset(valuesFromIngredient(ingredient)), [ingredient, reset]);

  const submit = (values: FormValues) => {
    onSubmit({ ...values, expirationDate: values.expirationDate || undefined, notes: values.notes || undefined });
    if (!ingredient) reset(valuesFromIngredient());
  };

  const fieldClass = "mt-2 h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-foreground outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--primary),transparent_88%)]";
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <div>
        <label className="text-sm font-semibold">ชื่อวัตถุดิบ</label>
        <input {...register("name")} autoFocus placeholder="เช่น หมูสับ, ใบกะเพรา" className={fieldClass} />
        {errors.name && <p className="mt-1.5 text-xs text-danger">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">หมวดหมู่<select {...register("category")} className={fieldClass}>{ingredientCategories.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}</select></label>
        <label className="text-sm font-semibold">หน่วย<input {...register("unit")} list="ingredient-unit-options" placeholder="เลือกหรือพิมพ์หน่วยเอง" className={fieldClass} /><datalist id="ingredient-unit-options">{units.map((unit) => <option key={unit} value={unit}>{UNIT_LABELS[unit]}</option>)}<option value="กำ" /><option value="กล่อง" /></datalist></label>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">จำนวน<input {...register("quantity")} type="number" min="0.001" step="any" inputMode="decimal" className={fieldClass} />{errors.quantity && <span className="mt-1.5 block text-xs text-danger">{errors.quantity.message}</span>}</label>
        <label className="text-sm font-semibold">วันที่ซื้อ<span className="relative block"><input {...register("purchaseDate")} type="date" className={fieldClass} /><Calendar className="pointer-events-none absolute right-4 top-6 text-muted" size={16} /></span></label>
      </div>
      <label className="block text-sm font-semibold">วันหมดอายุ <span className="font-normal text-muted">(ไม่บังคับ)</span><input {...register("expirationDate")} type="date" className={fieldClass} /></label>
      <label className="block text-sm font-semibold">โน้ต <span className="font-normal text-muted">(ไม่บังคับ)</span><textarea {...register("notes")} rows={3} placeholder="เช่น แบ่งแช่แข็งไว้ครึ่งหนึ่ง" className={`${fieldClass} h-auto resize-none py-3`} /></label>
      <div className="flex gap-3 pt-1"><button type="button" onClick={onCancel} className="h-12 flex-1 rounded-2xl bg-[var(--muted-soft)] text-sm font-semibold">ยกเลิก</button><button type="submit" disabled={isSubmitting} className="flex h-12 flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"><span className="grid size-6 place-items-center rounded-full bg-white/15">{ingredient ? <Check size={14} /> : <PackagePlus size={14} />}</span>{ingredient ? "บันทึกการแก้ไข" : "เพิ่มเข้าครัว"}</button></div>
    </form>
  );
}
