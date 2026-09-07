const ALIASES: Record<string, string> = {
  "หมูบด": "หมูสับ",
  "ground pork": "หมูสับ",
  "pork mince": "หมูสับ",
  "พริกขี้หนู": "พริกสด",
  "พริกแดง": "พริกสด",
  "chili": "พริกสด",
  "garlic": "กระเทียม",
  "chicken": "ไก่",
  "อกไก่": "ไก่",
  "เนื้อไก่": "ไก่",
  "ไข่ไก่": "ไข่",
  "egg": "ไข่",
  "ซอสถั่วเหลือง": "ซีอิ๊วขาว",
  "soy sauce": "ซีอิ๊วขาว",
  "ข้าว": "ข้าวสาร",
  "rice": "ข้าวสาร",
  "กะเพรา": "ใบกะเพรา",
};

export function normalizeIngredientName(name: string): string {
  const cleaned = name.trim().toLocaleLowerCase("th-TH").replace(/\s+/g, " ");
  return ALIASES[cleaned] ?? cleaned;
}
