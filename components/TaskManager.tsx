import React, { useState } from 'react';
import { Task, TaskPriority, Visit } from '../types';
import { CheckCircle, Circle, AlertCircle, Plus, Trash2, Bell } from 'lucide-react';

interface TaskManagerProps {
  tasks: Task[];
  visits: Visit[]; // To show visits as auto-tasks
  onAddTask: (task: Task) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ tasks, visits, onAddTask, onToggleTask, onDeleteTask }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = () => {
    if (!newTaskTitle.trim()) return;
    
    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      priority: newTaskPriority,
      dueDate: newTaskDate,
      completed: false
    };

    onAddTask(task);
    setNewTaskTitle('');
  };

  // Combine Manual Tasks with upcoming Visits
  const upcomingVisitsAsTasks = visits
    .filter(v => new Date(v.date) >= new Date())
    .map(v => ({
      id: `visit-${v.id}`,
      title: `Visita: ${v.type} @ ${v.time}`,
      dueDate: v.date,
      priority: TaskPriority.HIGH,
      completed: v.status === 'Realizada',
      isVisit: true
    }));

  const allItems = [...tasks, ...upcomingVisitsAsTasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="p-4 pb-24 h-full flex flex-col">
      <header className="mb-6 flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-ribeiro-dark">Tarefas</h2>
            <p className="text-gray-500 text-sm">Gestão de trabalho e lembretes</p>
        </div>
        <Bell className="text-ribeiro-red animate-pulse" />
      </header>

      {/* Add Task Form */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-100">
        <div className="flex gap-2 mb-2">
            <input 
                type="text" 
                className="flex-grow p-2 border-b border-gray-200 outline-none text-sm"
                placeholder="Nova tarefa..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <select 
                className="text-xs bg-gray-50 border rounded px-2 outline-none"
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
            >
                <option value={TaskPriority.HIGH}>Alta</option>
                <option value={TaskPriority.MEDIUM}>Média</option>
                <option value={TaskPriority.LOW}>Baixa</option>
            </select>
        </div>
        <div className="flex justify-between items-center">
            <input 
                type="date" 
                className="text-xs text-gray-500 outline-none bg-transparent"
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
            />
            <button 
                onClick={handleSubmit}
                className="bg-ribeiro-dark text-white p-2 rounded-full shadow-md hover:scale-105 transition-transform"
            >
                <Plus size={16} />
            </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-grow overflow-y-auto space-y-3">
        {allItems.map((item: any) => (
            <div key={item.id} className={`flex items-center p-4 bg-white rounded-xl shadow-sm border-l-4 
                ${item.priority === TaskPriority.HIGH ? 'border-red-500' : item.priority === TaskPriority.MEDIUM ? 'border-yellow-500' : 'border-gray-300'}
                ${item.completed ? 'opacity-50' : ''}
            `}>
                <button 
                    onClick={() => !item.isVisit && onToggleTask(item.id)}
                    disabled={item.isVisit}
                    className={`mr-3 ${item.isVisit ? 'cursor-default' : 'cursor-pointer'}`}
                >
                    {item.completed ? <CheckCircle className="text-green-500" size={20} /> : <Circle className="text-gray-300" size={20} />}
                </button>
                
                <div className="flex-grow">
                    <p className={`text-sm font-medium ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {item.title}
                    </p>
                    <div className="flex gap-2 mt-1">
                         <span className="text-[10px] text-gray-500 flex items-center">
                             {item.isVisit && <AlertCircle size={10} className="mr-1" />}
                             {new Date(item.dueDate).toLocaleDateString('pt-PT')}
                         </span>
                         {item.priority === TaskPriority.HIGH && (
                             <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1 rounded">Urgente</span>
                         )}
                    </div>
                </div>

                {!item.isVisit && (
                    <button onClick={() => onDeleteTask(item.id)} className="text-gray-300 hover:text-red-500">
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        ))}

        {allItems.length === 0 && (
            <div className="text-center text-gray-400 py-10 text-sm">
                Nenhuma tarefa pendente.
            </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;