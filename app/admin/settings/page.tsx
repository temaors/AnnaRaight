'use client';

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminSettingsPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<{
    isScheduled: boolean;
    isRunning: boolean;
    isProcessing: boolean;
    nextRun: string;
  } | null>(null);
  const [loadingScheduler, setLoadingScheduler] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Favicon management
  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const formData = new FormData();
      formData.append('favicon', file);

      const response = await fetch('/api/admin/favicon', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadMessage({ type: 'success', text: 'Favicon обновлен успешно! Обновите страницу чтобы увидеть изменения.' });
        // Clear the input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setUploadMessage({ type: 'error', text: result.error || 'Не удалось загрузить favicon' });
      }
    } catch (error) {
      setUploadMessage({ type: 'error', text: 'Ошибка при загрузке файла' });
      console.error('Favicon upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRestoreFavicon = async () => {
    setIsUploading(true);
    setUploadMessage(null);

    try {
      const response = await fetch('/api/admin/favicon', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setUploadMessage({ type: 'success', text: 'Favicon восстановлен из резервной копии' });
      } else {
        setUploadMessage({ type: 'error', text: result.error || 'Не удалось восстановить favicon' });
      }
    } catch (error) {
      setUploadMessage({ type: 'error', text: 'Ошибка при восстановлении favicon' });
      console.error('Favicon restore error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Reminder scheduler management
  const fetchSchedulerStatus = async () => {
    setLoadingScheduler(true);
    try {
      const response = await fetch('/api/reminders/scheduler');
      const result = await response.json();
      
      if (result.success) {
        setSchedulerStatus(result.status);
      }
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
    } finally {
      setLoadingScheduler(false);
    }
  };

  const controlScheduler = async (action: 'start' | 'stop' | 'trigger') => {
    setLoadingScheduler(true);
    try {
      const response = await fetch('/api/reminders/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSchedulerStatus(result.status);
        setUploadMessage({ type: 'success', text: result.message });
      } else {
        setUploadMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setUploadMessage({ type: 'error', text: 'Ошибка управления планировщиком' });
      console.error('Scheduler control error:', error);
    } finally {
      setLoadingScheduler(false);
    }
  };

  // Cleanup video views
  const handleCleanupVideoViews = async () => {
    setCleaningUp(true);
    setUploadMessage(null);

    try {
      const response = await fetch('/api/admin/cleanup-video-views', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        setUploadMessage({ 
          type: 'success', 
          text: `Очистка завершена! Удалено ${result.data.recordsRemoved} дублирующих записей.` 
        });
      } else {
        setUploadMessage({ type: 'error', text: result.error || 'Не удалось выполнить очистку' });
      }
    } catch (error) {
      setUploadMessage({ type: 'error', text: 'Ошибка при выполнении очистки' });
      console.error('Cleanup error:', error);
    } finally {
      setCleaningUp(false);
    }
  };

  // Load scheduler status on component mount
  React.useEffect(() => {
    fetchSchedulerStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">⚙️ Настройки администратора</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Управление favicon и системами уведомлений
              </p>
            </div>
            <a 
              href="/admin/leads" 
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← К лидам
            </a>
          </div>
        </div>

        {/* Status Messages */}
        {uploadMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            uploadMessage.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          }`}>
            {uploadMessage.text}
          </div>
        )}

        {/* Favicon Management */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🎨 Управление Favicon</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Загрузите новый favicon для сайта. Поддерживаются форматы: ICO, PNG, JPG (максимум 1MB)
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Выберите файл favicon:
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".ico,.png,.jpg,.jpeg"
                onChange={handleFaviconUpload}
                disabled={isUploading}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>
            
            <div className="flex space-x-4">
              <Button
                onClick={handleRestoreFavicon}
                disabled={isUploading}
                variant="outline"
              >
                {isUploading ? 'Обработка...' : 'Восстановить из резервной копии'}
              </Button>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Текущий favicon: <img src="/favicon.ico" alt="favicon" className="inline w-4 h-4 ml-2" /></p>
              <p className="mt-1">После загрузки нового favicon обновите страницу для отображения изменений.</p>
            </div>
          </div>
        </Card>

        {/* Reminder Scheduler Management */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">📅 Планировщик напоминаний</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Управление автоматическими напоминаниями о встречах (email + SMS за 6 часов до встречи)
          </p>
          
          {schedulerStatus && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
              <h3 className="font-medium mb-2">Статус планировщика:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-900 dark:text-white">
                <div>
                  <span className="font-medium">Запланирован:</span> 
                  <span className={`ml-2 ${schedulerStatus.isScheduled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {schedulerStatus.isScheduled ? '✅ Да' : '❌ Нет'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Активен:</span> 
                  <span className={`ml-2 ${schedulerStatus.isRunning ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {schedulerStatus.isRunning ? '▶️ Запущен' : '⏹️ Остановлен'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Обрабатывает:</span> 
                  <span className={`ml-2 ${schedulerStatus.isProcessing ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {schedulerStatus.isProcessing ? '🔄 Да' : '💤 Нет'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Частота:</span> 
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{schedulerStatus.nextRun}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex space-x-4">
            <Button
              onClick={() => controlScheduler('start')}
              disabled={loadingScheduler || schedulerStatus?.isRunning}
              className="bg-green-600 hover:bg-green-700"
            >
              {loadingScheduler ? 'Обработка...' : '▶️ Запустить'}
            </Button>
            
            <Button
              onClick={() => controlScheduler('stop')}
              disabled={loadingScheduler || !schedulerStatus?.isRunning}
              className="bg-red-600 hover:bg-red-700"
            >
              {loadingScheduler ? 'Обработка...' : '⏹️ Остановить'}
            </Button>
            
            <Button
              onClick={() => controlScheduler('trigger')}
              disabled={loadingScheduler}
              variant="outline"
            >
              {loadingScheduler ? 'Обработка...' : '🔧 Запустить вручную'}
            </Button>
            
            <Button
              onClick={fetchSchedulerStatus}
              disabled={loadingScheduler}
              variant="outline"
            >
              {loadingScheduler ? 'Загрузка...' : '🔄 Обновить статус'}
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>Планировщик проверяет встречи каждые 15 минут и отправляет напоминания за 6 часов до начала.</p>
            <p className="mt-1">Для работы SMS необходимо настроить переменные окружения Twilio.</p>
          </div>
        </Card>

        {/* Data Management */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">🗄️ Управление данными</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Очистка и оптимизация данных аналитики
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Очистка просмотров видео:</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Удаляет дублирующие записи просмотров видео для корректного отображения статистики.
              </p>
              <Button
                onClick={handleCleanupVideoViews}
                disabled={cleaningUp}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {cleaningUp ? 'Очистка...' : '🧹 Очистить дублирующие просмотры'}
              </Button>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>Рекомендуется выполнять очистку периодически для точной аналитики.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}