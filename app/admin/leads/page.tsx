'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';

interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  revenue?: string;
  created_at: string;
}

interface Appointment {
  id: number;
  lead_id: number;
  name: string;
  email: string;
  appointment_date: string;
  appointment_time: string;
  timezone: string;
  status: string;
  confirmation_sent: boolean;
  reminder_sent: boolean;
  google_meet_link?: string;
  meeting_id?: string;
  created_at: string;
}

interface ChartDataPoint {
  date: string;
  leads: number;
  appointments: number;
}

type DateFilter = 'today' | 'yesterday' | '7days' | '30days' | 'all';

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/leads');
      const result = await response.json();

      if (result.success) {
        setLeads(result.data.leads);
        setAppointments(result.data.appointments);
        setChartData(result.data.chartData || []);
      } else {
        console.error('Error fetching data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentsForLead = (leadId: number) => {
    return appointments.filter(apt => apt.lead_id === leadId);
  };

  // Filter data by date
  const filteredData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filterByDate = (dateStr: string) => {
      const date = new Date(dateStr);
      switch (dateFilter) {
        case 'today':
          return date >= today;
        case 'yesterday':
          return date >= yesterday && date < today;
        case '7days':
          return date >= sevenDaysAgo;
        case '30days':
          return date >= thirtyDaysAgo;
        case 'all':
        default:
          return true;
      }
    };

    return {
      leads: leads.filter(lead => filterByDate(lead.created_at)),
      appointments: appointments.filter(apt => filterByDate(apt.created_at))
    };
  }, [leads, appointments, dateFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка данных...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📊 Админ панель - Лиды и Записи</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Управление лидами и записями на консультации
              </p>
            </div>
            <div className="flex space-x-3">
              <a 
                href="/admin/invoices" 
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                💰 Инвойсы
              </a>
              <a 
                href="/admin/status" 
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                📊 Статусы
              </a>
              <a 
                href="/admin/users" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                👥 Пользователи
              </a>
              <a 
                href="/admin/analytics" 
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                📈 Аналитика
              </a>
              <a 
                href="/admin/test-email" 
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                📧 Тест Email
              </a>
              <a 
                href="/admin/settings" 
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ⚙️ Настройки
              </a>
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <div className="mb-6">
          <Card className="p-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Период:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setDateFilter('today')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateFilter === 'today'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  Сегодня
                </button>
                <button
                  onClick={() => setDateFilter('yesterday')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateFilter === 'yesterday'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  Вчера
                </button>
                <button
                  onClick={() => setDateFilter('7days')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateFilter === '7days'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  7 дней
                </button>
                <button
                  onClick={() => setDateFilter('30days')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateFilter === '30days'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  30 дней
                </button>
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateFilter === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  Все время
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{filteredData.leads.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Всего лидов</div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{filteredData.appointments.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Записей на встречи</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {filteredData.appointments.filter(apt => apt.confirmation_sent).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Подтверждений отправлено</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {leads.filter(lead => lead.created_at.includes(new Date().toISOString().split('T')[0])).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Лидов сегодня</div>
            </div>
          </Card>
        </div>

        {/* Chart */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">📈 График по дням (последние 30 дней)</h2>
          <div className="w-full h-80">
            {chartData.length > 0 ? (
              <div className="relative w-full h-full">
                {/* Chart Grid */}
                <svg className="w-full h-full" viewBox="0 0 1000 300">
                  {/* Grid lines */}
                  <line x1="50" y1="0" x2="50" y2="250" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="50" y1="250" x2="1000" y2="250" stroke="#e5e7eb" strokeWidth="2" />

                  {/* Y-axis labels */}
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <g key={i}>
                      <line x1="45" y1={250 - i * 50} x2="1000" y2={250 - i * 50} stroke="#f3f4f6" strokeWidth="1" />
                      <text x="35" y={255 - i * 50} fontSize="12" fill="#6b7280" textAnchor="end">
                        {Math.max(...chartData.map(d => Math.max(d.leads, d.appointments))) * i / 5}
                      </text>
                    </g>
                  ))}

                  {/* Data points and lines */}
                  {(() => {
                    const maxValue = Math.max(...chartData.map(d => Math.max(d.leads, d.appointments)), 1);
                    const pointWidth = (1000 - 60) / chartData.length;

                    // Leads line
                    const leadsPoints = chartData.map((d, i) => {
                      const x = 55 + i * pointWidth;
                      const y = 250 - (d.leads / maxValue) * 250;
                      return `${x},${y}`;
                    }).join(' ');

                    // Appointments line
                    const appointmentsPoints = chartData.map((d, i) => {
                      const x = 55 + i * pointWidth;
                      const y = 250 - (d.appointments / maxValue) * 250;
                      return `${x},${y}`;
                    }).join(' ');

                    return (
                      <>
                        {/* Leads line */}
                        <polyline
                          points={leadsPoints}
                          fill="none"
                          stroke="#9333ea"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Appointments line */}
                        <polyline
                          points={appointmentsPoints}
                          fill="none"
                          stroke="#16a34a"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Data points */}
                        {chartData.map((d, i) => {
                          const x = 55 + i * pointWidth;
                          const leadsY = 250 - (d.leads / maxValue) * 250;
                          const appointmentsY = 250 - (d.appointments / maxValue) * 250;

                          return (
                            <g key={i}>
                              <circle cx={x} cy={leadsY} r="4" fill="#9333ea" />
                              <circle cx={x} cy={appointmentsY} r="4" fill="#16a34a" />
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>

                {/* Legend */}
                <div className="flex justify-center space-x-6 mt-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-600 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Лиды</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-600 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Записи</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Нет данных для отображения
              </div>
            )}
          </div>
        </Card>

        {/* Leads Table */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Все лиды</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Имя</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Телефон</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Сайт</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Доход</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Записи</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Создан</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredData.leads.map((lead) => {
                  const leadAppointments = getAppointmentsForLead(lead.id);
                  
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{lead.id}</td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{lead.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{lead.email}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{lead.phone || '-'}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {lead.website ? (
                          <a href={lead.website} target="_blank" rel="noopener noreferrer" 
                             className="text-purple-600 dark:text-purple-400 hover:underline">
                            {lead.website}
                          </a>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{lead.revenue || '-'}</td>
                      <td className="px-4 py-4 text-sm">
                        {leadAppointments.length > 0 ? (
                          <div className="space-y-1">
                            {leadAppointments.map((apt) => (
                              <div key={apt.id} className="text-xs">
                                <div className="flex items-center space-x-2">
                                  <span className={`inline-block w-2 h-2 rounded-full ${
                                    apt.status === 'scheduled' ? 'bg-green-400' : 'bg-gray-400'
                                  }`}></span>
                                  <span>{apt.appointment_date} {apt.appointment_time}</span>
                                </div>
                                <div className="flex space-x-1 mt-1">
                                  <span className={`text-xs px-1 rounded ${
                                    apt.confirmation_sent ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {apt.confirmation_sent ? '✅' : '❌'} Подтв.
                                  </span>
                                  <span className={`text-xs px-1 rounded ${
                                    apt.reminder_sent ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {apt.reminder_sent ? '✅' : '❌'} Напом.
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">Нет записей</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(lead.created_at).toLocaleDateString('ru-RU')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredData.leads.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>Пока нет лидов</p>
            </div>
          )}
        </Card>

        {/* Appointments Table */}
        <Card className="p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">📅 Все встречи</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Имя</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Дата</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Время</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Часовой пояс</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Статус</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Google Meet</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Создан</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredData.appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{appointment.id}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{appointment.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{appointment.email}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {new Date(appointment.appointment_date).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{appointment.appointment_time}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{appointment.timezone}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        appointment.status === 'scheduled' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {appointment.google_meet_link ? (
                        <a 
                          href={appointment.google_meet_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {appointment.meeting_id || 'Открыть'}
                        </a>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {new Date(appointment.created_at).toLocaleDateString('ru-RU')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredData.appointments.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>Пока нет встреч</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}