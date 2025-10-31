#!/bin/bash

# 🚀 Скрипт автоматического деплоя
# Использование: ./deploy.sh [server-address] [deploy-path]

set -e

SERVER=${1:-"ubuntu@51.38.125.120"}
DEPLOY_PATH="/var/www/funnel-app"
APP_NAME="funnel-app"
USER="funnel"

echo "🚀 Начинаем деплой на $SERVER в $DEPLOY_PATH"

# 1. Создаем архив
echo "📦 Создаем архив..."
tar --exclude-from='.deployignore' --exclude='node_modules' --exclude='.next' -czf funnel-deploy.tar.gz .

# 2. Загружаем на сервер
echo "⬆️ Загружаем на сервер..."
scp funnel-deploy.tar.gz $SERVER:/tmp/

# 3. Выполняем команды на сервере
echo "🔧 Устанавливаем на сервере..."
ssh $SERVER << EOF
    # Создаем пользователя если не существует
    sudo adduser --system --group --shell /bin/bash $USER || true
    
    # Настраиваем домашнюю директорию для funnel пользователя
    sudo mkdir -p /home/$USER
    sudo chown $USER:$USER /home/$USER
    sudo usermod -d /home/$USER $USER
    
    # Создаем директорию если не существует
    sudo mkdir -p $DEPLOY_PATH
    sudo chown $USER:$USER $DEPLOY_PATH
    
    # Останавливаем приложение
    sudo -u $USER pm2 stop $APP_NAME || true
    
    # Backup старой версии
    if [ -d "$DEPLOY_PATH/package.json" ]; then
        sudo mv $DEPLOY_PATH $DEPLOY_PATH.backup.\$(date +%Y%m%d_%H%M%S) || true
        sudo mkdir -p $DEPLOY_PATH
        sudo chown $USER:$USER $DEPLOY_PATH
    fi
    
    # Распаковываем новую версию
    cd $DEPLOY_PATH
    sudo -u $USER tar -xzf /tmp/funnel-deploy.tar.gz
    
    # Настраиваем npm для пользователя funnel
    sudo -u $USER npm config set cache /home/$USER/.npm
    sudo -u $USER npm config set prefix /home/$USER/.npm-global
    
    # Устанавливаем зависимости
    sudo -u $USER npm install --production
    
    # Собираем проект
    sudo -u $USER npm run build
    
    # Создаем необходимые директории
    sudo -u $USER mkdir -p data logs public/uploads
    sudo -u $USER chmod 755 data logs public/uploads
    
    # Запускаем приложение
    sudo -u $USER pm2 start ecosystem.config.js
    sudo -u $USER pm2 save
    
    # Очищаем временные файлы
    rm -f /tmp/funnel-deploy.tar.gz
EOF

# 4. Очищаем локальные файлы
rm -f funnel-deploy.tar.gz

echo "✅ Деплой завершен! Проверьте https://annaraight.com"
echo "📊 Логи: pm2 logs $APP_NAME"