### 📦 1. โครงสร้างที่เราจะตั้งค่า
สมมุติว่า:

บริการ	                        URL	                              Port          ภายใน	            หมายเหตุ
Frontend React (serve build)	https://gdmapp.devapp.cc	      localhost:3000	รันผ่าน serve -s build
Backend API (Node.js)	        https://gdmapp.devapp.cc/api/	  localhost:5000	API ใช้ Express server

### 🛠 2. ติดตั้ง Nginx บน Ubuntu
ถ้ายังไม่ได้ติดตั้ง nginx:
```
sudo apt update
sudo apt install nginx
```
เปิดใช้งาน nginx:
```
sudo systemctl enable nginx
sudo systemctl start nginx
```
เช็กว่า nginx รันอยู่:
```
sudo systemctl status nginx
```
✍️ 3. ตั้งค่าไฟล์ Nginx Config
สร้างไฟล์ใหม่ เช่น
```
sudo nano /etc/nginx/sites-available/gdmapp
```
แล้วใส่เนื้อหานี้:
```
server {
    listen 80;
    server_name gdmapp.devapp.cc;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

อธิบาย:
- / → ให้ไปที่ frontend (React app) ที่รันบน port 3000
- /api/ → ให้ไปที่ backend API บน port 5000


### 🔗 4. ทำ symlink ให้ Nginx รู้จัก
```
sudo ln -s /etc/nginx/sites-available/gdmapp /etc/nginx/sites-enabled/
```
จากนั้นเช็ก config:
```
sudo nginx -t
```
ถ้า OK แล้ว reload nginx:
```
sudo systemctl reload nginx
```

### 🔒 5. เพิ่ม SSL (ฟรี) ด้วย Let's Encrypt
ติดตั้ง Certbot:

```
sudo apt install certbot python3-certbot-nginx
```
แล้วสั่งขอ SSL ฟรี:
```
sudo certbot --nginx -d gdmapp.devapp.cc
```
Certbot จะ:
- แก้ไข config nginx ให้คุณ
- เพิ่ม SSL Certificate อัตโนมัติ
- ตั้ง Cron Job ให้ต่ออายุ cert ให้อัตโนมัติด้วย

✅ หลังจากเสร็จ URL ของคุณจะกลายเป็น https://gdmapp.devapp.cc พร้อม SSL เลย!

### 🎯 6. ตัวอย่าง Config หลังได้ SSL แล้ว (สมบูรณ์)

```
server {
    listen 80;
    server_name gdmapp.devapp.cc;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name gdmapp.devapp.cc;

    ssl_certificate /etc/letsencrypt/live/gdmapp.devapp.cc/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gdmapp.devapp.cc/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### อธิบายเพิ่ม:
บังคับ redirect HTTP → HTTPS
รองรับ WebSocket ด้วย (เพราะมี upgrade headers)

✨ สรุป Flow ทั้งหมด
```
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
sudo nano /etc/nginx/sites-available/gdm-app
sudo ln -s /etc/nginx/sites-available/gdm-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d gdmapp.devapp.cc
```


เสร็จ! ใช้ https ได้เลย	🚀
🎁 ถ้าอยากเร็วขึ้น
ผมสามารถทำ Template Script ให้คุณ auto-setup nginx + certbot ทั้งหมดใน 1 คำสั่งได้เลยนะครับ ✅
(ใช้ได้ใน 5 นาที ประหยัดเวลาสุดๆ)

อยากได้ไหมครับ? จะได้ทำเป็น shell script ไว้ให้ใช้งานได้ตลอด 🔥😎
(อยากได้บอกเลยนะ เดี๋ยวทำให้ฟรีๆ) 🚀