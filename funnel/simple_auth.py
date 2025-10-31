#!/usr/bin/env python3
"""
Простой скрипт для получения Google Calendar credentials
"""

import os
import sys
import json
import requests
from urllib.parse import urlencode, parse_qs, urlparse

def main():
    print("🔐 Google Calendar Simple Authentication")
    print("=" * 50)
    
    # Читаем конфигурацию
    credentials_file = '../client_secret_152901079701_4c64bjjv7evk6s9gne5nhqkk3nh92dk5_apps.json'
    
    try:
        with open(credentials_file, 'r') as f:
            config = json.load(f)
        
        client_id = config['web']['client_id']
        client_secret = config['web']['client_secret']
        redirect_uris = config['web'].get('redirect_uris', [])
        
        print(f"✅ Client ID: {client_id}")
        print(f"✅ Redirect URIs в файле:")
        for uri in redirect_uris:
            print(f"   - {uri}")
        
        # Scopes для Google Calendar
        scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ]
        
        # Используем localhost для избежания проблем с верификацией
        redirect_uri = 'http://annaraight.com'
        if redirect_uri not in redirect_uris:
            print(f"⚠️  Внимание: {redirect_uri} не найден в списке разрешенных redirect URIs")
            print("Доступные URIs:")
            for uri in redirect_uris:
                print(f"   - {uri}")
            redirect_uri = redirect_uris[0] if redirect_uris else 'http://annaraight.com'
        
        # Параметры для OAuth URL
        params = {
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'scope': ' '.join(scopes),
            'response_type': 'code',
            'access_type': 'offline',
            'prompt': 'consent'
        }
        
        # Генерируем URL для авторизации
        auth_url = f"https://accounts.google.com/o/oauth2/auth?{urlencode(params)}"
        
        print(f"\n🚀 Шаги для авторизации:")
        print(f"1. Скопируйте URL ниже и откройте в браузере:")
        print("-" * 50)
        print(auth_url)
        print("-" * 50)
        print(f"\n2. Войдите в свой Google аккаунт")
        print(f"3. Разрешите доступ к Google Calendar")
        print(f"4. Скопируйте ПОЛНЫЙ URL из адресной строки браузера")
        print(f"5. Вставьте его ниже:")
        
        # Получаем URL от пользователя
        full_url = input("\nВставьте полный URL из браузера: ").strip()
        
        if not full_url:
            print("❌ URL не введен")
            return
        
        # Парсим URL и извлекаем код
        parsed_url = urlparse(full_url)
        query_params = parse_qs(parsed_url.query)
        
        auth_code = query_params.get('code', [None])[0]
        
        if not auth_code:
            print("❌ Код авторизации не найден в URL")
            print("Убедитесь, что вы скопировали полный URL с параметром 'code'")
            return
        
        print(f"\n✅ Код авторизации получен: {auth_code[:20]}...")
        
        # Обмениваем код на токен
        print("\n🔄 Обмениваем код на токен...")
        
        token_data = {
            'client_id': client_id,
            'client_secret': client_secret,
            'code': auth_code,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri
        }
        
        response = requests.post('https://oauth2.googleapis.com/token', data=token_data)
        
        if response.status_code == 200:
            token_info = response.json()
            
            print("✅ Токен получен успешно!")
            print(f"   - Access token: {'Есть' if token_info.get('access_token') else 'Нет'}")
            print(f"   - Refresh token: {'Есть' if token_info.get('refresh_token') else 'Нет'}")
            print(f"   - Expires in: {token_info.get('expires_in', 'N/A')} секунд")
            
            # Сохраняем токен
            token_file = 'database/token.json'
            os.makedirs(os.path.dirname(token_file), exist_ok=True)
            
            with open(token_file, 'w') as f:
                json.dump(token_info, f, indent=2)
            
            print(f"✅ Токен сохранен в {token_file}")
            
            # Тестируем подключение
            print("\n🧪 Тестируем подключение к Google Calendar...")
            
            headers = {
                'Authorization': f"Bearer {token_info['access_token']}"
            }
            
            calendar_response = requests.get(
                'https://www.googleapis.com/calendar/v3/users/me/calendarList',
                headers=headers
            )
            
            if calendar_response.status_code == 200:
                calendars = calendar_response.json().get('items', [])
                print(f"✅ Подключение успешно!")
                print(f"📅 Найдено календарей: {len(calendars)}")
                
                if calendars:
                    primary_calendar = next(
                        (cal for cal in calendars if cal.get('primary', False)), 
                        calendars[0]
                    )
                    print(f"📅 Основной календарь: {primary_calendar.get('summary')}")
                    print(f"🆔 ID: {primary_calendar.get('id')}")
            else:
                print(f"❌ Ошибка подключения к календарю: {calendar_response.status_code}")
                print(f"Ответ: {calendar_response.text}")
                
        else:
            print(f"❌ Ошибка получения токена: {response.status_code}")
            print(f"Ответ: {response.text}")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == '__main__':
    main()
