import { useState, useEffect } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { supabase, UserIntegration } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function SettingsPage() {
  const { user } = useAuth();
  const [integration, setIntegration] = useState<UserIntegration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegration();
  }, [user]);

  const loadIntegration = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setIntegration(data);
    }
    setLoading(false);
  };

  const handleDisconnect = async () => {
    if (!user || !integration) return;

    const { error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('user_id', user.id);

    if (!error) {
      setIntegration(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#64748b]">loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#1e293b]">settings</h2>

      <div className="bg-white rounded-lg border border-[#e2e8f0] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar size={24} className="text-[#3b82f6]" />
          <h3 className="font-semibold text-[#1e293b] text-lg">google calendar</h3>
        </div>

        {integration && integration.google_email ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-md">
              <div>
                <div className="text-sm font-medium text-[#22c55e]">connected</div>
                <div className="text-sm text-[#64748b]">{integration.google_email}</div>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm font-medium text-[#ef4444] hover:bg-red-50 rounded-md transition-colors"
              >
                disconnect
              </button>
            </div>

            <div className="text-sm text-[#64748b]">
              <p className="mb-2">when you add time blocks to your tasks, you can sync them to your google calendar.</p>
              <p>calendar events will be created automatically for time-blocked tasks.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <AlertCircle size={16} className="text-[#3b82f6] mt-0.5" />
              <div className="text-sm text-[#64748b]">
                <p className="font-medium text-[#1e293b] mb-1">google calendar integration</p>
                <p className="mb-2">
                  to enable calendar sync, you need to set up google oauth credentials:
                </p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>create a google cloud project</li>
                  <li>enable google calendar api</li>
                  <li>set up oauth 2.0 credentials</li>
                  <li>add your app's redirect uri</li>
                  <li>add google_client_id to your .env file</li>
                </ol>
                <p className="mt-2">
                  see the documentation for detailed setup instructions.
                </p>
              </div>
            </div>

            <button
              disabled
              className="px-6 py-2 bg-[#3b82f6] text-white rounded-md font-medium opacity-50 cursor-not-allowed"
            >
              connect google calendar
            </button>
            <p className="text-xs text-[#94a3b8]">
              requires google oauth setup (see above)
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-[#e2e8f0] p-6">
        <h3 className="font-semibold text-[#1e293b] mb-4">about time blocking</h3>
        <div className="text-sm text-[#64748b] space-y-2">
          <p>
            time blocking helps you schedule when you'll work on specific tasks.
          </p>
          <p>
            when editing tasks in today, tomorrow, this week, or next week, you can add:
          </p>
          <ul className="list-disc ml-5 space-y-1">
            <li>start time and end time for the task</li>
            <li>optional calendar sync (if google calendar is connected)</li>
          </ul>
          <p>
            tasks with time blocks will show a clock icon and the scheduled time range.
          </p>
        </div>
      </div>
    </div>
  );
}
