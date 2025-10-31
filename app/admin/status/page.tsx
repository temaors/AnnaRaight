'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface StatusHistory {
  id: number;
  lead_id: number;
  old_status: string;
  new_status: string;
  status_type: string;
  trigger_event: string;
  notes?: string;
  created_at: string;
  lead_name?: string;
  lead_email?: string;
}

interface StatusStats {
  byStage: Array<{
    funnel_stage: string;
    count: number;
    avg_score: number;
    max_score: number;
  }>;
  totalLeads: number;
  conversionRates: Record<string, number>;
}

export default function AdminStatusPage() {
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [statusStats, setStatusStats] = useState<StatusStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'statistics'>('statistics');

  useEffect(() => {
    fetchStatusData();
  }, []);

  const fetchStatusData = async () => {
    try {
      const response = await fetch('/api/admin/status');
      const result = await response.json();
      
      if (result.success) {
        setStatusHistory(result.data.history);
        setStatusStats(result.data.stats);
      } else {
        console.error('Error fetching status data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching status data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      'new': 'Новый лид',
      'video_started': 'Начал смотреть видео',
      'video_completed': 'Завершил видео',
      'appointment_scheduled': 'Записался на встречу',
      'appointment_attended': 'Посетил встречу',
      'invoice_sent': 'Отправлен инвойс',
      'paid_customer': 'Оплатил'
    };
    return labels[stage] || stage;
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-gray-100 text-gray-800',
      'video_started': 'bg-blue-100 text-blue-800',
      'video_completed': 'bg-indigo-100 text-indigo-800',
      'appointment_scheduled': 'bg-yellow-100 text-yellow-800',
      'appointment_attended': 'bg-purple-100 text-purple-800',
      'invoice_sent': 'bg-orange-100 text-orange-800',
      'paid_customer': 'bg-green-100 text-green-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка данных о статусах...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📊 Статусы пользователей</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Отслеживание прогресса пользователей по воронке
              </p>
            </div>
            <div className="flex space-x-3">
              <a 
                href="/admin/leads" 
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                📊 Лиды
              </a>
              <a 
                href="/admin/analytics" 
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                📈 Аналитика
              </a>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('statistics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'statistics'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                📊 Статистика
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                📜 История изменений
              </button>
            </nav>
          </div>
        </div>

        {/* Statistics Tab */}
        {activeTab === 'statistics' && statusStats && (
          <div className="space-y-6">
            {/* Stage Distribution */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">🎯 Распределение по этапам воронки</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
                {statusStats.byStage.map((stage) => (
                  <div key={stage.funnel_stage} className="text-center">
                    <div className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full mb-2 ${getStageColor(stage.funnel_stage)}`}>
                      {getStageLabel(stage.funnel_stage)}
                    </div>
                    <div className="text-2xl font-bold">{stage.count}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Ср. балл: {Math.round(stage.avg_score)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <div className="text-lg text-gray-600 dark:text-gray-400">
                  Всего лидов: <span className="font-bold text-2xl text-purple-600">{statusStats.totalLeads}</span>
                </div>
              </div>
            </Card>

            {/* Conversion Rates */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">📈 Конверсии между этапами</h2>
              
              <div className="space-y-4 text-gray-900 dark:text-white">
                {Object.entries(statusStats.conversionRates).map(([key, rate]) => {
                  const [from, , to] = key.split('_');
                  const fromLabel = getStageLabel(from);
                  const toLabel = getStageLabel(to);
                  
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getStageColor(from)}`}>
                          {fromLabel}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getStageColor(to)}`}>
                          {toLabel}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-4 mr-3">
                          <div 
                            className="bg-purple-600 h-4 rounded-full" 
                            style={{ width: `${Math.min(rate, 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold">{rate.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">📜 История изменений статусов</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Пользователь</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Старый статус</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Новый статус</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Тип</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Событие</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Дата</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {statusHistory.map((history) => (
                    <tr key={history.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{history.lead_name || 'Unknown'}</div>
                          <div className="text-gray-500 dark:text-gray-400">{history.lead_email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {history.old_status ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(history.old_status)}`}>
                            {getStageLabel(history.old_status)}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(history.new_status)}`}>
                          {getStageLabel(history.new_status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {history.status_type}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {history.trigger_event || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(history.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {statusHistory.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>История изменений пока пуста</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}