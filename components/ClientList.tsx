import React, { useState } from 'react';
import { Client, Area, Visit, ClientClassification } from '../types';
import { MapPin, Phone, User, Briefcase, Plus, ChevronRight, History, StickyNote } from 'lucide-react';

interface ClientListProps {
  clients: Client[];
  visits: Visit[];
  onAddClient: () => void;
  onUpdateClient: (updatedClient: Client) => void;
  onScheduleVisit: (client: Client) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, visits, onAddClient, onUpdateClient, onScheduleVisit }) => {
  const [filterArea, setFilterArea] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(client => {
    const matchesArea = filterArea === 'All' || client.area === filterArea;
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesArea && matchesSearch;
  });

  const handleSaveNotes = () => {
      if (selectedClient) {
          onUpdateClient(selectedClient);
      }
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col">
      {/* Header & Filters */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-ribeiro-dark">Cartela de Clientes</h2>
        <button onClick={onAddClient} className="bg-ribeiro-red text-white p-2 rounded-full shadow-lg">
          <Plus size={24} />
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <input 
          type="text" 
          placeholder="Buscar cliente..." 
          className="p-2 rounded-lg border border-gray-300 flex-grow min-w-[150px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="p-2 rounded-lg border border-gray-300 bg-white"
          value={filterArea}
          onChange={(e) => setFilterArea(e.target.value)}
        >
          <option value="All">Todas Áreas</option>
          {Object.values(Area).map(area => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="flex-grow overflow-y-auto space-y-3">
        {filteredClients.map(client => (
          <div 
            key={client.id} 
            onClick={() => setSelectedClient(client)}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{client.name}</h3>
                <div className="flex items-center text-gray-500 text-xs mt-1">
                  <MapPin size={12} className="mr-1" />
                  {client.area}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium 
                ${client.classification === ClientClassification.HOT ? 'bg-red-100 text-red-800' : 
                  client.classification === ClientClassification.CONTRACTED ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {client.classification}
              </span>
            </div>
            
            <div className="mt-3 flex justify-between items-center">
              <div className="text-sm text-gray-600 flex flex-col">
                <span className="flex items-center"><User size={14} className="mr-2 text-gray-400"/> {client.contactPerson}</span>
                <span className="flex items-center mt-1"><Briefcase size={14} className="mr-2 text-gray-400"/> {client.category}</span>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </div>

            {/* Prospecting Progress Bar */}
            <div className="mt-3">
                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>Prospecção ({client.prospectingCount}/3)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                        className="bg-ribeiro-red h-1.5 rounded-full" 
                        style={{ width: `${Math.min((client.prospectingCount / 3) * 100, 100)}%` }}
                    ></div>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            <div className="p-6 border-b sticky top-0 bg-white z-10 rounded-t-2xl flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedClient.name}</h2>
                    <p className="text-sm text-gray-500">{selectedClient.category} • {selectedClient.area}</p>
                </div>
                <button onClick={() => setSelectedClient(null)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-bold">Focal Point</p>
                      <p className="font-medium text-gray-800">{selectedClient.contactPerson}</p>
                      <p className="text-sm text-gray-600">{selectedClient.contactRole}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-bold">Contacto</p>
                      <p className="font-medium text-gray-800">{selectedClient.phone}</p>
                      <p className="text-sm text-gray-600 truncate">{selectedClient.email}</p>
                  </div>
                  <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-bold">Endereço</p>
                    <p className="text-sm text-gray-800">{selectedClient.address}</p>
                  </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                  <button 
                    onClick={() => { onScheduleVisit(selectedClient); setSelectedClient(null); }}
                    className="flex-1 bg-ribeiro-dark text-white py-3 rounded-lg font-medium flex justify-center items-center gap-2"
                  >
                    <History size={18} />
                    Agendar Visita
                  </button>
                  <a 
                    href={`tel:${selectedClient.phone}`}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium flex justify-center items-center gap-2"
                  >
                    <Phone size={18} />
                    Ligar
                  </a>
              </div>

              {/* Observations Section (Replaced AI) */}
              <div className="border-t pt-4">
                <div className="flex items-center mb-2 text-gray-800">
                    <StickyNote size={18} className="mr-2 text-ribeiro-red" />
                    <h3 className="font-bold">Observações</h3>
                </div>
                <textarea
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[120px] focus:ring-2 focus:ring-ribeiro-red focus:outline-none"
                    placeholder="Adicione notas importantes sobre o cliente..."
                    value={selectedClient.notes || ''}
                    onChange={(e) => setSelectedClient({ ...selectedClient, notes: e.target.value })}
                    onBlur={handleSaveNotes}
                />
                <p className="text-[10px] text-gray-400 mt-1 text-right">Salvo automaticamente ao sair do campo.</p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;