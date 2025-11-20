import React, { useState } from 'react';
import { Visit, Client, VisitStatus } from '../types';
import { Calendar as CalendarIcon, MapPin, Clock, Phone, Briefcase, User, CheckCircle, Layers } from 'lucide-react';

interface ScheduleProps {
  visits: Visit[];
  clients: Client[];
  onUpdateVisitStatus: (visitId: string, status: VisitStatus) => void;
}

const Schedule: React.FC<ScheduleProps> = ({ visits, clients, onUpdateVisitStatus }) => {
  // Default to today
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Helper to format date comparison
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  // Generate next 7 days for horizontal scroll
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const filteredVisits = visits
    .filter(v => isSameDay(new Date(v.date), selectedDate))
    .sort((a, b) => a.time.localeCompare(b.time));

  const getClient = (id: string) => clients.find(c => c.id === id);

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

        {/* Agenda List - Morning View Requirements */}
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
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">
                                            {visit.type}
                                        </span>
                                    </div>

                                    <h4 className="font-bold text-gray-900 text-xl mb-1">{client.name}</h4>
                                    
                                    <div className="space-y-2 mt-3">
                                        <div className="flex items-start text-sm text-gray-600">
                                            <MapPin size={16} className="mr-2 mt-0.5 shrink-0" />
                                            <span>{client.address}, {client.area}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Briefcase size={16} className="mr-2 shrink-0" />
                                            <span>{client.category} • <span className="font-medium text-ribeiro-dark">{client.classification}</span></span>
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

                                    {/* Planned Services Tags */}
                                    {visit.plannedServices && visit.plannedServices.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center">
                                                <Layers size={12} className="mr-1"/> Ofertar Serviços:
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
                                </div>

                                {/* Action Footer */}
                                {!isCompleted && (
                                    <div className="bg-gray-50 px-4 py-3 flex justify-end border-t border-gray-100">
                                        <button 
                                            onClick={() => onUpdateVisitStatus(visit.id, VisitStatus.COMPLETED)}
                                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <CheckCircle size={16} />
                                            Marcar Realizada
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
};

export default Schedule;