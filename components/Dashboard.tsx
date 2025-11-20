import React from 'react';
import { Client, Visit, VisitStatus, ClientClassification, Area } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, Calendar, Target, AlertCircle } from 'lucide-react';

interface DashboardProps {
  clients: Client[];
  visits: Visit[];
}

const Dashboard: React.FC<DashboardProps> = ({ clients, visits }) => {
  // Stats Calculation
  const totalClients = clients.length;
  const activeProspects = clients.filter(c => c.classification !== ClientClassification.CONTRACTED).length;
  
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const visitsThisWeek = visits.filter(v => {
    const vDate = new Date(v.date);
    return vDate >= startOfWeek && v.status !== VisitStatus.CANCELLED;
  }).length;

  const hotLeads = clients.filter(c => c.classification === ClientClassification.HOT).length;

  // Data for Charts
  const areaData = Object.values(Area).map(area => ({
    name: area,
    value: clients.filter(c => c.area === area).length
  })).filter(d => d.value > 0);

  const classificationData = Object.values(ClientClassification).map(cls => ({
    name: cls,
    count: clients.filter(c => c.classification === cls).length
  }));

  const COLORS = ['#aa0000', '#333333', '#666666', '#999999'];

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Geral</h1>
        <p className="text-gray-500 text-sm">Visão geral da Ribeiro, Lda.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-ribeiro-red flex flex-col">
          <div className="flex items-center text-gray-500 mb-2">
            <Users size={16} className="mr-2" />
            <span className="text-xs uppercase font-semibold">Total Clientes</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{totalClients}</span>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-gray-800 flex flex-col">
          <div className="flex items-center text-gray-500 mb-2">
            <Calendar size={16} className="mr-2" />
            <span className="text-xs uppercase font-semibold">Visitas (Semana)</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{visitsThisWeek}</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-500 flex flex-col">
          <div className="flex items-center text-gray-500 mb-2">
            <Target size={16} className="mr-2" />
            <span className="text-xs uppercase font-semibold">Leads Quentes</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{hotLeads}</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500 flex flex-col">
          <div className="flex items-center text-gray-500 mb-2">
            <AlertCircle size={16} className="mr-2" />
            <span className="text-xs uppercase font-semibold">Em Prospecção</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{activeProspects}</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Area Distribution */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Distribuição por Área</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={areaData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {areaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-xs mt-2">
             {areaData.map((entry, index) => (
               <div key={entry.name} className="flex items-center">
                 <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length]}}></span>
                 {entry.name}
               </div>
             ))}
          </div>
        </div>

        {/* Pipeline Status */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Pipeline de Vendas</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classificationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="count" fill="#aa0000" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;