# 🚀 Инструкция по деплою на Ubuntu сервер

## 📋 Требования к серверу
- Ubuntu 20.04+ 
- Node.js 18+ 
- npm или yarn
- PM2 (для управления процессами)
- Nginx (для проксирования)
- UFW (файрвол)

## 🔧 Подготовка Ubuntu сервера

### 1. Обновите систему
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Установите Node.js 18+
```bash
# Добавьте репозиторий NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Установите Node.js
sudo apt-get install -y nodejs

# Проверьте версию
node --version
npm --version
```

### 3. Установите PM2 глобально
```bash
sudo npm install -g pm2
```

### 4. Установите Nginx
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 5. Настройте файрвол
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw status
```

## 📁 Подготовка файлов

### 1. Создайте архив проекта
```bash
# Исключите node_modules и .next при архивировании
tar --exclude='node_modules' --exclude='.next' -czf funnel-app.tar.gz .
```

### 2. Загрузите на сервер
```bash
scp funnel-app.tar.gz user@your-server:/path/to/deployment/
```

## 🔧 Установка на сервере

### 1. Создайте пользователя для приложения
```bash
sudo adduser --system --group --shell /bin/bash funnel
sudo mkdir -p /var/www/funnel-app
sudo chown funnel:funnel /var/www/funnel-app
```

### 2. Распакуйте проект
```bash
cd /var/www/funnel-app
sudo -u funnel tar -xzf ~/funnel-app.tar.gz
```

### 3. Установите зависимости
```bash
sudo -u funnel npm install --production
```

### 3. Настройте переменные окружения

Создайте файл `.env.production`:
```env
# База данных
DATABASE_URL="file:./data/funnel.db"

# Домен
NEXT_PUBLIC_BASE_URL="https://annaraight.com"

# Email настройки
SMTP_HOST="mail.annaraight.com"
SMTP_PORT="465"
SMTP_USER="hello@annaraight.com"
SMTP_PASSWORD="ваш-пароль"

# Google Calendar (уже настроено)
GOOGLE_CALENDAR_CREDENTIALS_PATH="./database/credentials.json"
GOOGLE_CALENDAR_TOKEN_PATH="./database/token.json"

# Supabase (если используется)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Stripe (если используется)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-key"
STRIPE_SECRET_KEY="your-stripe-secret"

# Twilio SMS (если используется)
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="your-twilio-number"
```

### 5. Создайте директории и установите права
```bash
sudo -u funnel mkdir -p data logs public/uploads
sudo -u funnel chmod 755 data logs public/uploads
```

### 6. Соберите проект
```bash
sudo -u funnel npm run build
```

## 🚀 Запуск приложения

### Вариант 1: PM2 (рекомендуется)

1. Настройте PM2 для пользователя funnel:
```bash
sudo -u funnel pm2 start ecosystem.config.js
sudo -u funnel pm2 save
```

2. Настройте автозапуск PM2:
```bash
# Установите startup для пользователя funnel
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u funnel --hp /home/funnel

# Выполните команду которую выдаст предыдущая команда (что-то вроде):
# sudo systemctl enable pm2-funnel
```

3. Проверьте запуск:
```bash
sudo -u funnel pm2 list
sudo -u funnel pm2 logs
```

### Вариант 2: Systemd service

1. Создайте `/etc/systemd/system/funnel-app.service`:
```ini
[Unit]
Description=Funnel App
After=network.target

[Service]
Type=simple
User=funnel
Group=funnel
WorkingDirectory=/var/www/funnel-app
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

2. Запустите:
```bash
sudo systemctl daemon-reload
sudo systemctl enable funnel-app
sudo systemctl start funnel-app
sudo systemctl status funnel-app
```

## 🌐 Настройка Nginx (опционально)

Создайте конфиг `/etc/nginx/sites-available/annaraight.com`:
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name annaraight.com www.annaraight.com;

    # SSL настройки
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Проксирование на Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Статические файлы
    location /_next/static {
        proxy_cache STATIC;
        proxy_pass http://localhost:3000;
    }

    location /static {
        proxy_cache STATIC;
        proxy_ignore_headers Cache-Control;
        proxy_cache_valid 60m;
        proxy_pass http://localhost:3000;
    }
}
```

Активируйте:
```bash
sudo ln -s /etc/nginx/sites-available/annaraight.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📊 Мониторинг и логи

### PM2 логи:
```bash
pm2 logs funnel-app
pm2 monit
```

### Systemd логи:
```bash
journalctl -u funnel-app -f
```

## 🔄 Обновление приложения

```bash
# Остановите приложение
pm2 stop funnel-app  # или sudo systemctl stop funnel-app

# Обновите код
# ... загрузите новые файлы ...

# Установите зависимости (если изменились)
npm install

# Соберите
npm run build

# Запустите
pm2 start funnel-app  # или sudo systemctl start funnel-app
```

## ✅ Проверка работы

1. Откройте https://annaraight.com
2. Проверьте воронку: Start → Video → Schedule → Thank You
3. Проверьте админку: /admin/analytics
4. Проверьте отправку email и работу календаря

## 🐛 Решение проблем

### Проблемы с базой данных:
```bash
# Проверьте права доступа
ls -la data/
chmod 664 data/funnel.db
```

### Проблемы с email:
```bash
# Проверьте переменные окружения
grep SMTP .env.production
```

### Проблемы с Google Calendar:
```bash
# Проверьте файлы токенов
ls -la database/
```

## 📞 Контакты
При возникновении проблем проверьте логи приложения и nginx.