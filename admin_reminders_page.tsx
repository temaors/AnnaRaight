'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ReminderStatus {
  success: boolean;
  timestamp: string;
  summary: {
    pending: Array<{ reminderType: string; count: number }>;
    totalByStatus: Array<{ status: string; count: number }>;
    recentActivity: Array<{ reminderType: string; status: string; count: number }>;
    overdueReminders: Array<{ reminderType: string; count: number; oldestScheduled: string }>;
    upcomingReminders: Array<{ reminderType: string; count: number; nextScheduled: string }>;
  };
}

export default function RemindersAdminPage() {
  const [status, setStatus] = useState<ReminderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reminders/status');
      const data = await response.json();
      setStatus(data);
      setLastUpdate(new Date().toLocaleString());
    } catch (error) {
      console.error('Error fetching reminder status:', error);
    } finally {
      setLoading(false);
    }
  };

  const processReminders = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/process-reminders');
      const result = await response.json();
      console.log('Manual processing result:', result);
      
      // Refresh status after processing
      setTimeout(fetchStatus, 1000);
    } catch (error) {
      console.error('Error processing reminders:', error);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reminder System Status</h1>
        <div className="space-x-2">
          <Button onClick={fetchStatus} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={processReminders} disabled={processing} variant="outline">
            {processing ? 'Processing...' : 'Process Now'}
          </Button>
        </div>
      </div>

      {lastUpdate && (
        <p className="text-sm text-gray-500 mb-4">Last updated: {lastUpdate}</p>
      )}

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Pending Reminders */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-3 text-blue-600">Pending Reminders</h2>
            {status.summary.pending.length > 0 ? (
              <div className="space-y-2">
                {status.summary.pending.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-sm">{item.reminderType}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No pending reminders</p>
            )}
          </div>

          {/* Total by Status */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-3 text-green-600">Total by Status</h2>
            <div className="space-y-2">
              {status.summary.totalByStatus.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-sm capitalize">{item.status}</span>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue Reminders */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-3 text-red-600">Overdue Reminders</h2>
            {status.summary.overdueReminders.length > 0 ? (
              <div className="space-y-2">
                {status.summary.overdueReminders.map((item, index) => (
                  <div key={index} className="border-l-4 border-red-500 pl-2">
                    <div className="flex justify-between">
                      <span className="text-sm">{item.reminderType}</span>
                      <span className="font-medium text-red-600">{item.count}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Oldest: {new Date(item.oldestScheduled).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No overdue reminders</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-3 text-purple-600">Recent Activity (24h)</h2>
            {status.summary.recentActivity.length > 0 ? (
              <div className="space-y-2">
                {status.summary.recentActivity.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.reminderType} ({item.status})</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent activity</p>
            )}
          </div>

          {/* Upcoming Reminders */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-3 text-orange-600">Upcoming (24h)</h2>
            {status.summary.upcomingReminders.length > 0 ? (
              <div className="space-y-2">
                {status.summary.upcomingReminders.map((item, index) => (
                  <div key={index} className="border-l-4 border-orange-500 pl-2">
                    <div className="flex justify-between">
                      <span className="text-sm">{item.reminderType}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Next: {new Date(item.nextScheduled).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No upcoming reminders</p>
            )}
          </div>

          {/* System Info */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-3 text-gray-600">System Info</h2>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Status Check:</strong> {status.timestamp ? new Date(status.timestamp).toLocaleString() : 'N/A'}
              </div>
              <div>
                <strong>Auto Processing:</strong> Every 10 minutes
              </div>
              <div>
                <strong>Database:</strong> SQLite (funnel.db)
              </div>
            </div>
          </div>
        </div>
      )}

      {!status && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Failed to load reminder status</p>
          <Button onClick={fetchStatus} className="mt-4">Retry</Button>
        </div>
      )}
    </div>
  );
}