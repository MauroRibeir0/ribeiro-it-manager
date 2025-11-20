
import React, { useState } from 'react';
import { Visit, Client, VisitStatus, Opportunity } from '../types';
import { Calendar as CalendarIcon, MapPin, Clock, Phone, Briefcase, User, CheckCircle, Layers, X, DollarSign, Plus, TrendingUp } from 'lucide-react';

interface ScheduleProps {
  visits: Visit[];
  clients: Client[];
  servicesList: string[];
  onUpdateVisitStatus: (visitId: string, status: VisitStatus) => void;
  onCompleteVisit: (visitId: string, opportunities: Opportunity[]) => void;
}

const Schedule: React.FC<ScheduleProps> = ({ visits, clients, servicesList, onUpdateVisitStatus, onCompleteVisit }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Completion Modal State
  const [completingVisitId, setCompletingVisitId] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [newOppService, setNewOppService] = useState(servicesList[0]);
  const [newOppValue, setNewOppValue] = useState('');

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const filteredVisits = visits
    .filter(v => isSameDay(new Date(v.date), selectedDate))
    .sort((a, b) => a.time.localeCompare(b.time));

  const getClient = (id: string) => clients.find(c => c.id === id);

  const handleAddOpportunity = () => {
      if (!newOppService) return;
      const opp: Opportunity = {
          id: Date.now().toString(),
          description: `Interesse em ${newOppService}`,
          serviceType: newOppService,
          value: Number(newOppValue) || 0
      };
      setOpportunities([...opportunities, opp]);
      setNewOppValue('');
  };

  const confirmCompletion = () => {
      if (completingVisitId) {
          onCompleteVisit(completingVisitId, opportunities);
          setCompletingVisitId(null);
          setOpportunities([]);
      }
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col">
        <header className="mb-6">
            <h2 className="text-2xl font-bold text-ribeiro-dark">Agenda</h2>
            <p className="text-gray-500 text-sm">Gestão de visitas semanais</p>
        </header>

        {/* Date Selector */}
        <div className="flex overflow-x-auto space-x-3 pb-4 mb-2 scrollbar-hide">
            {weekDates.map((date, idx) => {
                const isSelected = isSameDay(date, selectedDate);
                const dayName = date.toLocaleDateString('pt-PT', { weekday: 'short' }).slice(0, 3);
                const dayNum = date.getDate();
                
                return (
                    <button
                        key={idx}
                        onClick={() => setSelectedDate(date)}
                        className={`flex flex-col items-center justify-center min-w-[60px] h-[80px] rounded-2xl transition-colors
                            ${isSelected ? 'bg-ribeiro-red text-white shadow-lg transform scale-105' : 'bg-white text-gray-400 border border-gray-100'}`}
                    >
                        <span className="text-xs uppercase font-bold mb-1">{dayName}</span>
                        <span className="text-xl font-bold">{dayNum}</span>
                    </button>
                );
            })}
        </div>

        {/* Agenda List */}
        <div className="flex-1 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Visitas do Dia ({filteredVisits.length})
            </h3>

            {filteredVisits.length === 0 ? (
                <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                    <CalendarIcon size={48} className="mb-3 opacity-20" />
                    <p>Nenhuma visita agendada para este dia.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredVisits.map(visit => {
                        const client = getClient(visit.clientId);
                        if (!client) return null;
                        const isCompleted = visit.status === VisitStatus.COMPLETED;

                        return (
                            <div key={visit.id} className={`relative bg-white rounded-xl p-0 shadow-sm border-l-4 
                                ${isCompleted ? 'border-green-500 opacity-75' : 'border-ribeiro-red'} overflow-hidden`}>
                                
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 text-ribeiro-red font-bold text-lg">
                                            <Clock size={18} />
                                            {visit.time}
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded font-medium ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {visit.status} - {visit.type}
                                        </span>
                                    </div>

                                    <h4 className="font-bold text-gray-900 text-xl mb-1">{client.name}</h4>
                                    
                                    <div className="space-y-2 mt-3">
                                        <div className="flex items-start text-sm text-gray-600">
                                            <MapPin size={16} className="mr-2 mt-0.5 shrink-0" />
                                            <span>{client.address}, {client.area}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <User size={16} className="mr-2 shrink-0" />
                                            <span>FP: {client.contactPerson}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Phone size={16} className="mr-2 shrink-0" />
                                            <a href={`tel:${client.phone}`} className="underline decoration-gray-300">{client.phone}</a>
                                        </div>
                                    </div>

                                    {/* Planned Services (Visible if Scheduled) */}
                                    {!isCompleted && visit.plannedServices && visit.plannedServices.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center">
                                                <Layers size={12} className="mr-1"/> Planejado:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {visit.plannedServices.map(service => (
                                                    <span key={service} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 font-medium">
                                                        {service}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Opportunities Found (Visible if Completed) */}
                                    {isCompleted && visit.opportunitiesFound && visit.opportunitiesFound.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-gray-100 bg-green-50/50 -mx-4 px-4 pb-2">
                                            <p className="text-xs font-bold text-green-800 uppercase mb-2 flex items-center pt-2">
                                                <TrendingUp size={12} className="mr-1"/> Oportunidades Identificadas:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {visit.opportunitiesFound.map((op, idx) => (
                                                    <div key={idx} className="text-[10px] bg-white text-green-700 px-2 py-1 rounded border border-green-200 font-medium shadow-sm flex items-center">
                                                        {op.serviceType}
                                                        {op.value && op.value > 0 && <span className="ml-1 text-green-600 font-bold">({op.value.toLocaleString()} MT)</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {!isCompleted && (
                                    <div className="bg-gray-50 px-4 py-3 flex justify-end border-t border-gray-100 gap-2">
                                         <button 
                                            onClick={() => onUpdateVisitStatus(visit.id, VisitStatus.CANCELLED)}
                                            className="text-red-500 text-sm font-medium hover:underline px-2"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            onClick={() => setCompletingVisitId(visit.id)}
                                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <CheckCircle size={16} />
                                            Realizada
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Complete Visit Modal */}
        {completingVisitId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-slide-up max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Finalizar Visita</h3>
                        <button onClick={() => { setCompletingVisitId(null); setOpportunities([]); }}><X /></button>
                    </div>

                    <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium mb-2">Oportunidades Identificadas (OPV)</p>
                        <p className="text-xs text-blue-600 mb-3">Registre os serviços que o cliente demonstrou interesse.</p>
                        
                        <div className="flex gap-2 mb-2">
                            <select 
                                className="flex-grow text-sm p-2 border rounded bg-white"
                                value={newOppService}
                                onChange={e => setNewOppService(e.target.value)}
                            >
                                {servicesList.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <DollarSign size={14} className="absolute left-2 top-2.5 text-gray-500" />
                                <input 
                                    type="number" 
                                    placeholder="Valor Est. (MZN)" 
                                    className="w-full pl-7 p-2 text-sm border rounded"
                                    value={newOppValue}
                                    onChange={e => setNewOppValue(e.target.value)}
                                />
                            </div>
                            <button onClick={handleAddOpportunity} className="bg-blue-600 text-white p-2 rounded">
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>

                    {opportunities.length > 0 && (
                        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden max-h-32 overflow-y-auto">
                            {opportunities.map((op, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 border-b last:border-0 text-sm bg-gray-50">
                                    <span>{op.serviceType}</span>
                                    <span className="font-bold text-green-700">{op.value?.toLocaleString()} MT</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <button 
                        onClick={confirmCompletion}
                        className="w-full bg-ribeiro-dark text-white py-3 rounded-xl font-bold shadow-md mt-auto"
                    >
                        Concluir Visita
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default Schedule;
