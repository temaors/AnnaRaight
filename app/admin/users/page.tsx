'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface User {
  email: string;
  name: string;
  created_at: string;
  funnel_step?: string;
  appointment_date?: string;
  appointment_time?: string;
  status?: string;
  newsletter_subscribed?: boolean;
  unsubscribed_all?: boolean;
}

interface UserLists {
  vslOptIns: User[];
  bookedCalls: User[];
  newsletter: User[];
}

export default function AdminUsersPage() {
  const [userLists, setUserLists] = useState<UserLists | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vsl' | 'booked' | 'newsletter'>('vsl');

  useEffect(() => {
    fetchUserLists();
  }, []);

  const fetchUserLists = async () => {
    try {
      const response = await fetch('/api/admin/user-lists');
      const result = await response.json();
      
      if (result.success) {
        setUserLists(result.data);
      } else {
        console.error('Error fetching user lists:', result.error);
      }
    } catch (error) {
      console.error('Error fetching user lists:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 dark:text-gray-400">Загрузка списков пользователей...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userLists) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400">Ошибка загрузки данных</p>
          </div>
        </div>
      </div>
    );
  }

  const renderUserTable = (users: User[], type: 'vsl' | 'booked' | 'newsletter') => {
    if (users.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 dark:text-gray-400">
          <p>Пользователей пока нет</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Имя</th>
              {type === 'booked' && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Дата встречи</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Время</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Статус</th>
                </>
              )}
              {type === 'vsl' && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Этап воронки</th>
              )}
              {type === 'newsletter' && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Статус подписки</th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Дата регистрации</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user, index) => (
              <tr key={`${user.email}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800">
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{user.email}</td>
                <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{user.name || '-'}</td>
                
                {type === 'booked' && (
                  <>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {user.appointment_date ? new Date(user.appointment_date).toLocaleDateString('ru-RU') : '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{user.appointment_time || '-'}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'scheduled' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status || 'unknown'}
                      </span>
                    </td>
                  </>
                )}

                {type === 'vsl' && (
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {user.funnel_step || 'vsl_optin'}
                    </span>
                  </td>
                )}

                {type === 'newsletter' && (
                  <td className="px-4 py-4 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.unsubscribed_all
                        ? 'bg-red-100 text-red-800'
                        : user.newsletter_subscribed !== false
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.unsubscribed_all 
                        ? 'Отписан' 
                        : user.newsletter_subscribed !== false 
                        ? 'Подписан' 
                        : 'Частично'}
                    </span>
                  </td>
                )}

                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {new Date(user.created_at).toLocaleDateString('ru-RU')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white">👥 Списки пользователей</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400 dark:text-gray-400">
                Управление пользователями по категориям
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
              <a 
                href="/admin/settings" 
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ⚙️ Настройки
              </a>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{userLists.vslOptIns.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">VSL Opt-ins</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Прошли первую страницу</div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{userLists.bookedCalls.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Записались на звонки</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Назначили встречи</div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{userLists.newsletter.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Подписчики рассылки</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Активные получатели</div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('vsl')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'vsl'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📺 VSL Opt-ins ({userLists.vslOptIns.length})
              </button>
              <button
                onClick={() => setActiveTab('booked')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'booked'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📞 Записи на звонки ({userLists.bookedCalls.length})
              </button>
              <button
                onClick={() => setActiveTab('newsletter')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'newsletter'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📧 Подписчики рассылки ({userLists.newsletter.length})
              </button>
            </nav>
          </div>
        </div>

        {/* User Lists */}
        <Card className="p-6">
          {activeTab === 'vsl' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">📺 VSL Opt-ins</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Пользователи, которые прошли первую страницу воронки и предоставили свой email.
              </p>
              {renderUserTable(userLists.vslOptIns, 'vsl')}
            </div>
          )}

          {activeTab === 'booked' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">📞 Записи на звонки</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Пользователи, которые записались на консультацию.
              </p>
              {renderUserTable(userLists.bookedCalls, 'booked')}
            </div>
          )}

          {activeTab === 'newsletter' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">📧 Подписчики рассылки</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Все пользователи, которые подписаны на получение новостей и уведомлений.
              </p>
              {renderUserTable(userLists.newsletter, 'newsletter')}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}