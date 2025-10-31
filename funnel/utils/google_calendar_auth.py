"""
Google Calendar Authentication Module
Модуль для аутентификации и получения credentials для Google Calendar API
"""

import os
import json
import pickle
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from config import Config


class GoogleCalendarAuth:
    """Класс для аутентификации с Google Calendar API"""
    
    # Scopes для доступа к Google Calendar
    SCOPES = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
    ]
    
    def __init__(self, credentials_file: str = None, token_file: str = None):
        """
        Инициализация Google Calendar Auth
        
        Args:
            credentials_file: Путь к файлу с credentials (client_secret)
            token_file: Путь к файлу для сохранения токена
        """
        # Сначала пробуем локальный файл, потом основной
        if credentials_file is None:
            if os.path.exists('client_secret_local.json'):
                credentials_file = 'client_secret_local.json'
            else:
                credentials_file = 'client_secret_152901079701_4c64bjjv7evk6s9gne5nhqkk3nh92dk5_apps.json'
        
        self.credentials_file = credentials_file
        self.token_file = token_file or Config.GOOGLE_TOKEN_FILE
        self.credentials = None
        self.service = None
        
    def get_credentials(self) -> Optional[Credentials]:
        """
        Получение credentials для Google Calendar API
        
        Returns:
            Credentials объект или None если аутентификация не удалась
        """
        # Проверяем, есть ли уже сохраненный токен
        if os.path.exists(self.token_file):
            try:
                with open(self.token_file, 'rb') as token:
                    self.credentials = pickle.load(token)
            except Exception as e:
                print(f"Ошибка загрузки токена: {e}")
                self.credentials = None
        
        # Если нет валидных credentials, запрашиваем новые
        if not self.credentials or not self.credentials.valid:
            if self.credentials and self.credentials.expired and self.credentials.refresh_token:
                # Обновляем истекший токен
                try:
                    self.credentials.refresh(Request())
                    print("Токен успешно обновлен")
                except Exception as e:
                    print(f"Ошибка обновления токена: {e}")
                    self.credentials = None
            
            if not self.credentials:
                # Запускаем OAuth flow для получения новых credentials
                try:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_file, 
                        self.SCOPES
                    )
                    # Используем порт 3000, который указан в redirect_uris
                    self.credentials = flow.run_local_server(port=3000)
                    print("Новые credentials получены успешно")
                except Exception as e:
                    print(f"Ошибка получения credentials: {e}")
                    return None
            
            # Сохраняем credentials для будущего использования
            try:
                os.makedirs(os.path.dirname(self.token_file), exist_ok=True)
                with open(self.token_file, 'wb') as token:
                    pickle.dump(self.credentials, token)
                print(f"Credentials сохранены в {self.token_file}")
            except Exception as e:
                print(f"Ошибка сохранения токена: {e}")
        
        return self.credentials
    
    def get_service(self):
        """
        Получение сервиса Google Calendar API
        
        Returns:
            Google Calendar service объект или None
        """
        if not self.credentials:
            self.credentials = self.get_credentials()
        
        if not self.credentials:
            print("Не удалось получить credentials")
            return None
        
        try:
            self.service = build('calendar', 'v3', credentials=self.credentials)
            print("Google Calendar service создан успешно")
            return self.service
        except Exception as e:
            print(f"Ошибка создания service: {e}")
            return None
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Тестирование подключения к Google Calendar
        
        Returns:
            Словарь с результатами теста
        """
        result = {
            'success': False,
            'message': '',
            'calendar_info': None,
            'events_count': 0
        }
        
        try:
            service = self.get_service()
            if not service:
                result['message'] = 'Не удалось создать service'
                return result
            
            # Получаем информацию о календаре
            calendar_list = service.calendarList().list().execute()
            calendars = calendar_list.get('items', [])
            
            if calendars:
                primary_calendar = next(
                    (cal for cal in calendars if cal.get('primary', False)), 
                    calendars[0]
                )
                result['calendar_info'] = {
                    'id': primary_calendar.get('id'),
                    'summary': primary_calendar.get('summary'),
                    'timezone': primary_calendar.get('timeZone')
                }
            
            # Получаем количество событий
            now = datetime.utcnow().isoformat() + 'Z'
            events_result = service.events().list(
                calendarId='primary',
                timeMin=now,
                maxResults=10,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            result['events_count'] = len(events)
            result['success'] = True
            result['message'] = 'Подключение к Google Calendar успешно'
            
        except HttpError as e:
            result['message'] = f'HTTP ошибка: {e}'
        except Exception as e:
            result['message'] = f'Ошибка: {e}'
        
        return result
    
    def create_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Создание события в Google Calendar
        
        Args:
            event_data: Данные события
            
        Returns:
            Результат создания события
        """
        result = {
            'success': False,
            'message': '',
            'event_id': None,
            'event_link': None
        }
        
        try:
            service = self.get_service()
            if not service:
                result['message'] = 'Не удалось создать service'
                return result
            
            # Создаем событие
            event = service.events().insert(
                calendarId='primary',
                body=event_data
            ).execute()
            
            result['success'] = True
            result['event_id'] = event.get('id')
            result['event_link'] = event.get('htmlLink')
            result['message'] = 'Событие создано успешно'
            
        except HttpError as e:
            result['message'] = f'HTTP ошибка при создании события: {e}'
        except Exception as e:
            result['message'] = f'Ошибка при создании события: {e}'
        
        return result
    
    def get_available_slots(self, date: str, duration_minutes: int = 60) -> Dict[str, Any]:
        """
        Получение доступных слотов для записи
        
        Args:
            date: Дата в формате YYYY-MM-DD
            duration_minutes: Длительность встречи в минутах
            
        Returns:
            Список доступных слотов
        """
        result = {
            'success': False,
            'message': '',
            'available_slots': []
        }
        
        try:
            service = self.get_service()
            if not service:
                result['message'] = 'Не удалось создать service'
                return result
            
            # Время начала и конца дня
            start_time = f"{date}T00:00:00Z"
            end_time = f"{date}T23:59:59Z"
            
            # Получаем события на указанную дату
            events_result = service.events().list(
                calendarId='primary',
                timeMin=start_time,
                timeMax=end_time,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            
            # Генерируем доступные слоты
            available_slots = []
            for hour in range(9, 18):  # Рабочие часы 9:00-18:00
                for minute in [0, 15, 30, 45]:  # Слоты каждые 15 минут
                    slot_start = f"{date}T{hour:02d}:{minute:02d}:00"
                    slot_end = f"{date}T{(hour + duration_minutes // 60):02d}:{(minute + duration_minutes % 60):02d}:00"
                    
                    # Проверяем, не пересекается ли слот с существующими событиями
                    is_available = True
                    for event in events:
                        event_start = event['start'].get('dateTime', event['start'].get('date'))
                        event_end = event['end'].get('dateTime', event['end'].get('date'))
                        
                        if (slot_start < event_end and slot_end > event_start):
                            is_available = False
                            break
                    
                    if is_available:
                        available_slots.append(f"{hour:02d}:{minute:02d}")
            
            result['success'] = True
            result['available_slots'] = available_slots
            result['message'] = f'Найдено {len(available_slots)} доступных слотов'
            
        except Exception as e:
            result['message'] = f'Ошибка получения слотов: {e}'
        
        return result


def main():
    """Основная функция для тестирования аутентификации"""
    print("🔐 Тестирование Google Calendar Authentication")
    print("=" * 50)
    
    # Создаем экземпляр класса
    auth = GoogleCalendarAuth()
    
    # Получаем credentials
    print("1. Получение credentials...")
    credentials = auth.get_credentials()
    
    if credentials:
        print("✅ Credentials получены успешно")
        print(f"   - Access token: {'Есть' if credentials.token else 'Нет'}")
        print(f"   - Refresh token: {'Есть' if credentials.refresh_token else 'Нет'}")
        print(f"   - Expired: {'Да' if credentials.expired else 'Нет'}")
    else:
        print("❌ Не удалось получить credentials")
        return
    
    # Тестируем подключение
    print("\n2. Тестирование подключения...")
    test_result = auth.test_connection()
    
    if test_result['success']:
        print("✅ Подключение к Google Calendar успешно")
        if test_result['calendar_info']:
            print(f"   - Календарь: {test_result['calendar_info']['summary']}")
            print(f"   - ID: {test_result['calendar_info']['id']}")
            print(f"   - Часовой пояс: {test_result['calendar_info']['timezone']}")
        print(f"   - Событий в календаре: {test_result['events_count']}")
    else:
        print(f"❌ Ошибка подключения: {test_result['message']}")
    
    # Тестируем получение доступных слотов
    print("\n3. Тестирование получения доступных слотов...")
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    slots_result = auth.get_available_slots(tomorrow)
    
    if slots_result['success']:
        print(f"✅ Доступные слоты на {tomorrow}:")
        for slot in slots_result['available_slots'][:10]:  # Показываем первые 10
            print(f"   - {slot}")
        if len(slots_result['available_slots']) > 10:
            print(f"   ... и еще {len(slots_result['available_slots']) - 10} слотов")
    else:
        print(f"❌ Ошибка получения слотов: {slots_result['message']}")
    
    print("\n" + "=" * 50)
    print("🎉 Тестирование завершено!")


if __name__ == '__main__':
    main()
