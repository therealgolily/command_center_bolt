import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase, Client, Task } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ClientCard } from './ClientCard';
import { ClientDetailModal } from './ClientDetailModal';
import { AddClientModal } from './AddClientModal';

export function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [clientsResult, tasksResult] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: true }),
      supabase.from('tasks').select('*').neq('status', 'done'),
    ]);

    if (clientsResult.error) {
      console.error('error loading clients:', clientsResult.error);
    } else {
      setClients(clientsResult.data || []);
    }

    if (tasksResult.error) {
      console.error('error loading tasks:', tasksResult.error);
    } else {
      setTasks(tasksResult.data || []);
    }

    setLoading(false);
  };

  const getTaskCountForClient = (clientId: string) => {
    return tasks.filter((t) => t.client_id === clientId).length;
  };

  const handleAddClient = async (clientData: Partial<Client>) => {
    if (!user || clients.length >= 4) return;

    const newClient = {
      user_id: user.id,
      ...clientData,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('clients')
      .insert([newClient])
      .select()
      .single();

    if (error) {
      console.error('error creating client:', error);
    } else if (data) {
      setClients([...clients, data]);
      setIsAddingClient(false);
    }
  };

  const handleUpdateClient = async (clientId: string, updates: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, ...updates } : c))
    );

    const { error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId);

    if (error) {
      console.error('error updating client:', error);
      loadData();
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    const clientTasks = tasks.filter((t) => t.client_id === clientId);
    if (clientTasks.length > 0) {
      alert(`Cannot delete client with ${clientTasks.length} active tasks. Complete or reassign them first.`);
      return;
    }

    setClients((prev) => prev.filter((c) => c.id !== clientId));
    setSelectedClient(null);

    const { error } = await supabase.from('clients').delete().eq('id', clientId);

    if (error) {
      console.error('error deleting client:', error);
      loadData();
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#1e293b]">clients</h2>
        {clients.length < 4 && (
          <button
            onClick={() => setIsAddingClient(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus size={18} />
            add client
          </button>
        )}
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#64748b] mb-4">no clients yet. add your first client to get started.</p>
          <button
            onClick={() => setIsAddingClient(true)}
            className="px-6 py-3 bg-[#3b82f6] text-white rounded-md font-medium hover:bg-blue-600 transition-colors"
          >
            add client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              taskCount={getTaskCountForClient(client.id)}
              onClick={() => setSelectedClient(client)}
            />
          ))}
          {clients.length < 4 && (
            <button
              onClick={() => setIsAddingClient(true)}
              className="border-2 border-dashed border-[#e2e8f0] rounded-lg p-8 hover:border-[#3b82f6] hover:bg-blue-50 transition-colors flex items-center justify-center"
            >
              <div className="text-center">
                <Plus size={32} className="text-[#94a3b8] mx-auto mb-2" />
                <span className="text-[#64748b] text-sm">add another client</span>
              </div>
            </button>
          )}
        </div>
      )}

      {clients.length >= 4 && (
        <p className="text-center text-[#64748b] text-sm">
          maximum of 4 clients reached
        </p>
      )}

      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          tasks={tasks.filter((t) => t.client_id === selectedClient.id)}
          onClose={() => setSelectedClient(null)}
          onUpdate={handleUpdateClient}
          onDelete={handleDeleteClient}
          onTasksChange={loadData}
        />
      )}

      {isAddingClient && (
        <AddClientModal
          onClose={() => setIsAddingClient(false)}
          onSave={handleAddClient}
        />
      )}
    </div>
  );
}
