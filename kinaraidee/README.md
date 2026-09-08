# กินไรดี (Kin Rai Dee)

ผู้ช่วยครัวส่วนตัวที่ตอบคำถามว่า “ของที่มี เอาไปทำอะไรกินดี?” จัดการวัตถุดิบ คำนวณปริมาณจริง เตือนของใกล้หมดอายุ และสร้างแผนอาหารไทยตั้งแต่วันจันทร์ถึงอาทิตย์

## ฟีเจอร์ที่พร้อมใช้

- คลังวัตถุดิบ: เพิ่ม แก้ ลบ ค้นหา กรอง เรียง ปรับจำนวน และทำเครื่องหมายว่าหมดแล้ว
- หน่วยมาตรฐานและหน่วยกำหนดเอง พร้อมแปลง `kg ↔ g` และ `L ↔ ml`
- สถานะหมดอายุวันนี้, ภายใน 3 วัน และเลยกำหนด โดยไม่ลบข้อมูลอัตโนมัติ
- แผน 7 วัน เลือก 1–3 มื้อต่อวัน เลือกวัน/วันทำงาน/สุดสัปดาห์ และเลื่อนสัปดาห์ได้
- Weighted randomizer ที่คำนึงถึง match score, วันหมดอายุ, ความหลากหลาย, รายการโปรด และประวัติล่าสุด
- ประสบการณ์สุ่มด้วย React Three Fiber ซึ่งตอบสนองต่อสถานะการสุ่มจริง พร้อมลดรายละเอียดบนมือถือและ reduced motion
- Preview ก่อนบันทึก, ล็อกเมนู, สุ่มใหม่เฉพาะมื้อ, เพิ่มเมนูเอง และสร้างสูตรส่วนตัว
- รายละเอียดสูตร ปริมาณที่มี/ที่ขาด ขั้นตอนทำ และยืนยันการใช้วัตถุดิบ
- การหักสต็อกแบบไม่ติดลบ พร้อม transaction audit และประวัติมื้ออาหาร
- เมนูโปรดและธีม 8 แบบ รวมถึงสี/พื้นหลัง/การ์ดแบบกำหนดเอง
- AI provider layer ที่ตรวจ JSON ด้วย Zod และ fallback ไปยังชุดเมนูไทย curated เมื่อไม่ได้ตั้งค่า API

## เริ่มใช้งาน

```bash
npm install
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) แอปมีข้อมูลตัวอย่างและบันทึกลง `localStorage` อัตโนมัติ จึงทดลองทุก flow ได้ทันทีโดยไม่ต้องมีบัญชีหรือ cloud project

ตรวจคุณภาพด้วย:

```bash
npm run lint
npm run typecheck
npm run build
```

## Supabase

1. สร้าง Supabase project
2. รัน migration ใน `supabase/migrations/202609060001_initial_schema.sql` ที่ SQL Editor
3. คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ค่าจริง โดย `NEXT_PUBLIC_SUPABASE_URL` ต้องเป็น `https://xxxxx.supabase.co` ห้ามมี `/rest/v1/`
4. เก็บ `SUPABASE_SERVICE_ROLE_KEY` ไว้ฝั่ง server เท่านั้น ห้ามใช้ตัวแปร `NEXT_PUBLIC_` กับคีย์นี้

Schema เปิด RLS ทุกตารางโดยไม่เปิด anonymous policies และมี RPC `consume_planned_meal` สำหรับล็อกแถว หักปริมาณ และเขียน history/transaction ในฐานข้อมูล transaction เดียว โครงสร้างนี้ตั้งใจให้เพิ่ม authentication และ `user_id` ได้ภายหลังโดยไม่ต้องแก้ business model หลัก

แอปใช้ local-first persistence เพื่อให้ทำงานได้แม้เน็ตหลุดหรือยังไม่ได้ตั้งค่า Supabase เมื่อ server มี URL และ `SUPABASE_SERVICE_ROLE_KEY` ระบบจะโหลดและซิงก์ข้อมูลกับตาราง relational อัตโนมัติผ่าน `/api/kitchen`; คีย์ service role อยู่ใน server-only module และไม่ถูกส่งเข้า browser

เส้นทาง cloud sync ออกแบบสำหรับ deployment ส่วนตัวและตรวจ same-site request หากจะเปิดแอปสู่สาธารณะ ควรเพิ่ม Supabase Auth และผูกทุกตารางด้วย `user_id` ก่อน ตามคำแนะนำใน migration

## Deploy บน Vercel (ใช้คนเดียว)

แอปอยู่โฟลเดอร์ `kinaraidee/` ดังนั้นตอน Import GitHub repo ให้ตั้ง **Root Directory** เป็น `kinaraidee`

ใส่ Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY` และ `GEMINI_MODEL` (ไม่บังคับ)

จากนั้นเปิด **Deployment Protection** (Password หรือ Vercel Authentication) เพราะ API ซิงก์ครัวด้วย service role ไม่มีระบบ login

อย่า commit ไฟล์ `.env.local` — ไฟล์นี้ถูก gitignore ไว้แล้ว

## AI meal generation

ตั้งค่า `GEMINI_API_KEY` เพื่อเปิดใช้ Gemini ผ่าน provider ที่ `src/services/ai/` โดย Route Handler `/api/meals/generate` จะ:

1. ตรวจ request ด้วย Zod
2. ขอ structured JSON จาก provider
3. ตรวจ response อีกครั้งก่อนนำไปใช้
4. fallback ไปยังเมนูไทย curated อย่างปลอดภัยเมื่อ provider ใช้งานไม่ได้

การจัดอันดับและ match score ฝั่งแอปไม่เชื่อคะแนนจาก AI แต่คำนวณซ้ำจากชื่อวัตถุดิบที่ normalize แล้ว ปริมาณจริง ของที่ขาด และวันหมดอายุ

## โครงสร้างสำคัญ

```text
src/
  app/                 routes, metadata, loading/error UI, API
  components/          layout, ingredients, meals, planner, Three.js, settings
  features/            kitchen state and meal matching rules
  lib/                 dates, units, normalization, typed Supabase client
  services/ai/         provider abstraction and validated implementations
  types/               strict domain types
supabase/migrations/    PostgreSQL schema and atomic consumption RPC
```
