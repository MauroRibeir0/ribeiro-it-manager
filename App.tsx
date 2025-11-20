
import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, CalendarDays, Users, PlusCircle, X, Map as MapIcon, CheckSquare, BarChart2, Briefcase } from 'lucide-react';
import { Client, Visit, Area, ClientClassification, VisitStatus, Task, TaskPriority, NotificationToast, ToastType } from './types';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import Schedule from './components/Schedule';
import ClientMap from './components/ClientMap';
import TaskManager from './components/TaskManager';
import Reports from './components/Reports';
import ToastContainer from './components/Toast';
import { requestNotificationPermission, sendNativeNotification } from './services/notificationService';
import { formatMozPhoneNumber, isValidMozPhoneNumber, isValidEmail, isDateInPast, getTodayString } from './utils/validators';

// --- Constants ---
const SERVICES_LIST = [
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

// --- Mock Data Initialization (Updated with Coordinates for Tete) ---
const INITIAL_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Hotel VIP Executive Tete',
    address: 'Av. da Liberdade, Tete',
    area: Area.CIDADE,
    category: 'Hotelaria',
    classification: ClientClassification.HOT,
    contactPerson: 'Sr. Carlos',
    contactRole: 'Gerente Geral',
    phone: '+258 84 123 4567',
    email: 'geral@vip.co.mz',
    prospectingCount: 2,
    notes: 'Interessados em renovar wifi.',
    lat: -16.154,
    lng: 33.590
  },
  {
    id: '2',
    name: 'Vale Logistics (Vulcan)',
    address: 'Moatize Industrial',
    area: Area.MOATIZE,
    category: 'Mineração/Logística',
    classification: ClientClassification.WARM,
    contactPerson: 'Eng. Maria',
    contactRole: 'Diretora IT',
    phone: '+258 82 999 8888',
    email: 'it@vulcan.co.mz',
    prospectingCount: 1,
    notes: 'Necessitam de CCTV perimeter.',
    lat: -16.170,
    lng: 33.620
  },
  {
    id: '3',
    name: 'Restaurante Paraíso',
    address: 'Margem do Zambeze',
    area: Area.MARGEM,
    category: 'Restauração',
    classification: ClientClassification.COLD,
    contactPerson: 'Dona Ana',
    contactRole: 'Proprietária',
    phone: '+258 84 555 4444',
    email: 'ana@paraiso.co.mz',
    prospectingCount: 0,
    notes: 'Pequena dimensão, sistema POS antigo.',
    lat: -16.145,
    lng: 33.595
  },
  {
    id: '4',
    name: 'ICB Mining Services',
    address: 'Estrada Nacional 7',
    area: Area.EMPRESA_MINEIRA,
    category: 'Serviços Mineiros',
    classification: ClientClassification.CONTRACTED,
    contactPerson: 'John Doe',
    contactRole: 'Ops Manager',
    phone: '+258 84 111 2222',
    email: 'j.doe@icb.co.mz',
    prospectingCount: 3,
    notes: 'Cliente mensal. Visita de rotina.',
    lat: -16.130,
    lng: 33.550
  }
];

const INITIAL_VISITS: Visit[] = [
  {
    id: 'v1',
    clientId: '1',
    date: getTodayString(),
    time: '09:00',
    status: VisitStatus.SCHEDULED,
    type: 'Prospecção',
    notes: 'Apresentação de solução Wifi 6.',
    opportunitiesFound: [],
    plannedServices: ['Redes Estruturadas & Cablagem']
  },
  {
    id: 'v2',
    clientId: '2',
    date: getTodayString(),
    time: '14:30',
    status: VisitStatus.SCHEDULED,
    type: 'Técnica',
    notes: 'Levantamento técnico sala servidores.',
    opportunitiesFound: [],
    plannedServices: ['CCTV & Segurança Eletrónica', 'Hardware & Equipamentos TI']
  }
];

const INITIAL_TASKS: Task[] = [
    {
        id: 't1',
        title: 'Enviar proposta para Vulcan',
        dueDate: getTodayString(),
        priority: TaskPriority.HIGH,
        completed: false
    },
    {
        id: 't2',
        title: 'Revisar stock de câmeras',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        priority: TaskPriority.MEDIUM,
        completed: false
    }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'schedule' | 'clients' | 'map' | 'tasks' | 'reports'>('dashboard');
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [visits, setVisits] = useState<Visit[]>(INITIAL_VISITS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  
  // Modal States
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedClientForVisit, setSelectedClientForVisit] = useState<Client | null>(null);

  // Notification Tracking Ref (avoid duplicate alerts)
  const alertedRef = useRef<Set<string>>(new Set());

  // Initialize Notifications and check Priorities
  useEffect(() => {
    requestNotificationPermission().then(granted => {
      if(granted) console.log("Notificações ativadas");
    });

    // Check for High Priority Tasks Due Today on Load
    const today = getTodayString();
    const urgentTasks = tasks.filter(t => t.dueDate === today && t.priority === TaskPriority.HIGH && !t.completed);
    
    if (urgentTasks.length > 0) {
      addToast(`Você tem ${urgentTasks.length} tarefas urgentes para hoje!`, 'warning');
    }
  }, []);

  // Monitor Loop: Checks every minute for upcoming visits
  useEffect(() => {
    const checkUpcomingVisits = () => {
      const now = new Date();
      
      visits.forEach(visit => {
        if (visit.status !== VisitStatus.SCHEDULED) return;
        if (alertedRef.current.has(visit.id)) return;

        const visitDate = new Date(`${visit.date}T${visit.time}`);
        const diffMs = visitDate.getTime() - now.getTime();
        const diffMins = Math.round(diffMs / 60000);

        // Alert if visit is within 30 minutes
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

    const intervalId = setInterval(checkUpcomingVisits, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, [visits, clients]);

  // Notification Helper
  const addToast = (message: string, type: ToastType = 'info') => {
    const newToast: NotificationToast = {
      id: Date.now().toString() + Math.random(),
      message,
      type
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // New Client Form State
  const [newClient, setNewClient] = useState<Partial<Client>>({
    area: Area.CIDADE,
    classification: ClientClassification.COLD,
    prospectingCount: 0,
    phone: '+258 '
  });

  // New Visit Form State
  const [newVisit, setNewVisit] = useState<Partial<Visit>>({
    date: getTodayString(),
    time: '09:00',
    type: 'Prospecção',
    plannedServices: []
  });

  // New Task Form State
  const [newTask, setNewTask] = useState<{title: string; priority: TaskPriority; date: string}>({
      title: '',
      priority: TaskPriority.MEDIUM,
      date: getTodayString()
  });

  // Handlers
  const handleAddClient = () => {
    // Validações
    if (!newClient.name || !newClient.contactPerson) {
      addToast('Nome da empresa e Focal Point são obrigatórios.', 'error');
      return;
    }

    if (newClient.phone && !isValidMozPhoneNumber(newClient.phone)) {
      addToast('Número de telefone inválido. Use o formato Moçambicano.', 'error');
      return;
    }

    if (newClient.email && !isValidEmail(newClient.email)) {
        addToast('Endereço de email inválido.', 'error');
        return;
    }

    const client: Client = {
      ...newClient as Client,
      id: Date.now().toString(),
      prospectingCount: 0,
      email: newClient.email || '',
      phone: newClient.phone || '',
      address: newClient.address || '',
      category: newClient.category || 'Geral',
      contactRole: newClient.contactRole || 'Staff',
      lat: -16.156, // Default to center if not provided
      lng: 33.586
    };
    setClients([...clients, client]);
    setShowAddClient(false);
    setNewClient({ area: Area.CIDADE, classification: ClientClassification.COLD, prospectingCount: 0, phone: '+258 ' });
    addToast('Cliente adicionado com sucesso!', 'success');
  };

  const handleUpdateClient = (updated: Client) => {
    setClients(clients.map(c => c.id === updated.id ? updated : c));
    addToast('Informações do cliente atualizadas.', 'success');
  };

  const handleAddVisit = () => {
    // Validation
    if (!selectedClientForVisit) {
        addToast('Selecione um cliente.', 'error');
        return;
    }
    if (!newVisit.date) {
        addToast('Data da visita é obrigatória.', 'error');
        return;
    }
    if (isDateInPast(newVisit.date)) {
        addToast('Não é possível agendar visitas para o passado.', 'error');
        return;
    }

    if (newVisit.date && selectedClientForVisit) {
      const visit: Visit = {
        ...newVisit as Visit,
        id: Date.now().toString(),
        clientId: selectedClientForVisit.id,
        status: VisitStatus.SCHEDULED,
        opportunitiesFound: [],
        notes: newVisit.notes || '',
        plannedServices: newVisit.plannedServices || []
      };
      
      setVisits([...visits, visit]);
      
      // Logic: Increment prospecting count if type is Prospecção
      if (visit.type === 'Prospecção') {
         const updatedClient = {
             ...selectedClientForVisit,
             prospectingCount: selectedClientForVisit.prospectingCount + 1
         };
         setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
      }

      setShowAddVisit(false);
      setSelectedClientForVisit(null);
      setNewVisit({
        date: getTodayString(),
        time: '09:00',
        type: 'Prospecção',
        plannedServices: []
      });
      
      addToast('Visita agendada com sucesso!', 'success');
      sendNativeNotification('Agenda Atualizada', `Visita marcada para ${visit.date} com ${selectedClientForVisit.name}`);
    }
  };

  const handleAddTaskFromModal = () => {
    if (!newTask.title) {
        addToast('O título da tarefa é obrigatório.', 'error');
        return;
    }
    
    const task: Task = {
        id: Date.now().toString(),
        title: newTask.title,
        priority: newTask.priority,
        dueDate: newTask.date,
        completed: false
    };
    setTasks([...tasks, task]);
    setShowAddTask(false);
    setNewTask({ title: '', priority: TaskPriority.MEDIUM, date: getTodayString() });
    addToast('Tarefa criada!', 'success');
  };

  const handleVisitStatusUpdate = (id: string, status: VisitStatus) => {
    setVisits(visits.map(v => v.id === id ? { ...v, status } : v));
    if (status === VisitStatus.COMPLETED) {
        addToast('Visita concluída! Bom trabalho.', 'success');
    }
  };

  const openScheduleModal = (client: Client) => {
      setSelectedClientForVisit(client);
      setShowAddVisit(true);
  };

  // Task Handlers
  const handleAddTask = (task: Task) => {
    setTasks([...tasks, task]);
    addToast('Tarefa adicionada.', 'success');
  };

  const handleToggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    addToast('Tarefa removida.', 'info');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f3f4f6] text-gray-800 font-sans">
      
      {/* Notification Toasts */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Top Bar */}
      <div className="bg-white p-4 shadow-sm flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-ribeiro-red rounded flex items-center justify-center text-white font-bold text-xl">R</div>
            <h1 className="font-bold text-xl tracking-tight text-ribeiro-dark">Ribeiro, Lda.</h1>
        </div>
        {currentView === 'dashboard' && (
             <button 
                onClick={() => setCurrentView('reports')}
                className="text-gray-600 bg-gray-100 p-2 rounded-full hover:bg-gray-200"
            >
                <BarChart2 size={20} />
            </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {currentView === 'dashboard' && <Dashboard clients={clients} visits={visits} />}
        {currentView === 'reports' && <Reports clients={clients} visits={visits} />}
        {currentView === 'clients' && (
            <ClientList 
                clients={clients} 
                visits={visits}
                onAddClient={() => setShowAddClient(true)} 
                onUpdateClient={handleUpdateClient}
                onScheduleVisit={openScheduleModal}
            />
        )}
        {currentView === 'schedule' && (
            <Schedule 
                visits={visits} 
                clients={clients} 
                onUpdateVisitStatus={handleVisitStatusUpdate}
            />
        )}
        {currentView === 'map' && (
            <ClientMap clients={clients} visits={visits} />
        )}
        {currentView === 'tasks' && (
            <TaskManager 
                tasks={tasks} 
                visits={visits}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
            />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 flex justify-around items-center h-16 pb-safe z-20 text-[10px]">
        <button 
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center justify-center w-full h-full ${currentView === 'dashboard' || currentView === 'reports' ? 'text-ribeiro-red' : 'text-gray-400'}`}
        >
          <LayoutDashboard size={20} />
          <span className="font-medium mt-1">Home</span>
        </button>
        <button 
          onClick={() => setCurrentView('schedule')}
          className={`flex flex-col items-center justify-center w-full h-full ${currentView === 'schedule' ? 'text-ribeiro-red' : 'text-gray-400'}`}
        >
          <CalendarDays size={20} />
          <span className="font-medium mt-1">Agenda</span>
        </button>
        <button 
          onClick={() => setCurrentView('clients')}
          className={`flex flex-col items-center justify-center w-full h-full ${currentView === 'clients' ? 'text-ribeiro-red' : 'text-gray-400'}`}
        >
          <Users size={20} />
          <span className="font-medium mt-1">Clientes</span>
        </button>
        <button 
          onClick={() => setCurrentView('map')}
          className={`flex flex-col items-center justify-center w-full h-full ${currentView === 'map' ? 'text-ribeiro-red' : 'text-gray-400'}`}
        >
          <MapIcon size={20} />
          <span className="font-medium mt-1">Mapa</span>
        </button>
        <button 
          onClick={() => setCurrentView('tasks')}
          className={`flex flex-col items-center justify-center w-full h-full ${currentView === 'tasks' ? 'text-ribeiro-red' : 'text-gray-400'}`}
        >
          <CheckSquare size={20} />
          <span className="font-medium mt-1">Tarefas</span>
        </button>
      </div>

      {/* Floating Action Button (Only on Schedule/Clients/Tasks) */}
      {(currentView === 'clients' || currentView === 'schedule' || currentView === 'tasks') && (
        <button 
            onClick={() => {
                if (currentView === 'clients') {
                    setShowAddClient(true);
                } else if (currentView === 'schedule') {
                    setSelectedClientForVisit(null); // Reset to allow selection
                    setShowAddVisit(true);
                } else if (currentView === 'tasks') {
                    setShowAddTask(true);
                }
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
                <input 
                  className="w-full p-3 border rounded-lg" placeholder="Ex: Hotel Tete" 
                  value={newClient.name || ''} onChange={e => setNewClient({...newClient, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                 <div>
                   <label className="text-xs font-bold text-gray-500">Área</label>
                   <select 
                      className="w-full p-3 border rounded-lg bg-white"
                      value={newClient.area}
                      onChange={e => setNewClient({...newClient, area: e.target.value as Area})}
                   >
                      {Object.values(Area).map(a => <option key={a} value={a}>{a}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="text-xs font-bold text-gray-500">Categoria</label>
                   <input 
                      className="w-full p-3 border rounded-lg" placeholder="Ex: Hotel"
                      value={newClient.category || ''} onChange={e => setNewClient({...newClient, category: e.target.value})}
                   />
                 </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Endereço</label>
                <input 
                  className="w-full p-3 border rounded-lg" placeholder="Rua, Bairro..." 
                  value={newClient.address || ''} onChange={e => setNewClient({...newClient, address: e.target.value})}
                />
              </div>

              <h4 className="text-sm font-bold text-gray-800 mt-2 border-b pb-1">Focal Point</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-xs font-bold text-gray-500">Nome *</label>
                    <input 
                        className="w-full p-3 border rounded-lg" placeholder="Sr. João" 
                        value={newClient.contactPerson || ''} onChange={e => setNewClient({...newClient, contactPerson: e.target.value})}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500">Cargo</label>
                    <input 
                        className="w-full p-3 border rounded-lg" placeholder="Gerente" 
                        value={newClient.contactRole || ''} onChange={e => setNewClient({...newClient, contactRole: e.target.value})}
                    />
                </div>
              </div>

              <div>
                  <label className="text-xs font-bold text-gray-500">Telefone (MZ)</label>
                  <input 
                    className="w-full p-3 border rounded-lg" 
                    placeholder="+258 84 123 4567" 
                    type="tel"
                    value={newClient.phone || '+258 '} 
                    onChange={e => setNewClient({...newClient, phone: formatMozPhoneNumber(e.target.value)})}
                  />
              </div>
               <div>
                  <label className="text-xs font-bold text-gray-500">Email</label>
                  <input 
                    className="w-full p-3 border rounded-lg" placeholder="contacto@empresa.co.mz" type="email"
                    value={newClient.email || ''} onChange={e => setNewClient({...newClient, email: e.target.value})}
                  />
              </div>
              
              <button onClick={handleAddClient} className="w-full bg-ribeiro-red text-white py-4 rounded-xl font-bold mt-4 shadow-md active:scale-95 transition-transform">
                Salvar Cliente
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
                     <select 
                        className="w-full p-3 border rounded-lg bg-white"
                        onChange={e => setSelectedClientForVisit(clients.find(c => c.id === e.target.value) || null)}
                      >
                        <option value="">Selecione um Cliente...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                  </div>
              )}
              {selectedClientForVisit && (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 uppercase font-bold">Cliente Selecionado</span>
                      <p className="font-bold text-ribeiro-dark text-lg">{selectedClientForVisit.name}</p>
                      <p className="text-xs text-gray-500">{selectedClientForVisit.area}</p>
                  </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-500">Data *</label>
                    <input 
                        type="date" className="w-full p-3 border rounded-lg"
                        min={getTodayString()}
                        value={newVisit.date} onChange={e => setNewVisit({...newVisit, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Hora</label>
                    <input 
                        type="time" className="w-full p-3 border rounded-lg"
                        value={newVisit.time} onChange={e => setNewVisit({...newVisit, time: e.target.value})}
                    />
                  </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500">Tipo de Visita</label>
                <select 
                    className="w-full p-3 border rounded-lg bg-white"
                    value={newVisit.type}
                    onChange={e => setNewVisit({...newVisit, type: e.target.value as any})}
                >
                    <option value="Prospecção">Prospecção</option>
                    <option value="Acompanhamento">Acompanhamento</option>
                    <option value="Técnica">Técnica</option>
                </select>
              </div>

              {/* Service Selection Checklist */}
              <div className="border p-3 rounded-lg">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                      <Briefcase size={12} /> Serviços a Oferecer
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                      {SERVICES_LIST.map(service => (
                          <label key={service} className="flex items-center space-x-3 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                              <input
                                  type="checkbox"
                                  checked={(newVisit.plannedServices || []).includes(service)}
                                  onChange={(e) => {
                                      const current = newVisit.plannedServices || [];
                                      if (e.target.checked) {
                                          setNewVisit({...newVisit, plannedServices: [...current, service]});
                                      } else {
                                          setNewVisit({...newVisit, plannedServices: current.filter(s => s !== service)});
                                      }
                                  }}
                                  className="w-4 h-4 text-ribeiro-red border-gray-300 rounded focus:ring-ribeiro-red"
                              />
                              <span className="text-gray-700">{service}</span>
                          </label>
                      ))}
                  </div>
              </div>

              <textarea 
                className="w-full p-3 border rounded-lg h-24" placeholder="Notas adicionais sobre o agendamento..."
                value={newVisit.notes} onChange={e => setNewVisit({...newVisit, notes: e.target.value})}
              />

              <button onClick={handleAddVisit} className="w-full bg-ribeiro-dark text-white py-4 rounded-xl font-bold mt-2 shadow-md active:scale-95 transition-transform">
                Confirmar Agendamento
              </button>
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
              <div>
                  <label className="text-xs font-bold text-gray-500">Título *</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border rounded-lg" 
                    placeholder="Ex: Enviar Orçamento"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-xs font-bold text-gray-500">Prioridade</label>
                    <select 
                        className="w-full p-3 border rounded-lg bg-white"
                        value={newTask.priority}
                        onChange={(e) => setNewTask({...newTask, priority: e.target.value as TaskPriority})}
                    >
                        <option value={TaskPriority.HIGH}>Alta</option>
                        <option value={TaskPriority.MEDIUM}>Média</option>
                        <option value={TaskPriority.LOW}>Baixa</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500">Vencimento</label>
                    <input 
                        type="date" 
                        className="w-full p-3 border rounded-lg"
                        value={newTask.date}
                        onChange={(e) => setNewTask({...newTask, date: e.target.value})}
                    />
                </div>
              </div>
              <button onClick={handleAddTaskFromModal} className="w-full bg-ribeiro-dark text-white py-4 rounded-xl font-bold mt-2 shadow-md active:scale-95 transition-transform">
                Criar Tarefa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
