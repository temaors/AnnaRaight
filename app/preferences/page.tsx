'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';

interface EmailPreferences {
  email: string;
  marketing_emails: boolean;
  appointment_emails: boolean;
  reminder_emails: boolean;
  newsletter: boolean;
  sms_marketing: boolean;
  sms_appointments: boolean;
  sms_reminders: boolean;
  unsubscribed_all: boolean;
  unsubscribe_token: string;
}

function PreferencesPageContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const searchParams = useSearchParams();

  useEffect(() => {
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email || !token) {
      setError('Invalid subscription management link');
      setLoading(false);
      return;
    }

    loadPreferences(email, token);
  }, [searchParams]);

  const loadPreferences = async (email: string, token: string) => {
    try {
      const response = await fetch(`/api/preferences?email=${encodeURIComponent(email)}&token=${token}`);
      const result = await response.json();

      if (result.success) {
        setPreferences(result.data);
      } else {
        setError(result.error || 'Error loading settings');
      }
    } catch {
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: preferences.email,
          token: preferences.unsubscribe_token,
          preferences: {
            marketing_emails: preferences.marketing_emails,
            appointment_emails: preferences.appointment_emails,
            reminder_emails: preferences.reminder_emails,
            newsletter: preferences.newsletter,
            sms_marketing: preferences.sms_marketing,
            sms_appointments: preferences.sms_appointments,
            sms_reminders: preferences.sms_reminders,
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Settings saved successfully!');
      } else {
        setError(result.error || 'Error saving settings');
      }
    } catch {
      setError('An error occurred. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribeAll = async () => {
    if (!preferences) return;

    if (!confirm('Are you sure you want to unsubscribe from all notifications?')) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: preferences.email,
          token: preferences.unsubscribe_token,
          unsubscribe_type: 'all'
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPreferences({
          ...preferences,
          marketing_emails: false,
          appointment_emails: false,
          reminder_emails: false,
          newsletter: false,
          sms_marketing: false,
          sms_appointments: false,
          sms_reminders: false,
          unsubscribed_all: true
        });
        setSuccess('You have unsubscribed from all notifications');
      } else {
        setError(result.error || 'Error unsubscribing');
      }
    } catch {
      setError('An error occurred. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your settings...</p>
        </Card>
      </div>
    );
  }

  if (error && !preferences) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error</h1>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!preferences) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">
              📧 Subscription Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Configure which notifications you want to receive at: <strong>{preferences.email}</strong>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          {preferences.unsubscribed_all ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚫</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                You are unsubscribed from all notifications
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You will not receive any notifications from us.
              </p>
              <Link 
                href="/"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Email Preferences */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  📧 Email Notifications
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.marketing_emails}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        marketing_emails: e.target.checked
                      })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-3 text-sm">
                      <strong>Marketing emails</strong> - receive information about new opportunities and offers
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.appointment_emails}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        appointment_emails: e.target.checked
                      })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-3 text-sm">
                      <strong>Appointment confirmations</strong> - confirmations for consultation bookings
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.reminder_emails}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        reminder_emails: e.target.checked
                      })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-3 text-sm">
                      <strong>Appointment reminders</strong> - notifications about upcoming consultations
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.newsletter}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        newsletter: e.target.checked
                      })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-3 text-sm">
                      <strong>Newsletter</strong> - useful materials and updates
                    </span>
                  </label>
                </div>
              </div>

              {/* SMS Preferences */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  📱 SMS Notifications
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.sms_marketing}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        sms_marketing: e.target.checked
                      })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-3 text-sm">
                      <strong>Marketing SMS</strong> - information about new opportunities
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.sms_appointments}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        sms_appointments: e.target.checked
                      })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-3 text-sm">
                      <strong>SMS appointment confirmations</strong> - booking confirmations
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.sms_reminders}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        sms_reminders: e.target.checked
                      })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-3 text-sm">
                      <strong>SMS appointment reminders</strong> - notifications about upcoming consultations
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-300 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
                
                <button
                  onClick={handleUnsubscribeAll}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 transition-colors"
                >
                  Unsubscribe from All
                </button>
              </div>

              <div className="text-center pt-4">
                <Link 
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:bg-gray-600 transition-colors text-sm"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading settings...</p>
        </Card>
      </div>
    }>
      <PreferencesPageContent />
    </Suspense>
  );
}