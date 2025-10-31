'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

function UnsubscribePageContent() {
  const [loading, setLoading] = useState(true);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  
  const searchParams = useSearchParams();

  const handleUnsubscribe = useCallback(async (email: string, token: string) => {
    try {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token,
          unsubscribe_type: 'all',
          reason
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUnsubscribed(true);
      } else {
        setError(result.error || 'Ошибка при отписке');
      }
    } catch {
      setError('Произошла ошибка. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }, [reason]);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const token = searchParams.get('token');

    if (!emailParam || !token) {
      setError('Недействительная ссылка для отписки');
      setLoading(false);
      return;
    }

    setEmail(emailParam);
    handleUnsubscribe(emailParam, token);
  }, [searchParams, handleUnsubscribe, reason]);


  const handleReasonSubmit = async () => {
    if (!reason.trim()) return;
    
    const emailParam = searchParams.get('email');
    const token = searchParams.get('token');
    
    if (!emailParam || !token) return;

    try {
      await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailParam,
          token,
          unsubscribe_type: 'all',
          reason
        }),
      });
    } catch (err) {
      console.error('Error updating reason:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Обрабатываем ваш запрос...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Ошибка</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (unsubscribed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Отписка успешна</h1>
            <p className="text-gray-600 mb-4">
              Вы успешно отписались от всех рассылок для email: <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Вы больше не будете получать письма от нас. Если это произошло по ошибке, 
              свяжитесь с нашей службой поддержки.
            </p>
          </div>

          {/* Optional feedback form */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Помогите нам стать лучше (необязательно)
            </h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Расскажите, почему вы решили отписаться..."
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              rows={3}
            />
            <button
              onClick={handleReasonSubmit}
              disabled={!reason.trim()}
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
            >
              Отправить отзыв
            </button>
          </div>

          <div className="mt-6 pt-4 border-t">
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              ← Вернуться на главную
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем...</p>
        </Card>
      </div>
    }>
      <UnsubscribePageContent />
    </Suspense>
  );
}