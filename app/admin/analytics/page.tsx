'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface VideoStats {
  unique_viewers: number;
  total_views: number;
  avg_duration: number;
  avg_percentage: number;
  completed_views: number;
  max_duration: number;
}

interface VideoByPage {
  video_page: string;
  unique_viewers: number;
  total_views: number;
  avg_duration: number;
  avg_percentage: number;
}

interface FunnelStat {
  page_visited: string;
  unique_visitors: number;
  total_visits: number;
  last_visit: string;
}

interface ConversionFunnel {
  start_page: number;
  watch_page: number;
  schedule_page: number;
  confirmed_page: number;
}

interface DailyStat {
  date: string;
  unique_visitors: number;
  total_pageviews: number;
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [videoStats, setVideoStats] = useState<VideoStats | null>(null);
  const [videoByPage, setVideoByPage] = useState<VideoByPage[]>([]);
  const [funnelStats, setFunnelStats] = useState<FunnelStat[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnel | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      const result = await response.json();
      
      if (result.success) {
        setVideoStats(result.data.videoStats);
        setVideoByPage(result.data.videoByPage || []);
        setFunnelStats(result.data.funnelStats || []);
        setConversionFunnel(result.data.conversionFunnel);
        setDailyStats(result.data.dailyStats || []);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0с';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return minutes > 0 ? `${minutes}м ${remainingSeconds}с` : `${remainingSeconds}с`;
  };

  const calculateConversionRate = (from: number, to: number) => {
    if (!from || from === 0) return '0';
    return ((to / from) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка аналитики...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📊 Аналитика и статистика</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Детальная статистика по видео и воронке продаж
              </p>
            </div>
            <div className="flex space-x-3">
              <a 
                href="/admin/leads" 
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                📊 К лидам
              </a>
              <a 
                href="/admin/settings" 
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                ⚙️ Настройки
              </a>
            </div>
          </div>
        </div>

        {/* Video Statistics Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">📹 Статистика просмотров видео</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {videoStats?.unique_viewers || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Уникальных зрителей</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {videoStats?.total_views || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Всего просмотров</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatDuration(videoStats?.avg_duration || 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Среднее время просмотра</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {(videoStats?.avg_percentage || 0).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Средний % просмотра</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {videoStats?.completed_views || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Досмотрели до конца</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {formatDuration(videoStats?.max_duration || 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Макс. время просмотра</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Funnel Conversion */}
        {conversionFunnel && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">🎯 Воронка конверсии</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-32 text-right font-medium">Старт</div>
                  <div className="w-64 bg-gray-200 rounded-full h-8 relative">
                    <div 
                      className="bg-purple-600 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ width: '100%' }}
                    >
                      {conversionFunnel.start_page || 0}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">100%</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-32 text-right font-medium">Видео</div>
                  <div className="w-64 bg-gray-200 rounded-full h-8 relative">
                    <div 
                      className="bg-blue-600 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ width: `${calculateConversionRate(conversionFunnel.start_page, conversionFunnel.watch_page)}%` }}
                    >
                      {conversionFunnel.watch_page || 0}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {calculateConversionRate(conversionFunnel.start_page, conversionFunnel.watch_page)}%
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-32 text-right font-medium">Запись</div>
                  <div className="w-64 bg-gray-200 rounded-full h-8 relative">
                    <div 
                      className="bg-green-600 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ width: `${calculateConversionRate(conversionFunnel.start_page, conversionFunnel.schedule_page)}%` }}
                    >
                      {conversionFunnel.schedule_page || 0}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {calculateConversionRate(conversionFunnel.start_page, conversionFunnel.schedule_page)}%
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-32 text-right font-medium">Подтверждение</div>
                  <div className="w-64 bg-gray-200 rounded-full h-8 relative">
                    <div 
                      className="bg-orange-600 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ width: `${calculateConversionRate(conversionFunnel.start_page, conversionFunnel.confirmed_page)}%` }}
                    >
                      {conversionFunnel.confirmed_page || 0}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {calculateConversionRate(conversionFunnel.start_page, conversionFunnel.confirmed_page)}%
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Page Statistics */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📄 Статистика по страницам</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Страница</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Уникальных посетителей</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Всего посещений</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Последнее посещение</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {funnelStats.map((stat, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{stat.page_visited}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 text-right">{stat.unique_visitors}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 text-right">{stat.total_visits}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {new Date(stat.last_visit).toLocaleDateString('ru-RU')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Video by Page */}
        {videoByPage.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">📺 Видео статистика по страницам</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Видео страница</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Уникальных зрителей</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Всего просмотров</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Среднее время</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Средний %</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {videoByPage.map((video, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{video.video_page}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 text-right">{video.unique_viewers}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 text-right">{video.total_views}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 text-right">{formatDuration(video.avg_duration)}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 text-right">{video.avg_percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Daily Statistics */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">📈 Статистика за последние 7 дней</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Дата</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Уникальных посетителей</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Просмотров страниц</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {dailyStats.map((stat, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(stat.date).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 text-right">{stat.unique_visitors}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 text-right">{stat.total_pageviews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}