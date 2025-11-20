export enum Area {
  CIDADE = 'Cidade',
  MARGEM = 'Margem',
  MOATIZE = 'Moatize',
  EMPRESA_MINEIRA = 'Empresa Mineira'
}

export enum VisitStatus {
  SCHEDULED = 'Agendada',
  COMPLETED = 'Realizada',
  CANCELLED = 'Cancelada'
}

export enum ClientClassification {
  COLD = 'Frio',
  WARM = 'Morno',
  HOT = 'Quente',
  CONTRACTED = 'Contratado'
}

export interface Opportunity {
  id: string;
  description: string;
  value?: number;
  serviceType: string; // e.g., "Networking", "CCTV", "Software", "Hardware"
}

export interface Visit {
  id: string;
  clientId: string;
  date: string; // ISO Date string YYYY-MM-DD
  time: string; // HH:mm
  status: VisitStatus;
  type: 'Prospecção' | 'Acompanhamento' | 'Técnica';
  notes: string;
  opportunitiesFound: Opportunity[];
  plannedServices?: string[];
}

export interface Client {
  id: string;
  name: string;
  address: string;
  area: Area;
  category: string; // e.g., "Logística", "Hotelaria", "Mineração"
  classification: ClientClassification;
  contactPerson: string; // Focal Point
  contactRole: string;
  phone: string;
  email: string;
  prospectingCount: number; // Count of prospecting visits (Goal: 3)
  lastVisit?: string;
  notes?: string;
  lat?: number;
  lng?: number;
}

export interface DashboardStats {
  totalClients: number;
  visitsThisWeek: number;
  prospectsHot: number;
  pendingReports: number;
}

export enum TaskPriority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta'
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: TaskPriority;
  completed: boolean;
  relatedClientId?: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationToast {
  id: string;
  message: string;
  type: ToastType;
}