# Postman Testing Guide

คู่มือการทดสอบ API endpoints ด้วย Postman

## Base URL

```
http://localhost:3000
```

## 1. Register (สมัครสมาชิก)

### Endpoint
```
POST /api/register
```

### Headers
```
Content-Type: application/json
```

### Body (JSON)
```json
{
  "email": "test@example.com",
  "password": "SecurePassword123!",
  "firstName": "สมชาย",
  "lastName": "ใจดี",
  "username": "somchai123",
  "phoneNumber": "0812345678",
  "dateOfBirth": "1990-01-15",
  "province": "Bangkok",
  "profilePictureUrl": "https://example.com/profile.jpg"
}
```

### Expected Response (201)
```json
{
  "message": "สมัครสมาชิกสำเร็จ",
  "user": {
    "id": "uuid-here",
    "username": "somchai123",
    "first_name": "สมชาย",
    "last_name": "ใจดี",
    "email": "test@example.com",
    "role": "user",
    "created_at": "2026-02-19T..."
  }
}
```

### Error Responses
- **400**: Validation error หรือข้อมูลซ้ำ
- **500**: Server error

---

## 2. Login (เข้าสู่ระบบ)

### Endpoint
```
POST /api/login
```

### Headers
```
Content-Type: application/json
```

### Body (JSON)
```json
{
  "email": "test@example.com",
  "password": "SecurePassword123!"
}
```

### Expected Response (200)
```json
{
  "message": "เข้าสู่ระบบสำเร็จ",
  "user": {
    "id": "uuid-here",
    "username": "somchai123",
    "first_name": "สมชาย",
    "last_name": "ใจดี",
    "email": "test@example.com",
    "role": "user",
    "profile_image_url": "https://example.com/profile.jpg"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "v1.xxx...",
    "expires_at": 1234567890
  }
}
```

### Error Responses
- **400**: Validation error
- **401**: อีเมลหรือรหัสผ่านไม่ถูกต้อง
- **404**: ไม่พบข้อมูลผู้ใช้
- **500**: Server error

### หมายเหตุ
- **บันทึก `access_token`** จาก response เพื่อใช้ใน API อื่นๆ
- ใช้ `access_token` ใน Authorization header สำหรับ authenticated requests

---

## 3. Get Current User (ดึงข้อมูล User ปัจจุบัน)

### Endpoint
```
GET /api/user/me
```

### Headers
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Example Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cmx2amF3cmNreXZndHJicnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NjQxNzIsImV4cCI6MjA4NzA0MDE3Mn0.5bO3YWlewe84YM5L3TQW1ynqX29KjwtZwTltJN7SOM4
```

### Body
ไม่ต้องส่ง body

### Expected Response (200)
```json
{
  "user": {
    "id": "uuid-here",
    "username": "somchai123",
    "first_name": "สมชาย",
    "last_name": "ใจดี",
    "email": "test@example.com",
    "role": "user",
    "profile_image_url": "https://example.com/profile.jpg",
    "created_at": "2026-02-19T...",
    "updated_at": "2026-02-19T..."
  }
}
```

### Error Responses
- **401**: ไม่พบ access token หรือ token ไม่ถูกต้อง
- **404**: ไม่พบข้อมูลผู้ใช้
- **500**: Server error

---

## 4. Logout (ออกจากระบบ)

### Endpoint
```
POST /api/logout
```

### Headers
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Body (JSON) - Optional
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

หรือส่งผ่าน Authorization header ก็ได้

### Expected Response (200)
```json
{
  "message": "ออกจากระบบสำเร็จ"
}
```

### Error Responses
- **401**: ไม่พบ access token
- **500**: Server error

### หมายเหตุ
- Supabase จัดการ session บน client-side
- API นี้จะ verify token และ return success
- Client ควรเรียก `supabase.auth.signOut()` จาก client-side ด้วย

---

## Postman Collection Setup

### 1. สร้าง Environment Variables

สร้าง Environment ใน Postman และตั้งค่า:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `http://localhost:3000` | `http://localhost:3000` |
| `access_token` | (empty) | (จะถูก set อัตโนมัติจาก login response) |

### 2. สร้าง Pre-request Script สำหรับ Login

ใน Login request → Pre-request Script:
```javascript
// Clear previous token
pm.environment.set("access_token", "");
```

### 3. สร้าง Tests Script สำหรับ Login

ใน Login request → Tests:
```javascript
// Save access token to environment variable
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.session && response.session.access_token) {
        pm.environment.set("access_token", response.session.access_token);
        console.log("Access token saved:", response.session.access_token);
    }
}
```

### 4. ตั้งค่า Authorization Header อัตโนมัติ

สำหรับ requests ที่ต้องการ authentication (เช่น `/api/user/me`, `/api/logout`):

1. ไปที่ **Authorization** tab
2. เลือก Type: **Bearer Token**
3. ใน Token field: `{{access_token}}`

หรือตั้งค่าใน Headers:
```
Authorization: Bearer {{access_token}}
```

---

## Testing Flow

### Flow 1: Register → Login → Get Me → Logout

1. **Register**
   - POST `/api/register`
   - ตรวจสอบ response มี user data

2. **Login**
   - POST `/api/login`
   - ตรวจสอบ response มี `access_token`
   - บันทึก `access_token` ใน environment variable

3. **Get Current User**
   - GET `/api/user/me`
   - ใช้ `access_token` ใน Authorization header
   - ตรวจสอบ response มี user data

4. **Logout**
   - POST `/api/logout`
   - ใช้ `access_token` ใน Authorization header
   - ตรวจสอบ response success

### Flow 2: Test Error Cases

1. **Register with duplicate email**
   - POST `/api/register` ด้วย email ที่มีอยู่แล้ว
   - ควรได้ error 400

2. **Login with wrong password**
   - POST `/api/login` ด้วย password ผิด
   - ควรได้ error 401

3. **Get Me without token**
   - GET `/api/user/me` โดยไม่ส่ง Authorization header
   - ควรได้ error 401

4. **Get Me with invalid token**
   - GET `/api/user/me` ด้วย token ที่ไม่ถูกต้อง
   - ควรได้ error 401

---

## Quick Test Commands (cURL)

### Register
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "username": "somchai123",
    "phoneNumber": "0812345678",
    "dateOfBirth": "1990-01-15",
    "province": "Bangkok"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

### Get Current User (replace YOUR_ACCESS_TOKEN)
```bash
curl -X GET http://localhost:3000/api/user/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Logout (replace YOUR_ACCESS_TOKEN)
```bash
curl -X POST http://localhost:3000/api/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

---

## API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/register` | สมัครสมาชิก | ❌ |
| POST | `/api/login` | เข้าสู่ระบบ | ❌ |
| GET | `/api/user/me` | ดึงข้อมูล user ปัจจุบัน | ✅ |
| POST | `/api/logout` | ออกจากระบบ | ✅ |

---

## Troubleshooting

### Error: "permission denied for schema public"
- ตรวจสอบว่าได้ตั้งค่า `SUPABASE_SERVICE_ROLE_KEY` ใน `.env` แล้ว
- Restart development server

### Error: "ไม่พบ access token"
- ตรวจสอบว่าได้ส่ง Authorization header ในรูปแบบ `Bearer {token}`
- หรือส่ง `accessToken` ใน request body

### Error: "ไม่สามารถเข้าสู่ระบบได้"
- ตรวจสอบว่า email และ password ถูกต้อง
- ตรวจสอบว่า user ได้ register แล้ว

### Token หมดอายุ
- ใช้ `refresh_token` เพื่อ refresh access token
- หรือ login ใหม่เพื่อได้ token ใหม่
