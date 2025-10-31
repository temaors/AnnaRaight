#!/usr/bin/env python3
"""
Точная аутентификация с явным указанием redirect URI
"""

import os
import sys
import json
from google_auth_oauthlib.flow import InstalledAppFlow

# Scopes для Google Calendar
SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
]

def main():
    print("🔐 Google Calendar Precise Authentication")
    print("=" * 50)
    
    # Проверяем файл конфигурации
    credentials_file = 'client_secret_152901079701_4c64bjjv7evk6s9gne5nhqkk3nh92dk5_apps.json'
    if not os.path.exists(credentials_file):
        credentials_file = 'client_secret_local.json'
        if not os.path.exists(credentials_file):
            credentials_file = 'client_secret_152901079701_gjoj1cht43qelk0jtmov6666k0l7q9kg_apps.json'
    
    if not os.path.exists(credentials_file):
        print(f"❌ Файл {credentials_file} не найден!")
        return
    
    print(f"✅ Используем файл: {credentials_file}")
    
    try:
        # Читаем конфигурацию
        with open(credentials_file, 'r') as f:
            config = json.load(f)
        
        # Создаем flow с явным указанием redirect URI
        flow = InstalledAppFlow.from_client_config(
            config,
            scopes=SCOPES,
            redirect_uri='http://annaraight.com'
        )
        
        print("\n🚀 Запускаем OAuth flow...")
        print("Redirect URI: http://annaraight.com")
        print("Откроется браузер для авторизации")
        
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
        print("\n💡 Проверьте:")
        print("1. В Google Cloud Console должен быть redirect URI:")
        print("   http://annaraight.com/api/google-calendar/auth")
        print("2. Google Calendar API должен быть включен")
        print("3. Файл credentials должен быть корректен")

if __name__ == '__main__':
    main()
