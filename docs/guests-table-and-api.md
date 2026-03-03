# ตาราง `guests` และการผูกกับ API

## โครงสร้างตาราง `guests` (จากที่ใช้ในโค้ด)

จาก API ที่เรียกใช้ ตาราง **guests** มีคอลัมน์อย่างน้อย:

| Column      | ใช้ใน API                          |
|------------|-------------------------------------|
| `id`       | uuid (PK), ใช้เป็น foreign key      |
| `user_id`  | uuid (จากภาพที่คุณส่งมา)           |
| `first_name` | varchar, ใช้แสดง Customer name    |
| `last_name`  | varchar                            |
| `email`    | varchar                            |
| `phone`    | varchar                            |

---

## การผูกกับตารางอื่น (จากโค้ด)

### 1. ตาราง **orders**

- **orders.guest_id** → ชี้ไปที่ **guests.id**
- ใช้ใน:
  - **GET /api/admin/orders-list**  
    ดึง orders (status = paid) แล้วเอา `guest_id` ไปดึง guests เพื่อเอา `first_name` มาใส่คอลัมน์ Customer name
  - **GET /api/admin/order-detail?id=xxx**  
    ดึง order แล้วถ้ามี `guest_id` จะไปดึง guest (id, first_name, last_name) เพื่อแสดง customerName

ถ้า **orders.guest_id เป็น null** หน้า Customer Booking จะได้ guest ไม่เจอ จึงแสดง "—" แทนชื่อ

---

## API ที่อ่านจากตาราง `guests`

| API | การใช้งาน |
|-----|------------|
| **GET /api/admin/orders-list** | ดึง orders (paid) แล้วดึง guests ตาม `orders.guest_id` ใช้ `guests.first_name` เป็น Customer name |
| **GET /api/admin/order-detail** | ดึง order ตาม id แล้วถ้ามี `order.guest_id` ไปดึง guest ใช้ first_name + last_name เป็น customerName |

ทั้งสองอันใช้เฉพาะ **อ่าน** จาก `guests` (select) ไม่มี API ในโปรเจกต์นี้ที่ **insert/update** ลงตาราง `guests`

---

## การสร้าง order ในโปรเจกต์ (ทำไม guest_id ถึงไม่ไปผูก)

มี 2 จุดที่เกี่ยวกับการสร้าง order:

### A. Supabase: `/api/booking/create-order.js`

- สร้าง order ใน Supabase ด้วย:
  - `user_id`, `room_id`, `total_price`, `email`, `status`
- **ไม่มี** การส่ง `guest_id` และไม่มี insert ลง `guests`
- ถ้า order ในระบบคุณสร้างจาก API นี้ แถวใน `orders` จะไม่มี `guest_id` → หน้า Customer Booking จึงไม่มี guest ให้ดึงชื่อ

### B. Postgres: `features/orders/` (orderService + orderRepository)

- รับ `guest_id` ใน payload ได้ และ insert ลง orders (Postgres) พร้อม `guest_id`
- แต่ **ไม่มีการสร้างแถวในตาราง guests** ในโค้ดนี้ — แค่รับ `guest_id` มาส่งต่อ

สรุป: ในโค้ดปัจจุบัน **ไม่มี API ที่สร้างแถวในตาราง guests** และ flow สร้าง order หลัก (Supabase create-order) **ไม่ได้ใส่ guest_id** จึงทำให้ชื่อจาก guests ไม่โผล่ในหน้า Customer Booking

---

## สิ่งที่ต้องทำถ้าอยากให้ Customer name จาก guests โผล่

1. **ให้ orders มี guest_id ชี้ไปที่ guests**
   - ถ้าใช้ Supabase สร้าง order: แก้ `/api/booking/create-order.js` ให้รับ `guest_id` (หรือสร้าง guest ก่อนแล้วได้ `guest_id`) แล้วใส่ใน `.insert({ ... guest_id })`
   - หรืออัปเดตแถวในตาราง `orders` ใน Supabase ให้คอลัมน์ `guest_id` ชี้ไปที่ `guests.id` ของแถวที่ต้องการ

2. **สร้าง guest ก่อนสร้าง order (ถ้ายังไม่มี)**
   - เพิ่ม API (หรือ logic ใน flow จองห้อง) ที่:
     - insert ลงตาราง `guests` (เช่น first_name, last_name, email, phone, user_id ถ้ามี)
     - ได้ `id` ของ guest กลับมา แล้วใช้ค่านี้เป็น `guest_id` ตอนสร้าง order

3. **ตรวจใน Supabase**
   - Table **orders**: ดูว่าคอลัมน์ `guest_id` ของแถวที่ status = paid มีค่าหรือ null
   - Table **guests**: ดูว่า `id` ของแถวที่ต้องการ ตรงกับ `orders.guest_id` หรือไม่
