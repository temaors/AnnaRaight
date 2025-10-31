#!/usr/bin/env python3
"""
Скрипт для получения Google Calendar credentials
Простой способ аутентификации с Google Calendar API
"""

import os
import sys
import json
from pathlib import Path

# Добавляем путь к модулям
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.google_calendar_auth import GoogleCalendarAuth


def main():
    """Основная функция для получения credentials"""
    print("🔐 Google Calendar Credentials Setup")
    print("=" * 50)
    
    # Проверяем наличие файла credentials (сначала локальный, потом основной)
    credentials_file = 'client_secret_local.json'
    if not os.path.exists(credentials_file):
        credentials_file = 'client_secret_152901079701_4c64bjjv7evk6s9gne5nhqkk3nh92dk5_apps.json'
    
    if not os.path.exists(credentials_file):
        print(f"❌ Файл {credentials_file} не найден!")
        print("Убедитесь, что файл с client_secret находится в текущей директории.")
        return
    
    print(f"✅ Файл {credentials_file} найден")
    
    # Создаем экземпляр класса аутентификации
    auth = GoogleCalendarAuth(credentials_file=credentials_file)
    
    print("\n🚀 Начинаем процесс аутентификации...")
    print("Откроется браузер для авторизации Google Calendar")
    print("После авторизации токен будет сохранен автоматически")
    
    try:
        # Получаем credentials
        credentials = auth.get_credentials()
        
        if credentials:
            print("\n✅ Аутентификация успешна!")
            print("Токен сохранен и готов к использованию")
            
            # Тестируем подключение
            print("\n🧪 Тестируем подключение к Google Calendar...")
            test_result = auth.test_connection()
            
            if test_result['success']:
                print("✅ Подключение к Google Calendar работает!")
                if test_result['calendar_info']:
                    print(f"   📅 Календарь: {test_result['calendar_info']['summary']}")
                    print(f"   🆔 ID: {test_result['calendar_info']['id']}")
                    print(f"   🌍 Часовой пояс: {test_result['calendar_info']['timezone']}")
                print(f"   📊 Событий в календаре: {test_result['events_count']}")
            else:
                print(f"❌ Ошибка подключения: {test_result['message']}")
                
        else:
            print("❌ Не удалось получить credentials")
            print("Проверьте настройки в Google Cloud Console")
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Процесс прерван пользователем")
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        print("Проверьте настройки и попробуйте снова")


if __name__ == '__main__':
    main()
