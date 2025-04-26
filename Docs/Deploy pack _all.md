ชุด Deployment Pack ของเรา ประกอบด้วย
1. ecosystem.config.js → สำหรับรัน backend/frontend ด้วย PM2
2.. setup-gdmapp-server.sh → สำหรับติดตั้ง Nginx + Certbot + Setup Reverse Proxy + SSL
(ทั้งหมดอัตโนมัติ!)

✨ 1. ไฟล์ ecosystem.config.js
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
        PORT: 5000,
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
ใช้ PM2 จัดการ 2 services พร้อมกัน

✨ 2. ไฟล์ setup-gdmapp-server.sh
วางไว้ที่ root เช่นกัน gdm-app/setup-gdmapp-server.sh
```
#!/bin/bash

# ====== ตั้งค่าตัวแปรที่คุณต้องแก้ไข ======
DOMAIN="gdmapp.devapp.cc"
EMAIL="your-email@example.com"  # <<< ใส่อีเมลคุณ
FRONTEND_PORT=3000
BACKEND_PORT=5000

# ====== เริ่มติดตั้ง ======
echo "🛠️ Updating packages..."
sudo apt update

echo "🛠️ Installing Nginx..."
sudo apt install -y nginx

echo "🛠️ Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# ====== สร้าง Nginx Config ======
echo "🛠️ Creating Nginx config..."
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

echo "🛠️ Enabling Nginx site..."
sudo ln -s $NGINX_CONF /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# ====== ขอ SSL Certificate ======
echo "🔒 Requesting SSL certificate..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL

# ====== ติดตั้ง PM2 และรันบริการ ======
echo "🚀 Installing PM2..."
sudo npm install -g pm2

echo "🚀 Starting services with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# ====== เสร็จสมบูรณ์ ======
echo "🎉 Deployment Completed! Visit https://$DOMAIN"

```
🔥 รวมขั้นตอนใช้งาน Deployment Pack
1. วาง ecosystem.config.js และ setup-gdmapp-server.sh ไว้ที่ root gdm-app/
2. แก้ไข setup-gdmapp-server.sh
  - เปลี่ยนค่า DOMAIN
  - เปลี่ยนอีเมล EMAIL
3. ให้สิทธิ์รัน script:
```
chmod +x setup-gdmapp-server.sh
```
4. run
```
./setup-gdmapp-server.sh
```
5. เสร็จเรียบร้อย! 🎯

🎯 Deployment Pack นี้ทำอะไรให้คุณ
- ติดตั้ง Nginx, Certbot, PM2 ให้อัตโนมัติ
- ตั้งค่า Reverse Proxy (Frontend / API)
- ขอ SSL พร้อม HTTPS
- Start backend และ frontend ผ่าน PM2
- เซ็ต PM2 ให้ start ตอนเครื่อง boot อัตโนมัติ

🚀 ต่อไปเวลา Update Code แค่
```
cd gdm-app
git pull
cd frontend && npm run build
pm2 restart all
```
ง่ายมาก ๆ 🛡️✨

