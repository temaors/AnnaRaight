# 🚀 Ручной деплой - пошаговая инструкция

## 🔐 Проблема с автоматическим деплоем
Автоматический деплой не может подключиться к серверу. Возможные причины:
- Пароль изменился 
- SSH настройки сервера не разрешают password authentication
- Firewall блокирует соединения

## 📋 Ручная установка

### 1. Подключитесь к серверу
```bash
ssh ubuntu@51.38.125.120
# При запросе пароля введите: Chatbot1!!!
```

Если не получается подключиться, проверьте:
- Правильность IP адреса
- Правильность пароля  
- Не заблокирован ли порт 22

### 2. Установите базовые компоненты (если не установлены)
```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установите PM2
sudo npm install -g pm2

# Установите Nginx
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 3. Создайте пользователя funnel
```bash
# Создайте системного пользователя
sudo adduser --system --group --shell /bin/bash funnel

# Настройте домашнюю директорию
sudo mkdir -p /home/funnel
sudo chown funnel:funnel /home/funnel
sudo usermod -d /home/funnel funnel

# Создайте директорию приложения
sudo mkdir -p /var/www/funnel-app
sudo chown funnel:funnel /var/www/funnel-app
```

### 4. Загрузите файлы приложения
На **локальном компьютере** создайте архив:
```bash
cd /Users/jan/Desktop/funnel-master-main
tar --exclude='node_modules' --exclude='.next' --exclude='.git' -czf funnel-app.tar.gz .
```

Затем скопируйте на сервер одним из способов:

**Способ 1 - через SCP (если SSH работает):**
```bash
scp funnel-app.tar.gz ubuntu@51.38.125.120:/tmp/
```

**Способ 2 - через SFTP:**
```bash
sftp ubuntu@51.38.125.120
put funnel-app.tar.gz /tmp/
quit
```

**Способ 3 - через веб-панель хостинга:**
Если у вас есть веб-панель, загрузите архив через неё.

### 5. На сервере установите приложение
```bash
# Перейдите в директорию приложения
cd /var/www/funnel-app

# Распакуйте архив
sudo -u funnel tar -xzf /tmp/funnel-app.tar.gz

# Настройте npm для пользователя funnel
sudo -u funnel npm config set cache /home/funnel/.npm
sudo -u funnel npm config set prefix /home/funnel/.npm-global

# Установите зависимости
sudo -u funnel npm install --production

# Соберите проект
sudo -u funnel npm run build

# Создайте необходимые директории
sudo -u funnel mkdir -p data logs public/uploads
sudo -u funnel chmod 755 data logs public/uploads
```

### 6. Создайте конфигурацию окружения
```bash
sudo -u funnel nano /var/www/funnel-app/.env.production
```

Добавьте:
```env
DATABASE_URL="file:./data/funnel.db"
NEXT_PUBLIC_BASE_URL="http://51.38.125.120:3000"

# Email настройки WHC
SMTP_HOST="mail.annaraight.com"
SMTP_PORT="465" 
SMTP_USER="hello@annaraight.com"
SMTP_PASSWORD="ваш-email-пароль"

# Google Calendar
GOOGLE_CALENDAR_CREDENTIALS_PATH="./database/credentials.json"
GOOGLE_CALENDAR_TOKEN_PATH="./database/token.json"
```

### 7. Запустите приложение через PM2
```bash
cd /var/www/funnel-app
sudo -u funnel pm2 start ecosystem.config.js
sudo -u funnel pm2 save
sudo -u funnel pm2 startup
```

### 8. Настройте Nginx
```bash
sudo nano /etc/nginx/sites-available/annaraight.com
```

Добавьте конфигурацию:
```nginx
server {
    listen 80;
    server_name annaraight.com www.annaraight.com 51.38.125.120;

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
}
```

Активируйте сайт:
```bash
sudo ln -sf /etc/nginx/sites-available/annaraight.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 9. Настройте файрвол
```bash
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
```

### 10. Проверьте работу
```bash
# Проверьте статус PM2
sudo -u funnel pm2 list
sudo -u funnel pm2 logs

# Проверьте статус Nginx
sudo systemctl status nginx

# Проверьте порты
sudo netstat -tlnp | grep -E ':(80|3000)'
```

## 🌐 Проверка результата
Откройте в браузере:
- http://51.38.125.120:3000 (прямой доступ к приложению)
- http://51.38.125.120 (через Nginx)

## 🔧 Команды для управления

### PM2
```bash
sudo -u funnel pm2 list          # список процессов
sudo -u funnel pm2 logs          # логи
sudo -u funnel pm2 restart all   # перезапуск
sudo -u funnel pm2 stop all      # остановка
```

### Nginx
```bash
sudo systemctl status nginx      # статус
sudo systemctl restart nginx     # перезапуск  
sudo nginx -t                   # проверка конфигурации
```

## 🐛 Решение проблем

### Если приложение не запускается:
```bash
# Проверьте логи PM2
sudo -u funnel pm2 logs

# Проверьте права на файлы
sudo chown -R funnel:funnel /var/www/funnel-app

# Попробуйте запустить вручную
cd /var/www/funnel-app
sudo -u funnel npm start
```

### Если сайт не открывается:
```bash
# Проверьте что приложение работает
curl http://localhost:3000

# Проверьте Nginx
sudo nginx -t
sudo systemctl status nginx

# Проверьте файрвол
sudo ufw status
```

## 📞 Следующие шаги
После успешного деплоя:
1. Настройте DNS записи для annaraight.com
2. Установите SSL сертификат: `sudo certbot --nginx -d annararight.com`
3. Протестируйте все функции приложения