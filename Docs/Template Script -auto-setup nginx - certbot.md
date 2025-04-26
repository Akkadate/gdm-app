เดี๋ยวผมทำ Template Shell Script แบบพร้อมใช้งานให้เลย
รันทีเดียว → ติดตั้ง nginx + setup reverse proxy + SSL Certbot ครบทุกอย่าง ✅

```
#!/bin/bash

# ====== ตั้งค่าตัวแปรที่คุณต้องแก้ไขเอง ======
DOMAIN="gdmapp.devapp.cc"
FRONTEND_PORT=3000
BACKEND_PORT=5000

# ====== เริ่มติดตั้ง ======
echo "🛠️ Updating package list..."
sudo apt update

echo "🛠️ Installing Nginx..."
sudo apt install -y nginx

echo "🛠️ Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# ====== สร้าง Nginx Config ======
echo "🛠️ Setting up Nginx reverse proxy config..."

NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

sudo tee $NGINX_CONF > /dev/null <<EOL
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# ====== เปิดใช้งาน Site และ Reload Nginx ======
echo "🛠️ Enabling site and reloading Nginx..."
sudo ln -s $NGINX_CONF /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# ====== ขอ SSL Certificate ======
echo "🔒 Requesting SSL certificate..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m your-email@example.com

# ====== เสร็จสมบูรณ์ ======
echo "🎉 All Done! Your site is ready at https://$DOMAIN"

```

🚀 วิธีใช้งาน
สร้างไฟล์ใหม่:

bash
Copy
Edit
nano setup-gdmapp-server.sh
วางโค้ดที่ผมให้ไป

ตั้งสิทธิ์ให้ไฟล์รันได้:

bash
Copy
Edit
chmod +x setup-gdmapp-server.sh
รันสคริปต์:

bash
Copy
Edit
./setup-gdmapp-server.sh
แค่ 1 คำสั่ง จบเลย!!

📋 หมายเหตุ:
อย่าลืมแก้:

DOMAIN="yourdomain.com" → เปลี่ยนให้ตรงกับโดเมนคุณ

your-email@example.com → ใส่อีเมลของคุณ (Certbot ใช้เวลาต่ออายุแจ้งเตือน)

Port (3000 / 5000) ตั้งให้ตรงกับที่ Frontend / Backend ใช้

🎯 ถ้าอยากได้เวอร์ชันที่:
รองรับ auto-renew SSL

รองรับ firewall (UFW) เปิด port 80/443 อัตโนมัติ

รองรับหลาย domain บอกได้เลยครับ เดี๋ยวทำ เวอร์ชัน Advance ให้อีก!

✅ ตอนนี้คุณอยากให้ผมทำไฟล์ ecosystem.config.js + setup-gdmapp-server.sh รวมกันเป็นชุด Deployment Pack เลยไหมครับ?
(จะได้ copy ไปใช้ทั้งเซิร์ฟเวอร์ทีเดียวเลย 🚀🔥)