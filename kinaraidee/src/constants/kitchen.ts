import type { IngredientCategory, IngredientDraft, Meal, StandardUnit } from "@/types/kitchen";

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  meat: "เนื้อสัตว์",
  seafood: "อาหารทะเล",
  eggs: "ไข่",
  vegetables: "ผัก",
  fruits: "ผลไม้",
  herbs: "สมุนไพร",
  seasonings: "เครื่องปรุง",
  sauces: "ซอส",
  rice_grains: "ข้าวและธัญพืช",
  noodles: "เส้น",
  dairy: "นมและชีส",
  frozen: "แช่แข็ง",
  other: "อื่น ๆ",
};

export const UNIT_LABELS: Record<StandardUnit, string> = {
  g: "กรัม",
  kg: "กิโลกรัม",
  ml: "มิลลิลิตร",
  L: "ลิตร",
  piece: "ชิ้น",
  egg: "ฟอง",
  pack: "แพ็ก",
  bottle: "ขวด",
  bag: "ถุง",
  tbsp: "ช้อนโต๊ะ",
  tsp: "ช้อนชา",
};

export const DAY_NAMES = [
  { short: "จ.", thai: "จันทร์", english: "MONDAY" },
  { short: "อ.", thai: "อังคาร", english: "TUESDAY" },
  { short: "พ.", thai: "พุธ", english: "WEDNESDAY" },
  { short: "พฤ.", thai: "พฤหัสบดี", english: "THURSDAY" },
  { short: "ศ.", thai: "ศุกร์", english: "FRIDAY" },
  { short: "ส.", thai: "เสาร์", english: "SATURDAY" },
  { short: "อา.", thai: "อาทิตย์", english: "SUNDAY" },
] as const;

export const SLOT_LABELS: Record<1 | 2 | 3, string[]> = {
  1: ["มื้อหลัก"],
  2: ["มื้อกลางวัน", "มื้อเย็น"],
  3: ["มื้อเช้า", "มื้อกลางวัน", "มื้อเย็น"],
};

export const SEED_INGREDIENTS: IngredientDraft[] = [
  { name: "หมูสับ", category: "meat", quantity: 500, unit: "g", purchaseDate: "2026-09-05", expirationDate: "2026-09-08" },
  { name: "อกไก่", category: "meat", quantity: 650, unit: "g", purchaseDate: "2026-09-05", expirationDate: "2026-09-10" },
  { name: "ไข่ไก่", category: "eggs", quantity: 10, unit: "egg", purchaseDate: "2026-09-02", expirationDate: "2026-09-18" },
  { name: "กระเทียม", category: "herbs", quantity: 180, unit: "g", purchaseDate: "2026-09-01" },
  { name: "พริกสด", category: "herbs", quantity: 90, unit: "g", purchaseDate: "2026-09-04", expirationDate: "2026-09-09" },
  { name: "ใบกะเพรา", category: "herbs", quantity: 80, unit: "g", purchaseDate: "2026-09-06", expirationDate: "2026-09-07" },
  { name: "ข้าวสาร", category: "rice_grains", quantity: 3, unit: "kg", purchaseDate: "2026-08-20" },
  { name: "น้ำปลา", category: "sauces", quantity: 1, unit: "bottle", purchaseDate: "2026-07-12" },
  { name: "ซีอิ๊วขาว", category: "sauces", quantity: 1, unit: "bottle", purchaseDate: "2026-08-04" },
  { name: "ผักกาดขาว", category: "vegetables", quantity: 450, unit: "g", purchaseDate: "2026-09-05", expirationDate: "2026-09-08" },
  { name: "ต้นหอม", category: "herbs", quantity: 90, unit: "g", purchaseDate: "2026-09-05", expirationDate: "2026-09-09" },
  { name: "เต้าหู้ไข่", category: "other", quantity: 2, unit: "piece", purchaseDate: "2026-09-04", expirationDate: "2026-09-11" },
];

const r = (name: string, quantity: number, unit: string, normalizedName = name, optional = false) => ({
  name,
  normalizedName,
  quantity,
  unit,
  optional,
});

export const MEAL_CATALOG: Meal[] = [
  {
    id: "pad-krapao-pork",
    name: "ผัดกะเพราหมูสับ",
    description: "กะเพราหอมฉุนกับหมูสับรสจัด เป็นมื้อไวที่ใช้ของในครัวได้คุ้ม",
    cuisine: "thai", mealType: "main", difficulty: "easy", cookingTimeMinutes: 15,
    ingredients: [r("หมูสับ", 200, "g"), r("ใบกะเพรา", 30, "g"), r("พริกสด", 10, "g"), r("กระเทียม", 12, "g"), r("น้ำปลา", 1, "tbsp", "น้ำปลา", true)],
    steps: ["โขลกพริกกับกระเทียมพอหยาบ", "ผัดเครื่องโขลกจนหอม แล้วใส่หมูสับ", "ปรุงรสและผัดจนหมูสุก", "ใส่ใบกะเพรา เร่งไฟ แล้วปิดเตา"],
    tags: ["รสจัด", "จานด่วน"], imageTone: "#b85c38", source: "curated",
  },
  {
    id: "chicken-fried-rice", name: "ข้าวผัดไก่", description: "ข้าวผัดหอมกระทะ เนื้อไก่นุ่มและไข่เคลือบข้าวทุกเม็ด",
    cuisine: "thai", mealType: "main", difficulty: "easy", cookingTimeMinutes: 20,
    ingredients: [r("ข้าวสาร", 120, "g"), r("อกไก่", 150, "g", "ไก่"), r("ไข่ไก่", 1, "egg", "ไข่"), r("กระเทียม", 8, "g"), r("ต้นหอม", 15, "g"), r("ซีอิ๊วขาว", 1, "tbsp", "ซีอิ๊วขาว", true)],
    steps: ["หุงข้าวให้เม็ดร่วนและพักให้คลายร้อน", "ผัดกระเทียมกับไก่จนเกือบสุก", "ตอกไข่ ยีให้กระจาย แล้วใส่ข้าว", "ปรุงรสและโรยต้นหอม"],
    tags: ["อิ่มง่าย", "เด็กกินได้"], imageTone: "#d49235", source: "curated",
  },
  {
    id: "minced-pork-omelette", name: "ไข่เจียวหมูสับ", description: "ไข่เจียวฟูขอบกรอบ ใส่หมูสับแน่น ๆ กินกับข้าวร้อน",
    cuisine: "thai", mealType: "main", difficulty: "easy", cookingTimeMinutes: 12,
    ingredients: [r("ไข่ไก่", 3, "egg", "ไข่"), r("หมูสับ", 100, "g"), r("น้ำปลา", 1, "tsp", "น้ำปลา", true)],
    steps: ["ตีไข่กับน้ำปลาให้เกิดฟอง", "ใส่หมูสับแล้วตีให้กระจาย", "เทลงน้ำมันร้อน ทอดจนเหลืองทั้งสองด้าน"],
    tags: ["ทำไว", "ของน้อย"], imageTone: "#e0a72e", source: "curated",
  },
  {
    id: "clear-soup-tofu-pork", name: "ต้มจืดเต้าหู้หมูสับ", description: "ซุปรสนุ่มสบายท้อง มีผัก เต้าหู้ และหมูสับครบในชามเดียว",
    cuisine: "thai", mealType: "light", difficulty: "easy", cookingTimeMinutes: 25,
    ingredients: [r("หมูสับ", 150, "g"), r("เต้าหู้ไข่", 1, "piece"), r("ผักกาดขาว", 200, "g"), r("กระเทียม", 5, "g"), r("ต้นหอม", 10, "g"), r("ซีอิ๊วขาว", 1, "tbsp", "ซีอิ๊วขาว", true)],
    steps: ["หมักหมูสับกับซีอิ๊วเล็กน้อย", "ต้มน้ำซุปแล้วปั้นหมูลงต้ม", "ใส่ผักกาดขาวและเต้าหู้", "ปรุงรส โรยต้นหอมแล้วปิดไฟ"],
    tags: ["ซุปร้อน", "สบายท้อง"], imageTone: "#6d9d6c", source: "curated",
  },
  {
    id: "garlic-chicken", name: "ไก่กระเทียม", description: "ไก่ผัดกระเทียมหอม ๆ รสกลมกล่อม กินง่ายทุกวัย",
    cuisine: "thai", mealType: "main", difficulty: "easy", cookingTimeMinutes: 18,
    ingredients: [r("อกไก่", 200, "g", "ไก่"), r("กระเทียม", 20, "g"), r("ซีอิ๊วขาว", 1, "tbsp", "ซีอิ๊วขาว", true), r("พริกไทย", 1, "tsp", "พริกไทย", true)],
    steps: ["หั่นไก่ชิ้นพอดีคำ", "เจียวกระเทียมครึ่งหนึ่งให้กรอบแล้วพัก", "ผัดไก่กับกระเทียมที่เหลือ", "ปรุงรสและโรยกระเทียมเจียว"],
    tags: ["ไม่เผ็ด", "โปรตีนสูง"], imageTone: "#aa7047", source: "curated",
  },
  {
    id: "spicy-chicken-basil", name: "ผัดกะเพราไก่", description: "กะเพราไก่รสถึงเครื่อง ใช้เวลาน้อยแต่หอมไปทั้งครัว",
    cuisine: "thai", mealType: "main", difficulty: "easy", cookingTimeMinutes: 15,
    ingredients: [r("อกไก่", 200, "g", "ไก่"), r("ใบกะเพรา", 30, "g"), r("พริกสด", 12, "g"), r("กระเทียม", 12, "g"), r("น้ำปลา", 1, "tbsp", "น้ำปลา", true)],
    steps: ["สับไก่และโขลกพริกกระเทียม", "ผัดพริกกระเทียมให้หอม", "ใส่ไก่และปรุงรส", "ใส่กะเพราแล้วคลุกเร็ว ๆ"],
    tags: ["รสจัด", "โปรตีนสูง"], imageTone: "#9d4d38", source: "curated",
  },
  {
    id: "egg-fried-rice", name: "ข้าวผัดไข่", description: "ข้าวผัดเรียบง่าย กลิ่นกระทะชัดและทำได้ในวันของเหลือน้อย",
    cuisine: "thai", mealType: "main", difficulty: "easy", cookingTimeMinutes: 12,
    ingredients: [r("ข้าวสาร", 120, "g"), r("ไข่ไก่", 2, "egg", "ไข่"), r("กระเทียม", 6, "g"), r("ต้นหอม", 12, "g"), r("ซีอิ๊วขาว", 1, "tbsp", "ซีอิ๊วขาว", true)],
    steps: ["หุงข้าวแล้วพักให้คลายร้อน", "ผัดกระเทียมและตอกไข่ลงยี", "ใส่ข้าว ปรุงรส และผัดไฟแรง", "โรยต้นหอม"],
    tags: ["ทำไว", "ประหยัด"], imageTone: "#ce9d38", source: "curated",
  },
  {
    id: "suki-dry", name: "สุกี้แห้งไก่", description: "ผักฉ่ำ ๆ กับไก่นุ่ม ผัดน้ำจิ้มสุกี้จนหอมกระทะ",
    cuisine: "thai", mealType: "main", difficulty: "medium", cookingTimeMinutes: 25,
    ingredients: [r("อกไก่", 150, "g", "ไก่"), r("ผักกาดขาว", 180, "g"), r("ไข่ไก่", 1, "egg", "ไข่"), r("วุ้นเส้น", 80, "g"), r("น้ำจิ้มสุกี้", 2, "tbsp")],
    steps: ["แช่วุ้นเส้นให้นุ่ม", "ผัดไก่ให้สุก ตามด้วยไข่", "ใส่ผักและวุ้นเส้น", "เติมน้ำจิ้มสุกี้แล้วผัดให้แห้ง"],
    tags: ["ผักเยอะ", "จานเดียว"], imageTone: "#cc6c45", source: "curated",
  },
  {
    id: "rice-porridge-pork", name: "ข้าวต้มหมูสับ", description: "ข้าวต้มร้อน ๆ หมูนุ่ม โรยกระเทียมและต้นหอม เหมาะกับมื้อเบา",
    cuisine: "thai", mealType: "breakfast", difficulty: "easy", cookingTimeMinutes: 25,
    ingredients: [r("ข้าวสาร", 80, "g"), r("หมูสับ", 120, "g"), r("กระเทียม", 8, "g"), r("ต้นหอม", 12, "g"), r("ซีอิ๊วขาว", 1, "tbsp", "ซีอิ๊วขาว", true)],
    steps: ["ต้มข้าวกับน้ำจนเม็ดบาน", "ปรุงหมูสับและปั้นเป็นก้อน", "ใส่หมูลงต้มจนสุก", "ปรุงรส โรยต้นหอมและกระเทียม"],
    tags: ["มื้อเช้า", "สบายท้อง"], imageTone: "#809b70", source: "curated",
  },
  {
    id: "chili-fish-sauce-eggs", name: "ไข่ดาวพริกน้ำปลา", description: "เมนูช่วยชีวิต ไข่ดาวขอบกรอบกับพริกน้ำปลารสเปรี้ยวเค็ม",
    cuisine: "thai", mealType: "main", difficulty: "easy", cookingTimeMinutes: 10,
    ingredients: [r("ไข่ไก่", 2, "egg", "ไข่"), r("พริกสด", 5, "g"), r("น้ำปลา", 1, "tbsp", "น้ำปลา"), r("มะนาว", 1, "piece")],
    steps: ["ทอดไข่ดาวให้ได้ความสุกที่ชอบ", "ซอยพริกและหอมแดง", "ผสมน้ำปลา มะนาว และพริก", "ราดหรือเสิร์ฟคู่ไข่ดาว"],
    tags: ["10 นาที", "ของน้อย"], imageTone: "#dc8e31", source: "curated",
  },
  {
    id: "stir-fried-cabbage-pork", name: "ผัดผักกาดขาวหมูสับ", description: "ผักกาดขาวหวานฉ่ำผัดกับหมูสับ เป็นกับข้าวง่ายที่ใช้ผักได้เยอะ",
    cuisine: "thai", mealType: "main", difficulty: "easy", cookingTimeMinutes: 15,
    ingredients: [r("ผักกาดขาว", 250, "g"), r("หมูสับ", 120, "g"), r("กระเทียม", 10, "g"), r("ซีอิ๊วขาว", 1, "tbsp", "ซีอิ๊วขาว", true)],
    steps: ["หั่นผักและสับกระเทียม", "ผัดกระเทียมกับหมูจนสุก", "ใส่ผักกาดขาวและปรุงรส", "ผัดไฟแรงจนผักสลดแต่ยังกรอบ"],
    tags: ["ผักเยอะ", "ทำไว"], imageTone: "#6f9e68", source: "curated",
  },
  {
    id: "thai-omelette", name: "ไข่เจียวต้นหอม", description: "ไข่เจียวหอมฟูใส่ต้นหอม เมนูง่ายที่พร้อมเสมอ",
    cuisine: "thai", mealType: "breakfast", difficulty: "easy", cookingTimeMinutes: 8,
    ingredients: [r("ไข่ไก่", 3, "egg", "ไข่"), r("ต้นหอม", 15, "g"), r("น้ำปลา", 1, "tsp", "น้ำปลา", true)],
    steps: ["ซอยต้นหอม", "ตีไข่กับน้ำปลาให้เข้ากัน", "ใส่ต้นหอมแล้วเทลงทอดในน้ำมันร้อน", "กลับด้านและทอดจนเหลือง"],
    tags: ["8 นาที", "มื้อเช้า"], imageTone: "#e3ad38", source: "curated",
  },
];
