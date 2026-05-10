# Event Planner

Event Planner เป็น full-stack task planning application สำหรับจัดการงานส่วนตัวหรือทีมขนาดเล็ก ระบบประกอบด้วย frontend ที่เขียนด้วย React/Vite, backend ที่เขียนด้วย Flask และ database เป็น MySQL

## ภาพรวมการทำงาน

ผู้ใช้เข้าใช้งานผ่าน frontend ที่ `http://localhost:5173` จากนั้น login ด้วย email และ password เมื่อ login สำเร็จ backend จะส่ง JWT token กลับมา frontend จะเก็บ token ไว้ใน `localStorage` และแนบ token นี้ไปกับทุก request ที่ต้องการสิทธิ์เข้าถึง เช่น การดึง tasks, เพิ่ม task, แก้ไข task และลบ task

Flow หลักของระบบ:

```text
Browser
  -> React Frontend
  -> Axios /api/*
  -> Vite Proxy
  -> Flask Backend http://127.0.0.1:3000/api/*
  -> MySQL Database event_plan
```

## Frontend

Frontend อยู่ในโฟลเดอร์ `frontend/` และใช้เทคโนโลยีหลัก:

- React
- Vite
- React Router
- Axios
- CSS responsive design

หน้าหลักของ frontend:

- `/` Landing page
- `/login` Login page
- `/dashboard` Dashboard สำหรับดูสถิติงาน
- `/planner` Planner สำหรับค้นหา เพิ่ม แก้ไข ลบ และเปลี่ยนสถานะ task

ไฟล์สำคัญ:

- `frontend/src/App.jsx` กำหนด routes และ protected routes
- `frontend/src/api.js` ตั้งค่า Axios, แนบ token และจัดการ 401 response
- `frontend/src/pages/Login.jsx` login และเก็บ JWT token
- `frontend/src/pages/Dashboard.jsx` ดึง tasks เพื่อแสดง statistics
- `frontend/src/pages/Planner.jsx` จัดการ CRUD ของ tasks
- `frontend/vite.config.mjs` ตั้งค่า proxy จาก `/api` ไป backend

### การเรียก API จาก Frontend

Frontend ไม่เรียก backend ด้วย URL เต็มโดยตรง แต่เรียกผ่าน path `/api`

```js
const API_BASE = import.meta.env.VITE_API_BASE || '/api'
```

ตอน dev server ทำงาน Vite จะ proxy request ไปที่ backend:

```js
proxy: {
  '/api': {
    target: 'http://127.0.0.1:3000',
    changeOrigin: true,
  },
}
```

วิธีนี้ช่วยลดปัญหา CORS และปัญหา `localhost`/IPv6 mismatch ที่อาจทำให้ Axios แสดง `Network Error`

### Token Handling

หลัง login สำเร็จ backend จะตอบ:

```json
{
  "token": "JWT_TOKEN"
}
```

Frontend จะเก็บ token:

```js
localStorage.setItem('token', token)
```

จากนั้น Axios interceptor จะเพิ่ม header ให้ทุก request:

```http
Authorization: Bearer JWT_TOKEN
```

ถ้า backend ตอบ `401 Unauthorized` frontend จะลบ token และ redirect กลับไปหน้า login

## Backend

Backend อยู่ในโฟลเดอร์ `backend/` และใช้เทคโนโลยีหลัก:

- Flask
- Flask-CORS
- PyJWT
- bcrypt
- mysql-connector-python
- python-dotenv

ไฟล์สำคัญ:

- `backend/app.py` สร้าง Flask app, เปิด CORS, register routes
- `backend/Database.py` จัดการ MySQL connection pool
- `backend/routes/auth.py` register และ login
- `backend/routes/tasks.py` task CRUD APIs
- `backend/middleware/auth.py` ตรวจ JWT token
- `backend/seed.py` เพิ่ม demo user และ sample tasks

Backend เปิดที่:

```text
http://127.0.0.1:3000
```

API base path คือ:

```text
/api
```

Health endpoint:

```http
GET /api
```

Response:

```json
{
  "message": "API is running"
}
```

## Authentication

ระบบใช้ JWT authentication

1. ผู้ใช้ส่ง email/password ไปที่ `POST /api/auth/login`
2. Backend ตรวจ user ใน MySQL
3. Backend ใช้ bcrypt ตรวจ password
4. ถ้าถูกต้อง backend สร้าง JWT token ด้วย `JWT_SECRET`
5. Frontend เก็บ token และส่งกลับมาใน `Authorization` header
6. Protected APIs จะผ่าน middleware `jwt_required`

ถ้า request ไปยัง protected API โดยไม่มี token backend จะตอบ:

```json
{
  "error": "Authorization header missing"
}
```

## API Endpoints

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "demo@planora.app",
  "password": "password123"
}
```

### Get Tasks

```http
GET /api/tasks
Authorization: Bearer JWT_TOKEN
```

### Create Task

```http
POST /api/tasks
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

Body:

```json
{
  "title": "Prepare product launch checklist",
  "description": "Confirm owners and deadlines",
  "status": "pending",
  "due_date": "2026-05-11"
}
```

### Update Task

```http
PUT /api/tasks/:id
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

Body example:

```json
{
  "status": "completed"
}
```

### Delete Task

```http
DELETE /api/tasks/:id
Authorization: Bearer JWT_TOKEN
```

## Database

ระบบใช้ MySQL database ชื่อ `event_plan`

การเชื่อมต่อ database ถูกจัดการใน `backend/Database.py` ผ่าน connection pool โดยอ่านค่าจาก environment variables:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_POOL_NAME`
- `DB_POOL_SIZE`

ค่า default:

```text
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=event_plan
```

Schema:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARBINARY(255) NOT NULL
);

CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(32) DEFAULT 'pending',
  due_date DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

ความสัมพันธ์:

- 1 user มีได้หลาย tasks
- `tasks.user_id` อ้างอิง `users.id`
- ถ้าลบ user tasks ของ user นั้นจะถูกลบตามด้วย `ON DELETE CASCADE`

## Seed Data

มี seed script สำหรับสร้าง user และ tasks ตัวอย่าง:

```bash
python backend/seed.py
```

Demo login:

```text
demo@planora.app
password123
```

Seed script จะสร้าง tasks ตัวอย่างหลายรายการ มีทั้ง `pending`, `completed`, due date และ task ที่ไม่มี due date

## การติดตั้งและรันระบบ

### 1. ติดตั้ง Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### 2. ตั้งค่า Environment

สร้างไฟล์ `.env` ที่ root project โดยอ้างอิงจาก `.env.example`

```bash
cp .env.example .env
```

ตัวอย่าง:

```text
JWT_SECRET=change-me
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=event_plan
PORT=3000
```

### 3. สร้าง Database และ Tables

สร้าง database `event_plan` และ tables `users`, `tasks` ตาม schema ด้านบน

### 4. Seed Data

```bash
python backend/seed.py
```

### 5. Run Backend

```bash
python backend/app.py
```

Backend จะรันที่:

```text
http://127.0.0.1:3000
```

### 6. Run Frontend

เปิด terminal ใหม่:

```bash
cd frontend
npm install
npm run dev
```

Frontend จะรันที่:

```text
http://localhost:5173
```

## การเชื่อมต่อ Frontend กับ Backend

ในโหมด development frontend เรียก API แบบนี้:

```text
/api/auth/login
/api/tasks
```

จากนั้น Vite proxy จะส่งต่อไป backend:

```text
http://127.0.0.1:3000/api/auth/login
http://127.0.0.1:3000/api/tasks
```

ดังนั้น browser จะมองว่า request ยังอยู่ origin เดียวกับ frontend (`localhost:5173`) และไม่ติด CORS ในระหว่างพัฒนา

## Troubleshooting

### เห็นข้อความ `Authorization header missing`

แปลว่า request ไป protected API โดยไม่มี token

วิธีแก้:

1. กลับไปหน้า `/login`
2. Login ใหม่ด้วย demo account
3. ถ้ายังไม่หาย ให้ล้าง token เก่าใน browser console:

```js
localStorage.removeItem('token')
```

### เห็น `Network Error` ใน frontend

สาเหตุที่พบบ่อย:

- Backend ไม่ได้รันที่ port `3000`
- Frontend dev server ไม่ได้ restart หลังแก้ `vite.config.mjs`
- เรียก `localhost:3000` โดยตรงแล้วชน IPv6/host mismatch

วิธีเช็ก:

```bash
curl http://127.0.0.1:3000/api
```

ควรได้:

```json
{
  "message": "API is running"
}
```

### Port ถูกใช้งานอยู่

เช็ก process:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN
```

## สรุป Architecture

```text
React UI
  - Pages, Components, Theme, Router
  - Axios instance with JWT token

Vite Dev Server
  - Serves frontend
  - Proxies /api to Flask backend

Flask Backend
  - Auth routes
  - Task CRUD routes
  - JWT middleware
  - CORS

MySQL
  - users table
  - tasks table
```
