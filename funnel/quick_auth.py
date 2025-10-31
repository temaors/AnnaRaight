#!/usr/bin/env python3
"""
Быстрый скрипт для получения Google Calendar credentials
"""

import os
import sys
from google_auth_oauthlib.flow import InstalledAppFlow

# Scopes для Google Calendar
SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
]

def main():
    print("🔐 Быстрая аутентификация Google Calendar")
    print("=" * 50)
    
    # Проверяем файл конфигурации
    credentials_file = 'client_secret_local.json'
    if not os.path.exists(credentials_file):
        credentials_file = 'client_secret_152901079701_4c64bjjv7evk6s9gne5nhqkk3nh92dk5_apps.json'
    
    if not os.path.exists(credentials_file):
        print(f"❌ Файл {credentials_file} не найден!")
        return
    
    print(f"✅ Используем файл: {credentials_file}")
    
    try:
        # Создаем flow
        flow = InstalledAppFlow.from_client_secrets_file(
            credentials_file, 
            SCOPES
        )
        
        print("\n🚀 Запускаем OAuth flow...")
        print("Откроется браузер для авторизации")
        print("После авторизации закройте браузер")
        
        # Запускаем локальный сервер на порту 3000
        credentials = flow.run_local_server(port=3000)
        
        print("\n✅ Аутентификация успешна!")
        print(f"Access token: {'Есть' if credentials.token else 'Нет'}")
        print(f"Refresh token: {'Есть' if credentials.refresh_token else 'Нет'}")
        
        # Сохраняем токен
        token_file = 'database/token.json'
        os.makedirs(os.path.dirname(token_file), exist_ok=True)
        
        import pickle
        with open(token_file, 'wb') as token:
            pickle.dump(credentials, token)
        
        print(f"✅ Токен сохранен в {token_file}")
        
        # Тестируем подключение
        print("\n🧪 Тестируем подключение...")
        from googleapiclient.discovery import build
        
        service = build('calendar', 'v3', credentials=credentials)
        calendar_list = service.calendarList().list().execute()
        calendars = calendar_list.get('items', [])
        
        if calendars:
            primary_calendar = next(
                (cal for cal in calendars if cal.get('primary', False)), 
                calendars[0]
            )
            print(f"✅ Подключение успешно!")
            print(f"📅 Календарь: {primary_calendar.get('summary')}")
            print(f"🆔 ID: {primary_calendar.get('id')}")
        else:
            print("❌ Не удалось получить календари")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        print("\n💡 Возможные решения:")
        print("1. Убедитесь, что в Google Cloud Console добавлены redirect URIs:")
        print("   - http://annaraight.com")
        print("   - http://127.0.0.1:3000")
        print("2. Проверьте, что Google Calendar API включен в проекте")
        print("3. Убедитесь, что файл credentials корректен")

if __name__ == '__main__':
    main()
