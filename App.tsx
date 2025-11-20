
import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, CalendarDays, Users, PlusCircle, X, Map as MapIcon, CheckSquare, BarChart2, LogOut, RefreshCw } from 'lucide-react';
import { Client, Visit, Area, ClientClassification, VisitStatus, Task, TaskPriority, NotificationToast, ToastType, Opportunity } from './types';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import Schedule from './components/Schedule';
import ClientMap from './components/ClientMap';
import TaskManager from './components/TaskManager';
import Reports from './components/Reports';
import ToastContainer from './components/Toast';
import Auth from './components/Auth';
import { supabase } from './services/supabaseClient';
import { requestNotificationPermission, sendNativeNotification } from './services/notificationService';
import { formatMozPhoneNumber, isValidMozPhoneNumber, isDateInPast, getTodayString } from './utils/validators';

// --- Constants ---
export const SERVICES_LIST = [
  'Redes Estruturadas & Cablagem',
  'CCTV & Segurança Eletrónica',
  'Controle de Acessos & Biometria',
  'Software de Gestão (ERP/PHC)',
  'Hardware & Equipamentos TI',
  'Websites & Marketing Digital',
  'Consultoria & Auditoria TI',
  'Manutenção Mensal (SLA)',
  'Cloud & Backups'
];

const App: React.FC = () => {
  // Auth State
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [currentView, setCurrentView] = useState<'dashboard' | 'schedule' | 'clients' | 'map' | 'tasks' | 'reports'>('dashboard');
  
  // App Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  
  // Modal States
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedClientForVisit, setSelectedClientForVisit] = useState<Client | null>(null);

  // Notification Tracking Ref (avoid duplicate alerts)
  const alertedRef = useRef<Set<string>>(new Set());

  // Notification Helper
  const addToast = (message: string, type: ToastType = 'info') => {
    const newToast: NotificationToast = {
      id: Date.now().toString() + Math.random(),
      message,
      type
    };
    setToasts(prev => [...prev, newToast]);
  };

  // 1. Auth & Session Management
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) fetchData(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData(session.user.id);
      else {
        setClients([]);
        setVisits([]);
        setTasks([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Data Fetching from Supabase
  const fetchData = async (userId: string) => {
    setDataLoading(true);
    try {
      // Fetch Clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId);

      if (clientsError) throw clientsError;

      // Map DB columns (snake_case) to TS types (camelCase)
      const mappedClients: Client[] = (clientsData || []).map(c => ({
        id: c.id,
        name: c.name,
        address: c.address,
        area: c.area as Area,
        category: c.category,
        classification: c.classification as ClientClassification,
        contactPerson: c.contact_person,
        contactRole: c.contact_role,
        phone: c.phone,
        email: c.email,
        prospectingCount: c.prospecting_count,
        notes: c.notes,
        lat: c.lat,
        lng: c.lng
      }));
      setClients(mappedClients);

      // Fetch Visits
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('*')
        .eq('user_id', userId);

      if (visitsError) throw visitsError;

      const mappedVisits: Visit[] = (visitsData || []).map(v => ({
        id: v.id,
        clientId: v.client_id,
        date: v.date,
        time: v.time,
        status: v.status as VisitStatus,
        type: v.type,
        notes: v.notes,
        opportunitiesFound: v.opportunities || [], // JSONB column
        plannedServices: v.planned_services || []
      }));
      setVisits(mappedVisits);

      // Fetch Tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId);

      if (tasksError) throw tasksError;

      const mappedTasks: Task[] = (tasksData || []).map(t => ({
        id: t.id,
        title: t.title,
        dueDate: t.due_date,
        priority: t.priority as TaskPriority,
        completed: t.completed
      }));
      setTasks(mappedTasks);

    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      addToast('Erro ao sincronizar dados. Verifique se as tabelas existem.', 'error');
    } finally {
      setDataLoading(false);
    }
  };

  // 3. Monitor Logic (Notifications)
  useEffect(() => {
    if (!session) return;

    requestNotificationPermission();

    const checkUpcomingVisits = () => {
      const now = new Date();
      visits.forEach(visit => {
        if (visit.status !== VisitStatus.SCHEDULED) return;
        if (alertedRef.current.has(visit.id)) return;

        const visitDate = new Date(`${visit.date}T${visit.time}`);
        const diffMs = visitDate.getTime() - now.getTime();
        const diffMins = Math.round(diffMs / 60000);

        if (diffMins > 0 && diffMins <= 30) {
          const client = clients.find(c => c.id === visit.clientId);
          const title = `Visita Iminente: ${client?.name}`;
          const body = `Sua visita de ${visit.type} começa em ${diffMins} minutos.`;
          sendNativeNotification(title, body);
          addToast(title, 'info');
          alertedRef.current.add(visit.id);
        }
      });
    };

    const intervalId = setInterval(checkUpcomingVisits, 60000);
    return () => clearInterval(intervalId);
  }, [visits, clients, session]);

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  // Form States
  const [newClient, setNewClient] = useState<Partial<Client>>({
    area: Area.CIDADE,
    classification: ClientClassification.COLD,
    prospectingCount: 0,
    phone: '+258 '
  });

  const [newVisit, setNewVisit] = useState<Partial<Visit>>({
    date: getTodayString(),
    time: '09:00',
    type: 'Prospecção',
    plannedServices: []
  });

  const [newTask, setNewTask] = useState<{title: string; priority: TaskPriority; date: string}>({
      title: '',
      priority: TaskPriority.MEDIUM,
      date: getTodayString()
  });

  // --- CRUD Handlers ---

  const handleLogout = async () => {
      await supabase.auth.signOut();
      addToast('Sessão terminada.', 'info');
  };

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.contactPerson) {
      addToast('Nome da empresa e Focal Point são obrigatórios.', 'error');
      return;
    }
    if (newClient.phone && !isValidMozPhoneNumber(newClient.phone)) {
      addToast('Número de telefone inválido.', 'error');
      return;
    }

    addToast('A obter localização GPS...', 'info');
    
    // Try to get GeoLocation
    let lat = -16.156; // Default Tete
    let lng = 33.586;

    if (navigator.geolocation) {
       try {
         const position: any = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
         });
         lat = position.coords.latitude;
         lng = position.coords.longitude;
         addToast('Localização capturada!', 'success');
       } catch (e) {
         addToast('GPS indisponível. Usando padrão.', 'warning');
       }
    }

    try {
      const payload = {
        user_id: session.user.id,
        name: newClient.name,
        address: newClient.address || '',
        area: newClient.area,
        category: newClient.category || 'Geral',
        classification: newClient.classification,
        contact_person: newClient.contactPerson,
        contact_role: newClient.contactRole || 'Staff',
        phone: newClient.phone,
        email: newClient.email || '',
        prospecting_count: 0,
        lat: lat,
        lng: lng
      };

      const { data, error } = await supabase.from('clients').insert([payload]).select();
      if (error) throw error;

      if (data) {
        const createdClient: Client = {
           ...newClient as Client,
           id: data[0].id,
           contactPerson: data[0].contact_person,
           contactRole: data[0].contact_role,
           prospectingCount: data[0].prospecting_count,
           lat: data[0].lat,
           lng: data[0].lng
        };
        setClients([...clients, createdClient]);
        setShowAddClient(false);
        setNewClient({ area: Area.CIDADE, classification: ClientClassification.COLD, prospectingCount: 0, phone: '+258 ' });
        addToast('Cliente adicionado com sucesso!', 'success');
      }
    } catch (error: any) {
      addToast('Erro ao criar cliente: ' + error.message, 'error');
    }
  };

  const handleUpdateClient = async (updated: Client) => {
    try {
      const payload = {
        notes: updated.notes,
        prospecting_count: updated.prospectingCount,
      };

      const { error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', updated.id);

      if (error) throw error;

      setClients(clients.map(c => c.id === updated.id ? updated : c));
      addToast('Cliente atualizado.', 'success');
    } catch (error: any) {
      addToast('Erro ao atualizar: ' + error.message, 'error');
    }
  };

  const handleAddVisit = async () => {
    if (!selectedClientForVisit || !newVisit.date) {
        addToast('Cliente e Data são obrigatórios.', 'error');
        return;
    }
    if (isDateInPast(newVisit.date)) {
        addToast('Não é possível agendar para o passado.', 'error');
        return;
    }

    try {
      const payload = {
        user_id: session.user.id,
        client_id: selectedClientForVisit.id,
        date: newVisit.date,
        time: newVisit.time,
        status: VisitStatus.SCHEDULED,
        type: newVisit.type,
        notes: newVisit.notes || '',
        planned_services: newVisit.plannedServices || []
      };

      const { data, error } = await supabase.from('visits').insert([payload]).select();
      if (error) throw error;

      if (data) {
        const createdVisit: Visit = {
          id: data[0].id,
          clientId: data[0].client_id,
          date: data[0].date,
          time: data[0].time,
          status: data[0].status,
          type: data[0].type,
          notes: data[0].notes,
          plannedServices: data[0].planned_services,
          opportunitiesFound: []
        };
        
        setVisits([...visits, createdVisit]);
        
        // Increment Prospecting Count if applicable
        if (createdVisit.type === 'Prospecção') {
           const newCount = (selectedClientForVisit.prospectingCount || 0) + 1;
           const updatedClient = { ...selectedClientForVisit, prospectingCount: newCount };
           handleUpdateClient(updatedClient);
        }

        setShowAddVisit(false);
        setSelectedClientForVisit(null);
        setNewVisit({ date: getTodayString(), time: '09:00', type: 'Prospecção', plannedServices: [] });
        addToast('Visita agendada!', 'success');
      }
    } catch (error: any) {
      addToast('Erro ao agendar: ' + error.message, 'error');
    }
  };

  const handleCompleteVisit = async (visitId: string, opportunities: Opportunity[]) => {
    try {
      const { error } = await supabase.from('visits').update({
        status: VisitStatus.COMPLETED,
        opportunities: opportunities
      }).eq('id', visitId);

      if (error) throw error;

      setVisits(visits.map(v => v.id === visitId ? { ...v, status: VisitStatus.COMPLETED, opportunitiesFound: opportunities } : v));
      addToast('Visita realizada e oportunidades registradas!', 'success');
    } catch (error: any) {
      addToast('Erro ao finalizar visita: ' + error.message, 'error');
    }
  };

  const handleVisitStatusUpdate = async (id: string, status: VisitStatus) => {
    // Generic update (e.g., cancelling)
    try {
       const { error } = await supabase.from('visits').update({ status }).eq('id', id);
       if (error) throw error;
       setVisits(visits.map(v => v.id === id ? { ...v, status } : v));
       addToast('Status da visita atualizado.', 'info');
    } catch (error: any) {
        addToast('Erro: ' + error.message, 'error');
    }
  };

  const handleAddTaskFromModal = async () => {
    if (!newTask.title) return addToast('Título obrigatório.', 'error');
    
    try {
      const payload = {
        user_id: session.user.id,
        title: newTask.title,
        priority: newTask.priority,
        due_date: newTask.date,
        completed: false
      };

      const { data, error } = await supabase.from('tasks').insert([payload]).select();
      if (error) throw error;

      if (data) {
        const createdTask: Task = {
          id: data[0].id,
          title: data[0].title,
          priority: data[0].priority,
          dueDate: data[0].due_date,
          completed: data[0].completed
        };
        setTasks([...tasks, createdTask]);
        setShowAddTask(false);
        setNewTask({ title: '', priority: TaskPriority.MEDIUM, date: getTodayString() });
        addToast('Tarefa criada!', 'success');
      }
    } catch (error: any) {
      addToast('Erro ao criar tarefa: ' + error.message, 'error');
    }
  };

  const handleToggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    try {
      const newStatus = !task.completed;
      const { error } = await supabase.from('tasks').update({ completed: newStatus }).eq('id', id);
      if (error) throw error;
      
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: newStatus } : t));
    } catch (error: any) {
      addToast('Erro ao atualizar tarefa', 'error');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== id));
      addToast('Tarefa removida.', 'info');
    } catch (error: any) {
      addToast('Erro ao remover tarefa', 'error');
    }
  };

  // --- Render ---

  if (authLoading) {
      return (
          <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ribeiro-red"></div>
          </div>
      );
  }

  if (!session) {
      return (
        <>
          <ToastContainer toasts={toasts} removeToast={removeToast} />
          <Auth onNotify={addToast} />
        </>
      );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f3f4f6] text-gray-800 font-sans">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Top Bar */}
      <div className="bg-white p-4 shadow-sm flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-ribeiro-red rounded flex items-center justify-center text-white font-bold text-xl">R</div>
            <h1 className="font-bold text-xl tracking-tight text-ribeiro-dark">Ribeiro, Lda.</h1>
        </div>
        <div className="flex gap-2 items-center">
             {dataLoading && <RefreshCw className="animate-spin text-gray-400 mr-2" size={18} />}
            {currentView === 'dashboard' && (
                <button 
                    onClick={() => setCurrentView('reports')}
                    className="text-gray-600 bg-gray-100 p-2 rounded-full hover:bg-gray-200"
                >
                    <BarChart2 size={20} />
                </button>
            )}
            <button 
                onClick={handleLogout}
                className="text-red-600 bg-red-50 p-2 rounded-full hover:bg-red-100"
                title="Sair"
            >
                <LogOut size={20} />
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {currentView === 'dashboard' && <Dashboard clients={clients} visits={visits} />}
        {currentView === 'reports' && <Reports clients={clients} visits={visits} />}
        {currentView === 'clients' && (
            <ClientList 
                clients={clients} 
                visits={visits}
                onAddClient={() => setShowAddClient(true)} 
                onUpdateClient={handleUpdateClient}
                onScheduleVisit={(c) => { setSelectedClientForVisit(c); setShowAddVisit(true); }}
            />
        )}
        {currentView === 'schedule' && (
            <Schedule 
                visits={visits} 
                clients={clients} 
                servicesList={SERVICES_LIST}
                onUpdateVisitStatus={handleVisitStatusUpdate}
                onCompleteVisit={handleCompleteVisit}
            />
        )}
        {currentView === 'map' && (
            <ClientMap clients={clients} visits={visits} />
        )}
        {currentView === 'tasks' && (
            <TaskManager 
                tasks={tasks} 
                visits={visits}
                onAddTask={(t) => handleAddTaskFromModal()}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
            />
        )}
      </div>

      {/* Bottom Nav */}
      <div className="bg-white border-t border-gray-200 flex justify-around items-center h-16 pb-safe z-20 text-[10px]">
        <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center justify-center w-full h-full ${currentView === 'dashboard' || currentView === 'reports' ? 'text-ribeiro-red' : 'text-gray-400'}`}>
          <LayoutDashboard size={20} /><span className="font-medium mt-1">Home</span>
        </button>
        <button onClick={() => setCurrentView('schedule')} className={`flex flex-col items-center justify-center w-full h-full ${currentView === 'schedule' ? 'text-ribeiro-red' : 'text-gray-400'}`}>
          <CalendarDays size={20} /><span className="font-medium mt-1">Agenda</span>
        </button>
        <button onClick={() => setCurrentView('clients')} className={`flex flex-col items-center justify-center w-full h-full ${currentView === 'clients' ? 'text-ribeiro-red' : 'text-gray-400'}`}>
          <Users size={20} /><span className="font-medium mt-1">Clientes</span>
        </button>
        <button onClick={() => setCurrentView('map')} className={`flex flex-col items-center justify-center w-full h-full ${currentView === 'map' ? 'text-ribeiro-red' : 'text-gray-400'}`}>
          <MapIcon size={20} /><span className="font-medium mt-1">Mapa</span>
        </button>
        <button onClick={() => setCurrentView('tasks')} className={`flex flex-col items-center justify-center w-full h-full ${currentView === 'tasks' ? 'text-ribeiro-red' : 'text-gray-400'}`}>
          <CheckSquare size={20} /><span className="font-medium mt-1">Tarefas</span>
        </button>
      </div>

      {/* FAB */}
      {(currentView === 'clients' || currentView === 'schedule' || currentView === 'tasks') && (
        <button 
            onClick={() => {
                if (currentView === 'clients') setShowAddClient(true);
                else if (currentView === 'schedule') { setSelectedClientForVisit(null); setShowAddVisit(true); }
                else if (currentView === 'tasks') setShowAddTask(true);
            }}
            className="fixed bottom-20 right-4 bg-ribeiro-red text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
        >
            <PlusCircle size={28} />
        </button>
      )}

      {/* --- Modals --- */}
      
      {/* Add Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Novo Cliente</h3>
              <button onClick={() => setShowAddClient(false)}><X /></button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
              <div>
                <label className="text-xs font-bold text-gray-500">Nome da Empresa *</label>
                <input className="w-full p-3 border rounded-lg" value={newClient.name || ''} onChange={e => setNewClient({...newClient, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <div>
                   <label className="text-xs font-bold text-gray-500">Área</label>
                   <select className="w-full p-3 border rounded-lg bg-white" value={newClient.area} onChange={e => setNewClient({...newClient, area: e.target.value as Area})}>
                      {Object.values(Area).map(a => <option key={a} value={a}>{a}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="text-xs font-bold text-gray-500">Categoria</label>
                   <input className="w-full p-3 border rounded-lg" value={newClient.category || ''} onChange={e => setNewClient({...newClient, category: e.target.value})} />
                 </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Endereço</label>
                <input className="w-full p-3 border rounded-lg" value={newClient.address || ''} onChange={e => setNewClient({...newClient, address: e.target.value})} />
              </div>
              <h4 className="text-sm font-bold text-gray-800 mt-2 border-b pb-1">Focal Point</h4>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs font-bold text-gray-500">Nome *</label><input className="w-full p-3 border rounded-lg" value={newClient.contactPerson || ''} onChange={e => setNewClient({...newClient, contactPerson: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-gray-500">Cargo</label><input className="w-full p-3 border rounded-lg" value={newClient.contactRole || ''} onChange={e => setNewClient({...newClient, contactRole: e.target.value})} /></div>
              </div>
              <div><label className="text-xs font-bold text-gray-500">Telefone (MZ)</label><input className="w-full p-3 border rounded-lg" type="tel" value={newClient.phone || '+258 '} onChange={e => setNewClient({...newClient, phone: formatMozPhoneNumber(e.target.value)})} /></div>
              <div><label className="text-xs font-bold text-gray-500">Email</label><input className="w-full p-3 border rounded-lg" type="email" value={newClient.email || ''} onChange={e => setNewClient({...newClient, email: e.target.value})} /></div>
              <button onClick={handleAddClient} className="w-full bg-ribeiro-red text-white py-4 rounded-xl font-bold mt-4 shadow-md">
                  Salvar Cliente (Com GPS)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Visit Modal */}
      {showAddVisit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-slide-up flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Agendar Visita</h3>
              <button onClick={() => { setShowAddVisit(false); setSelectedClientForVisit(null); }}><X /></button>
            </div>
            <div className="space-y-4 overflow-y-auto">
              {!selectedClientForVisit && (
                  <div>
                     <label className="text-xs font-bold text-gray-500">Cliente *</label>
                     <select className="w-full p-3 border rounded-lg bg-white" onChange={e => setSelectedClientForVisit(clients.find(c => c.id === e.target.value) || null)}>
                        <option value="">Selecione...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                  </div>
              )}
              {selectedClientForVisit && (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="font-bold text-ribeiro-dark text-lg">{selectedClientForVisit.name}</p>
                  </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs font-bold text-gray-500">Data *</label><input type="date" className="w-full p-3 border rounded-lg" min={getTodayString()} value={newVisit.date} onChange={e => setNewVisit({...newVisit, date: e.target.value})} /></div>
                  <div><label className="text-xs font-bold text-gray-500">Hora</label><input type="time" className="w-full p-3 border rounded-lg" value={newVisit.time} onChange={e => setNewVisit({...newVisit, time: e.target.value})} /></div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Tipo</label>
                <select className="w-full p-3 border rounded-lg bg-white" value={newVisit.type} onChange={e => setNewVisit({...newVisit, type: e.target.value as any})}>
                    <option value="Prospecção">Prospecção</option>
                    <option value="Acompanhamento">Acompanhamento</option>
                    <option value="Técnica">Técnica</option>
                </select>
              </div>
              <div className="border p-3 rounded-lg">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Planejar Oferta de Serviços</p>
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                      {SERVICES_LIST.map(service => (
                          <label key={service} className="flex items-center space-x-3 text-sm cursor-pointer hover:bg-gray-50 p-1">
                              <input type="checkbox" checked={(newVisit.plannedServices || []).includes(service)} onChange={(e) => {
                                      const current = newVisit.plannedServices || [];
                                      setNewVisit({...newVisit, plannedServices: e.target.checked ? [...current, service] : current.filter(s => s !== service)});
                                  }} className="w-4 h-4 text-ribeiro-red border-gray-300 rounded" />
                              <span className="text-gray-700">{service}</span>
                          </label>
                      ))}
                  </div>
              </div>
              <textarea className="w-full p-3 border rounded-lg h-24" placeholder="Notas pré-visita..." value={newVisit.notes} onChange={e => setNewVisit({...newVisit, notes: e.target.value})} />
              <button onClick={handleAddVisit} className="w-full bg-ribeiro-dark text-white py-4 rounded-xl font-bold mt-2 shadow-md">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Nova Tarefa</h3>
              <button onClick={() => setShowAddTask(false)}><X /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-xs font-bold text-gray-500">Título *</label><input className="w-full p-3 border rounded-lg" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs font-bold text-gray-500">Prioridade</label><select className="w-full p-3 border rounded-lg bg-white" value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value as TaskPriority})}><option value={TaskPriority.HIGH}>Alta</option><option value={TaskPriority.MEDIUM}>Média</option><option value={TaskPriority.LOW}>Baixa</option></select></div>
                <div><label className="text-xs font-bold text-gray-500">Vencimento</label><input type="date" className="w-full p-3 border rounded-lg" value={newTask.date} onChange={(e) => setNewTask({...newTask, date: e.target.value})} /></div>
              </div>
              <button onClick={handleAddTaskFromModal} className="w-full bg-ribeiro-dark text-white py-4 rounded-xl font-bold mt-2 shadow-md">Criar Tarefa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
