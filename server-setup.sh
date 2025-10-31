#!/bin/bash

# 🛠️ Скрипт первоначальной настройки Ubuntu сервера
# Использование: ./server-setup.sh

set -e

echo "🛠️ Настраиваем Ubuntu сервер для деплоя..."

# 1. Обновляем систему
echo "📦 Обновляем систему..."
sudo apt update && sudo apt upgrade -y

# 2. Устанавливаем необходимые пакеты
echo "📦 Устанавливаем базовые пакеты..."
sudo apt install -y curl wget git unzip software-properties-common

# 3. Устанавливаем Node.js 18
echo "📦 Устанавливаем Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Устанавливаем PM2
echo "📦 Устанавливаем PM2..."
sudo npm install -g pm2

# 5. Устанавливаем Nginx
echo "📦 Устанавливаем Nginx..."
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx

# 6. Устанавливаем Certbot для SSL
echo "📦 Устанавливаем Certbot..."
sudo apt install certbot python3-certbot-nginx -y

# 7. Настраиваем файрвол
echo "🔥 Настраиваем файрвол..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# 8. Создаем пользователя для приложения
echo "👤 Создаем пользователя funnel..."
sudo adduser --system --group --shell /bin/bash funnel || echo "Пользователь уже существует"

# 9. Создаем директорию для приложения
echo "📁 Создаем директорию приложения..."
sudo mkdir -p /var/www/funnel-app
sudo chown funnel:funnel /var/www/funnel-app

# 10. Создаем базовый конфиг Nginx
echo "🌐 Создаем конфиг Nginx..."
sudo tee /etc/nginx/sites-available/annaraight.com > /dev/null <<EOF
server {
    listen 80;
    server_name annaraight.com www.annaraight.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static files optimization
    location /_next/static {
        proxy_cache STATIC;
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /static {
        proxy_cache STATIC;
        proxy_ignore_headers Cache-Control;
        proxy_cache_valid 60m;
        proxy_pass http://localhost:3000;
    }
}
EOF

# Активируем сайт
sudo ln -sf /etc/nginx/sites-available/annaraight.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Тестируем и перезапускаем Nginx
sudo nginx -t
sudo systemctl reload nginx

# 11. Показываем версии
echo ""
echo "✅ Установка завершена! Версии:"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "PM2: $(pm2 --version)"
echo "Nginx: $(nginx -v 2>&1)"

echo ""
echo "🚀 Сервер готов для деплоя!"
echo "📝 Следующие шаги:"
echo "1. Загрузите ваше приложение: ./deploy.sh your-server"
echo "2. Настройте SSL: sudo certbot --nginx -d annaraight.com -d www.annaraight.com"
echo "3. Проверьте: https://annaraight.com"