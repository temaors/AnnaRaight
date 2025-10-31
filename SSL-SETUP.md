# 🔒 Настройка SSL сертификата для Ubuntu

## 📋 Установка Certbot для Let's Encrypt

### 1. Установите Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Получите SSL сертификат
```bash
sudo certbot --nginx -d annaraight.com -d www.annaraight.com
```

### 3. Настройте автоматическое обновление
```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Проверьте статус
sudo systemctl status certbot.timer
```

### 4. Проверьте обновление (тест)
```bash
sudo certbot renew --dry-run
```

## 🌐 Обновленная конфигурация Nginx

После установки SSL, Certbot автоматически обновит конфиг, но вы можете проверить:

```bash
sudo nano /etc/nginx/sites-available/annaraight.com
```

Должно быть примерно так:
```nginx
server {
    server_name annaraight.com www.annaraight.com;

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

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/annaraight.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/annaraight.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.annaraight.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = annaraight.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name annaraight.com www.annaraight.com;
    return 404; # managed by Certbot
}
```

### Проверьте конфигурацию и перезапустите
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🔍 Проверка SSL
Проверьте работу SSL на https://annaraight.com