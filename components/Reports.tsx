import React from 'react';
import { Client, Visit, VisitStatus, Area, Opportunity } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { FileText, TrendingUp, DollarSign } from 'lucide-react';

interface ReportsProps {
  clients: Client[];
  visits: Visit[];
}

const Reports: React.FC<ReportsProps> = ({ clients, visits }) => {
  // 1. Visit Summary by Area
  const visitsByArea = Object.values(Area).map(area => {
    const areaClientIds = clients.filter(c => c.area === area).map(c => c.id);
    const visitCount = visits.filter(v => areaClientIds.includes(v.clientId) && v.status === VisitStatus.COMPLETED).length;
    return { name: area, visitas: visitCount };
  });

  // 2. Opportunities Summary
  const allOpportunities: Opportunity[] = visits.flatMap(v => v.opportunitiesFound || []);
  const oppsByType = allOpportunities.reduce((acc, curr) => {
    acc[curr.serviceType] = (acc[curr.serviceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const oppsData = Object.keys(oppsByType).map(key => ({
    name: key,
    count: oppsByType[key]
  }));

  // 3. Monthly Interaction History (Mock logic assuming current year for demo)
  const visitsByMonth = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Jan-Dec
  visits.forEach(v => {
    const month = new Date(v.date).getMonth();
    visitsByMonth[month]++;
  });
  const monthlyData = visitsByMonth.map((count, idx) => ({
    name: new Date(0, idx).toLocaleString('pt-PT', { month: 'short' }),
    visitas: count
  })).slice(new Date().getMonth() - 5, new Date().getMonth() + 1); // Last 6 months

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in h-full overflow-y-auto">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios & Análises</h1>
        <p className="text-gray-500 text-sm">Performance comercial e operacional</p>
      </header>

      {/* Opportunities Card */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center mb-4 text-ribeiro-red">
          <TrendingUp className="mr-2" size={20} />
          <h3 className="font-bold text-lg">Oportunidades (OPV)</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg text-center">
                <span className="block text-2xl font-bold text-gray-800">{allOpportunities.length}</span>
                <span className="text-xs text-gray-500">Identificadas</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center">
                <span className="block text-2xl font-bold text-green-600">
                   {allOpportunities.filter(o => o.value).reduce((acc, curr) => acc + (curr.value || 0), 0).toLocaleString('pt-MZ')} MZN
                </span>
                <span className="text-xs text-gray-500">Valor Estimado</span>
            </div>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={oppsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 10}} />
              <Tooltip />
              <Bar dataKey="count" fill="#1a1a1a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Visits by Area */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center mb-4 text-gray-800">
          <FileText className="mr-2" size={20} />
          <h3 className="font-bold text-lg">Visitas por Área</h3>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={visitsByArea} layout="vertical" margin={{left: 20}}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11}} />
              <Tooltip />
              <Bar dataKey="visitas" fill="#aa0000" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interaction History */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
         <h3 className="font-bold text-lg mb-4 text-gray-800">Histórico de Interações</h3>
         <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis hide />
                <Tooltip />
                <Line type="monotone" dataKey="visitas" stroke="#aa0000" strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};

export default Reports;