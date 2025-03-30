# ระบบจัดการผู้ป่วยเบาหวานขณะตั้งครรภ์ (Gestational Diabetes Management System)

ระบบจัดการผู้ป่วยเบาหวานขณะตั้งครรภ์ สำหรับโรงพยาบาลและคลินิก ช่วยในการจัดการข้อมูลผู้ป่วย การติดตามระดับน้ำตาล และการนัดหมาย

## คุณสมบัติหลัก

- **การจัดการผู้ป่วย**: ลงทะเบียนผู้ป่วย, ดูและแก้ไขข้อมูลผู้ป่วย, ประเมินความเสี่ยง
- **การติดตามระดับน้ำตาล**: บันทึกและติดตามค่าระดับน้ำตาลในเลือด, การแจ้งเตือนระดับน้ำตาลที่ผิดปกติ
- **การนัดหมาย**: จัดการตารางนัดหมาย, การแจ้งเตือนการนัดหมาย
- **แดชบอร์ด**: ภาพรวมของผู้ป่วย, แนวโน้มระดับน้ำตาล, สถิติต่างๆ
- **การแจ้งเตือน**: การแจ้งเตือนอัตโนมัติสำหรับค่าน้ำตาลที่ผิดปกติและการนัดหมาย

## เทคโนโลยีที่ใช้

- **Backend**: Node.js, Express
- **Frontend**: React, Tailwind CSS
- **Database**: PostgreSQL
- **Web Server**: NGINX
- **Authentication**: JWT (JSON Web Tokens)

## ความต้องการของระบบ

- Node.js v14+
- PostgreSQL 12+
- NGINX (สำหรับการใช้งานบนเซิร์ฟเวอร์)

## การติดตั้ง

### วิธีที่ 1: การติดตั้งด้วย Docker (แนะนำ)

1. ติดตั้ง Docker และ Docker Compose:
   ```
   # ตรวจสอบว่ามีการติดตั้งแล้วหรือไม่
   docker -v
   docker-compose -v
   ```

2. โคลนโปรเจค:
   ```
   git clone https://github.com/yourusername/gdm-app.git
   cd gdm-app
   ```

3. รันคำสั่งติดตั้ง:
   ```
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
   ```

### วิธีที่ 2: การติดตั้งแบบเดิม

1. ติดตั้ง PostgreSQL:
   ```
   # สำหรับ Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # สร้างฐานข้อมูลและผู้ใช้
   sudo -u postgres psql
   postgres=# CREATE USER gdmadmin WITH PASSWORD 'yourpassword';
   postgres=# CREATE DATABASE gdmapp;
   postgres=# GRANT ALL PRIVILEGES ON DATABASE gdmapp TO gdmadmin;
   postgres=# \q
   
   # นำเข้าโครงสร้างฐานข้อมูล
   sudo -u postgres psql -d gdmapp -f scripts/init-db.sql
   ```

2. ติดตั้ง Backend:
   ```
   # ติดตั้ง Node.js และ npm
   sudo apt update
   sudo apt install nodejs npm
   
   # ไปที่โฟลเดอร์ backend
   cd backend
   
   # ติดตั้ง dependencies
   npm install
   
   # สร้างไฟล์ .env
   echo "NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgres://gdmadmin:yourpassword@localhost:5432/gdmapp
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRE=7d" > .env
   
   # ติดตั้ง PM2 และเริ่มต้นเซิร์ฟเวอร์
   sudo npm install -g pm2
   pm2 start server.js --name "gdm-backend"
   pm2 save
   pm2 startup
   ```

3. ติดตั้ง Frontend:
   ```
   # ไปที่โฟลเดอร์ frontend
   cd frontend
   
   # ติดตั้ง dependencies
   npm install
   
   # ตั้งค่า API URL
   echo "REACT_APP_API_URL=http://yourdomain.com:5000" > .env
   
   # สร้าง build
   npm run build
   ```

4. ตั้งค่า NGINX:
   ```
   # ติดตั้ง NGINX
   sudo apt update
   sudo apt install nginx
   
   # สร้างไฟล์ config
   sudo nano /etc/nginx/sites-available/gdm-app
   
   # เปิดใช้งาน config
   sudo ln -s /etc/nginx/sites-available/gdm-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## การเข้าถึงระบบ

หลังจากติดตั้ง:

- หน้าเว็บแอปพลิเคชัน: http://yourdomain.com หรือ https://gdm.example.com (หากใช้ Docker)
- API: http://yourdomain.com/api หรือ https://api.gdm.example.com (หากใช้ Docker)

บัญชีผู้ใช้เริ่มต้น:
- ผู้ดูแลระบบ: admin / admin123
- แพทย์: doctor / doctor123
- พยาบาล: nurse / nurse123

## การบำรุงรักษา

### การสำรองข้อมูล PostgreSQL

```bash
# สำรองฐานข้อมูล
pg_dump -U gdmadmin -d gdmapp -f backup_$(date +"%Y%m%d").sql

# สำรองเฉพาะโครงสร้าง (ไม่รวมข้อมูล)
pg_dump -U gdmadmin -d gdmapp --schema-only -f schema_$(date +"%Y%m%d").sql
```

### การอัพเดตแอปพลิเคชัน

```bash
# การอัพเดตด้วย Docker
docker-compose pull
docker-compose up -d

# การอัพเดตแบบเดิม
cd /path/to/backend
git pull
npm install
pm2 restart gdm-backend

cd /path/to/frontend
git pull
npm install
npm run build
```

## การแก้ไขปัญหา

1. ปัญหาการเชื่อมต่อฐานข้อมูล:
   - ตรวจสอบการตั้งค่าการเชื่อมต่อใน `.env`
   - ตรวจสอบว่า PostgreSQL กำลังทำงานอยู่: `sudo systemctl status postgresql`

2. ปัญหาการเข้าถึงเว็บไซต์:
   - ตรวจสอบการตั้งค่า NGINX: `sudo nginx -t`
   - ตรวจสอบ firewall: `sudo ufw status`

3. ตรวจสอบ log:
   - Backend: `pm2 logs gdm-backend`
   - NGINX: `sudo tail -f /var/log/nginx/error.log`

## ทีมพัฒนา

พัฒนาโดยทีมพัฒนาระบบสุขภาพ

## สัญญาอนุญาต

ลิขสิทธิ์ © 2025 GDM Healthcare Team. สงวนลิขสิทธิ์
