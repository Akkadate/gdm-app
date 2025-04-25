# GDM Application - ระบบติดตามผู้ป่วยเบาหวานขณะตั้งครรภ์

![GDM App Logo](./frontend/public/logo192.png)

## เกี่ยวกับโครงการ

GDM Application เป็นระบบเว็บแอปพลิเคชันสำหรับการดูแลและติดตามผู้ป่วยที่มีความเสี่ยงเป็นเบาหวานขณะตั้งครรภ์ (Gestational Diabetes Mellitus - GDM) โดยมีจุดมุ่งหมายเพื่อช่วยให้ผู้ป่วยสามารถบันทึกข้อมูลสุขภาพได้สะดวกและช่วยให้พยาบาลสามารถติดตามอาการของผู้ป่วยได้อย่างมีประสิทธิภาพ

## ฟีเจอร์หลัก

### สำหรับผู้ป่วย
- ระบบลงทะเบียนและยืนยันตัวตน
- บันทึกระดับน้ำตาลในเลือด (ก่อนและหลังอาหาร)
- บันทึกอาหารที่รับประทาน
- บันทึกการออกกำลังกาย
- บันทึกน้ำหนักและติดตามการตั้งครรภ์
- ดูการนัดหมายและประวัติการรักษา
- แสดงกราฟแนวโน้มระดับน้ำตาล
- แจ้งเตือนเมื่อค่าน้ำตาลผิดปกติ

### สำหรับพยาบาล
- แดชบอร์ดแสดงภาพรวมผู้ป่วย
- ดูรายชื่อและสถานะผู้ป่วย
- ติดตามผู้ป่วยที่มีค่าน้ำตาลผิดปกติ
- ตั้งเป้าหมายระดับน้ำตาลรายบุคคล
- บันทึกการรักษาและการให้คำแนะนำ
- สร้างรายงานสรุปข้อมูล

## เทคโนโลยีที่ใช้

### Backend
- Node.js + Express.js
- PostgreSQL
- JWT Authentication
- RESTful API

### Frontend
- React.js
- Tailwind CSS
- Chart.js
- Formik + Yup
- Axios

### Infrastructure
- Ubuntu 22.04
- Nginx
- SSL (Let's Encrypt)
- PM2

## การติดตั้ง

โปรดดูคำแนะนำการติดตั้งอย่างละเอียดได้ใน [คู่มือการติดตั้ง](./docs/installation.md)

### ความต้องการเบื้องต้น
- Node.js 16.x+
- PostgreSQL 14.x+
- npm หรือ yarn

### ขั้นตอนการติดตั้งอย่างย่อ

1. Clone repository
   ```
   git clone https://github.com/yourrepo/gdm-app.git
   cd gdm-app
   ```

2. ติดตั้ง dependencies
   ```
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. ตั้งค่าฐานข้อมูล
   ```
   # สร้างฐานข้อมูล PostgreSQL
   psql -h remote.devapp.cc -U postgres -c "CREATE DATABASE gdm_db;"
   
   # นำเข้าโครงสร้างฐานข้อมูล
   psql -h remote.devapp.cc -U postgres -d gdm_db -f database-models.sql
   ```

4. ตั้งค่าไฟล์ .env
   ```
   # Backend .env
   cp backend/.env.example backend/.env
   
   # Frontend .env
   cp frontend/.env.example frontend/.env
   ```

5. รันแอปพลิเคชัน
   ```
   # Backend
   cd backend
   npm start
   
   # Frontend
   cd ../frontend
   npm start
   ```

## โครงสร้างโปรเจค

```
gdm-app/
│
├── backend/                 # Node.js Backend API
│   ├── config/              # การตั้งค่าต่างๆ 
│   ├── controllers/         # ตัวควบคุมการเรียกใช้ API
│   ├── middlewares/         # Middleware สำหรับการตรวจสอบ
│   ├── models/              # โมเดลฐานข้อมูล
│   ├── routes/              # เส้นทาง API
│   ├── services/            # บริการทางธุรกิจ
│   ├── utils/               # ฟังก์ชันช่วยเหลือ
│   ├── .env                 # ไฟล์การตั้งค่าสภาพแวดล้อม
│   ├── package.json         # การพึ่งพา npm
│   └── server.js            # ไฟล์หลักของเซิร์ฟเวอร์
│
├── frontend/                # React Frontend
│   ├── public/              # ไฟล์สถิต
│   ├── src/                 # ซอร์สโค้ด React
│   │   ├── assets/          # รูปภาพและสื่อต่างๆ
│   │   ├── components/      # คอมโพเนนต์ใช้ซ้ำ
│   │   ├── contexts/        # React Context
│   │   ├── hooks/           # React Custom Hooks
│   │   ├── layouts/         # เลย์เอาต์ของหน้า
│   │   ├── pages/           # หน้าต่างๆ
│   │   ├── services/        # บริการ API
│   │   ├── utils/           # ฟังก์ชันช่วยเหลือ
│   │   ├── App.js           # คอมโพเนนต์หลัก
│   │   └── index.js         # จุดเริ่มต้น
│   ├── .env                 # ไฟล์การตั้งค่า
│   └── package.json         # การพึ่งพา npm
│
├── nginx/                   # การตั้งค่า Nginx
│   └── gdmapp.conf          # ไฟล์คอนฟิกเซิร์ฟเวอร์
│
└── README.md                # เอกสารโครงการ
```

## การใช้งาน

1. เข้าใช้งานระบบที่ URL: https://gdmapp.devapp.cc
2. ลงทะเบียนด้วยข้อมูลผู้ป่วย
3. เริ่มบันทึกข้อมูลสุขภาพประจำวัน

สำหรับรายละเอียดเพิ่มเติม โปรดดู [คู่มือการใช้งาน](./docs/user-manual.md)

## การพัฒนาและทดสอบ

1. Fork repository นี้
2. สร้าง branch ใหม่สำหรับฟีเจอร์หรือการแก้ไข: `git checkout -b feature/your-feature-name`
3. Commit การเปลี่ยนแปลง: `git commit -m 'Add some feature'`
4. Push ไปยัง branch: `git push origin feature/your-feature-name`
5. ส่ง Pull Request

## ใบอนุญาต

โครงการนี้อยู่ภายใต้ใบอนุญาต MIT - ดูรายละเอียดได้ที่ [LICENSE](LICENSE)

## ติดต่อ

หากมีคำถามหรือต้องการความช่วยเหลือ โปรดติดต่อ:
- อีเมล: support@gdmapp.devapp.cc
- เว็บไซต์: https://gdmapp.devapp.cc/contact

---
© 2025 GDM Application Team. All Rights Reserved.