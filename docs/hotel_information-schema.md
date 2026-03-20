# ตาราง `hotel_information` — สรุป column และการผูกกับโค้ด

เอกสารนี้สรุปจากโค้ดในโปรเจกต์ (ไม่ได้ query DB จริง) ใช้สำหรับเช็คว่าตารางใน Supabase ควรมี column อะไร และแต่ละฟิลด์ในแอปผูกกับ column ไหน

---

## 1. Column ที่โค้ดใช้ (ต้องมีในตาราง)

| ลำดับ | Column ใน DB (ชื่อจริง) | ประเภท (ตามที่โค้ดใช้) | ใช้ในแอป |
|------|-------------------------|-------------------------|-----------|
| 1 | `uuid` | uuid (PK) | ใช้สำหรับอัปเดต/ลบแถว |
| 2 | `hotel_name` | text | ชื่อโรงแรม (Admin, Hero About, Footer) |
| 3 | `hotel_description` | text | คำอธิบายโรงแรม (Admin, Hero About) |
| 4 | `hotel_logo_url` | text, nullable | โลโก้หลัก |
| 5 | `hotel_logo_footter_url` | text, nullable | โลโก้ในฟุตเตอร์ (สะกด "footter" ใน DB) |
| 6 | `hotel_bg_url` | text, nullable | รูปพื้นหลัง Hero (landing) |
| 7 | `hotel_phone` | text, nullable | เบอร์โทร (Footer, Admin) |
| 8 | `hotel_email` | text, nullable | อีเมล (Footer, Admin) |
| 9 | `hotel_location` | text, nullable | ที่อยู่ (Footer, Admin) |
| 10 | `hotel_main_text` | text, nullable | ข้อความบนรูป Hero (Admin textarea, HeroSearch) |
| 11 | `hotel_footter_description` | text, nullable | ข้อความใต้โลโก้ในฟุตเตอร์ (สะกด "footter" ใน DB) |
| 12 | `created_at` | timestamptz, optional | ใช้ตอน INSERT |
| 13 | `update_at` | timestamptz, optional | ใช้ตอน UPDATE |

---

## 2. การผูก API ↔ Column ใน DB

- **Request body (จากฟอร์ม Admin)** ใช้ camelCase → API แปลงเป็น snake_case ก่อนเขียน DB

| ชื่อใน Request/Response (camelCase) | Column ใน DB (snake_case) |
|-------------------------------------|----------------------------|
| `hotelName` | `hotel_name` |
| `hotelDescription` | `hotel_description` |
| `hotelLogoUrl` | `hotel_logo_url` |
| `hotelLogoFooterUrl` | `hotel_logo_footter_url` |
| `hotelBgUrl` | `hotel_bg_url` |
| `hotelPhone` | `hotel_phone` |
| `hotelEmail` | `hotel_email` |
| `hotelLocation` | `hotel_location` |
| `hotelMainText` | `hotel_main_text` |
| `hotelFooterDescription` | `hotel_footter_description` |

- **ข้อความ Hero (textarea ใน Admin)**  
  - ฟิลด์ "ข้อความบนรูป Hero — Desktop" → state `hotelMainText` → ส่งเป็น `hotelMainText` ใน body → API แปลงเป็น `hotel_main_text` ตอน PUT  
  - ถ้าตารางไม่มี column `hotel_main_text` การอัปเดตจะล้มเหลว (หรือเดิมจะ fallback แล้วไม่บันทึกฟิลด์นี้) ตอนนี้แก้ให้ return 400 + SQL ให้รันเพิ่ม column แล้วกดอัปเดตใหม่

---

## 3. จุดในแอปที่ใช้ข้อมูลจากตาราง

| หน้า/คอมโพเนนต์ | Column ที่ใช้ |
|------------------|----------------|
| **HeroSearch** (landing) | `hotel_main_text`, `hotel_bg_url` |
| **Footer** | `hotel_phone`, `hotel_email`, `hotel_location`, `hotel_footter_description`, โลโก้จาก `hotel_logo_footter_url` / `hotel_logo_url` |
| **Hero About** | `hotel_name`, `hotel_description` |
| **Admin → Hotel Information** | ทุก column ด้านบน (รวมถึง `hotel_main_text`, `hotel_footter_description`) |

---

## 4. เช็คใน Supabase ว่าตารางมี column อะไรบ้าง

ใน **Supabase → SQL Editor** รัน:

```sql
-- ดู column ทั้งหมดของตาราง hotel_information
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'hotel_information'
ORDER BY ordinal_position;
```

หรือดูข้อมูลแถวแรก (จะเห็นเฉพาะ column ที่มีอยู่):

```sql
SELECT * FROM hotel_information LIMIT 1;
```

---

## 5. SQL สำหรับเพิ่ม column ที่อาจยังไม่มี

ถ้ายังไม่มี column ด้านล่าง ให้รันใน **Supabase → SQL Editor**:

```sql
ALTER TABLE hotel_information
  ADD COLUMN IF NOT EXISTS hotel_phone text,
  ADD COLUMN IF NOT EXISTS hotel_email text,
  ADD COLUMN IF NOT EXISTS hotel_location text,
  ADD COLUMN IF NOT EXISTS hotel_main_text text,
  ADD COLUMN IF NOT EXISTS hotel_footter_description text;
```

(ถ้ามี column อยู่แล้ว `ADD COLUMN IF NOT EXISTS` จะไม่ error)

---

## 6. สรุป: ที่ให้ทำไปผูกกับ column ในตารางมั้ย

- **ผูกครบแล้ว**  
  ฟิลด์ "ข้อความบนรูป Hero — Desktop" ใน Admin → state `hotelMainText` → API ส่งเป็น `hotel_main_text` ตอน PUT/GET  
  ฟิลด์อื่นในฟอร์ม (ชื่อ, คำอธิบาย, โทร/อีเมล/ที่อยู่, footer description, ฯลฯ) ก็ผูกกับ column ตามตารางด้านบนครบ  
- **เงื่อนไข**  
  ตาราง `hotel_information` ต้องมี column เหล่านั้นจริง ถ้าไม่มี (เช่น ไม่มี `hotel_main_text`) ต้องรัน SQL ในข้อ 5 ก่อน แล้วค่อยกดอัปเดตใน Admin อีกครั้ง
