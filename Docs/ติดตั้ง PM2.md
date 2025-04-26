###  ตั้งค่า PM2 (สำหรับรัน Node.js แบบ daemon)

```bash
# ติดตั้ง PM2
sudo npm install -g pm2


 ## รัน backend และ frontend ด้วย pm2 start

gdm-app/
├── backend/
│   └── package.json (มี script "start")
├── frontend/
│   └── package.json (มี script "start")


### สร้างไฟล์ที่ root ของโปรเจกต์ gdm-app:
gdm-app/ecosystem.config.js

```
module.exports = {
  apps: [
    {
      name: 'gdm-backend',
      cwd: './backend', // ไปที่โฟลเดอร์ backend ก่อน
      script: 'npm',
      args: 'start',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PORT: 5000, // หรือ port ที่ backend ใช้
      },
    },
    {
      name: 'gdm-frontend',
      cwd: './frontend', // ไปที่โฟลเดอร์ frontend ก่อน
      script: 'npm',
      args: 'start',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
        PORT: 3000, // หรือ port ที่ frontend ใช้
      },
    }
  ]
};

```
### 🛠 อธิบายแต่ละส่วน
Key                  | ความหมาย
name                | ชื่อ process ที่จะเห็นใน pm2 list
cwd                 | (Current Working Directory) ให้เข้าโฟลเดอร์นั้นก่อนรัน
script              | คำสั่งหลัก (เราใช้ npm)
args                | คำสั่งต่อท้าย (เราใช้ start)
interpreter: 'none' | บอกว่าอย่าใช้ node โดยตรง เพราะ npm มันเป็น shell script
env                 | ตั้ง environment variables ต่างๆ ได้เลย


### 🚀 วิธีใช้ ecosystem.config.js
หลังจากสร้างไฟล์แล้ว ให้สั่ง:

```
# รันโปรเจกต์ทั้งหมด
pm2 start ecosystem.config.js

# เซฟ process ไว้ (หลัง reboot server แล้วจะรันเอง)
pm2 save

# ดูสถานะ
pm2 list

```
หมายเหตุสำคัญ (Frontend/React)
ตอน deploy production จริง
แนะนำว่า frontend อย่ารัน npm start (มันเปิด dev server)
ควร npm run build แล้วใช้ serve หรือ Nginx แทน

แต่ถ้ายังพัฒนาอยู่ หรืออยากง่ายก่อนก็รัน npm start ไปก่อนได้ไม่มีปัญหาครับ


### ตัวเลือกเพิ่มเติม (Advance)
ถ้าอยากจัดการ log หรือ restart อัตโนมัติถ้า server ล่ม ให้เพิ่มเข้าไปในแต่ละ app ได้ เช่น:
```
max_memory_restart: '300M',   // ถ้าใช้แรมเกิน 300MB ให้ restart
watch: false,                 // ไม่ต้อง watch auto reload (production ใช้ false)
```
```
pm2 list
pm2 log
```


### บันทึกการตั้งค่า (ให้ server reboot แล้วยังรันอยู่)
```
pm2 save
pm2 startup
```

# ตั้งค่าให้เริ่มอัตโนมัติเมื่อเซิร์ฟเวอร์รีสตาร์ท
pm2 startup
pm2 save
```
### การจัดการโปรแกรม
คำสั่ง | ความหมาย
pm2 stop gdm-backend | หยุด backend
pm2 restart gdm-backend | รีสตาร์ท backend
pm2 logs gdm-backend | ดู log ของ backend
pm2 delete gdm-frontend | ลบ process frontend ออกจาก pm2

## ตัวอย่างไฟล์ ecosystem.config.js แบบ Production พร้อมใช้
gdm-app/ecosystem.config.js
```
module.exports = {
  apps: [
    {
      name: 'gdm-backend',
      cwd: './backend',
      script: 'npm',
      args: 'start',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PORT: 5000, // แก้ตาม backend port ที่ใช้
      },
    },
    {
      name: 'gdm-frontend',
      cwd: './frontend',
      script: 'npx',
      args: 'serve -s build -l 3000',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
    }
  ]
};

```
### 📚 อธิบาย
ส่วน           | อธิบาย
backend       | ใช้ npm start ตามปกติ เช่น Express, NestJS
frontend      | รัน npx serve เพื่อ serve ไฟล์ build/ ที่สร้างด้วย npm run build
-s            | หมายถึง serve แบบ static mode (เหมาะกับ React SPA)
-l 3000       | เปิด port 3000 สำหรับ frontend

## 🛠 สิ่งที่ต้องทำก่อนรัน PM2
### 1. Build frontend ก่อน (ครั้งเดียวหรือเวลามีแก้ไข)
```
cd frontend
npm install
npm run build
```
(มันจะสร้างโฟลเดอร์ frontend/build)

### 2. ติดตั้ง serve ถ้ายังไม่มี
serve คือ HTTP Static File Server ตัวเบาๆ
```
npm install -g serve
```
### 3. แล้วค่อยสั่ง PM2 ตามปกติ
```
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔥 สรุป Flow Production ที่ถูกต้องสำหรับ gdm-app

ขั้นตอน	             คำอธิบาย
Backend	            ใช้ npm start (เช่น Express API)
Frontend	          ใช้ npm run build แล้ว serve ด้วย npx serve -s build
PM2	                ควบคุม process ทั้งหมดด้วย ecosystem.config.js


## 🎯 หมายเหตุเสริม (เรื่อง domain / SSL)
- อยากปลอดภัยมากขึ้น ต้องใช้ Nginx Reverse Proxy มาคั่น เช่น
  - https://gdmapp.devapp.cc → proxy ไป backend
  - https://gdmapp.devapp.cc → proxy ไป frontend
- รองรับ SSL (Let's Encrypt)

(อันนี้ถ้าอยากทำ เดี๋ยวผมสอน config Nginx เพิ่มให้ได้อีก)

✅ สรุป: ไฟล์ ecosystem.config.js แบบ production เสร็จสมบูรณ์แล้ว
อยากให้ผมต่อยอดทำ

"ตัวอย่าง config nginx + ssl สำหรับ gdm-app"

ไหมครับ 🔥 (จะได้ deploy เสร็จสมบูรณ์ 100% เลย)
ถ้าอยาก บอกมาได้เลย เดี๋ยวจัดเต็มให้อีกชุด! 🚀😎








