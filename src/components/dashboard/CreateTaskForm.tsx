import { motion } from "framer-motion";
import { Plus, Sparkles, Flag, CalendarDays, X, Loader2 } from "lucide-react";

type Priority = 'baja' | 'normal' | 'alta';

interface CreateTaskFormProps {
  newTaskTitle: string;
  setNewTaskTitle: (val: string) => void;
  newTaskPriority: Priority;
  cyclePriority: () => void;
  newTaskDate: string;
  setNewTaskDate: (val: string) => void;
  isAdding: boolean;
  handleAddTask: (e: React.FormEvent) => void;
  priorityColors: Record<Priority, string>;
}

export default function CreateTaskForm({
  newTaskTitle, setNewTaskTitle, newTaskPriority, cyclePriority,
  newTaskDate, setNewTaskDate, isAdding, handleAddTask, priorityColors
}: CreateTaskFormProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <motion.form 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
      onSubmit={handleAddTask} 
      className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all"
    >
      <div className="flex items-center p-1">
        <div className="pl-4 pr-2 text-slate-400 dark:text-slate-500">
          <Sparkles className="w-5 h-5 text-indigo-400 dark:text-indigo-500" />
        </div>
        <input
          id="mobile-task-input" type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="¿Qué tenés en mente para hoy?"
          className="flex-1 py-4 bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
          disabled={isAdding}
        />
      </div>
      
      <div className="flex items-center justify-between px-4 pb-3 pt-1 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button type="button" onClick={cyclePriority} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${newTaskPriority === 'normal' ? 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800' : priorityColors[newTaskPriority]}`}>
            <Flag className="w-3.5 h-3.5" /><span className="capitalize">{newTaskPriority}</span>
          </button>
          
          <div className="relative flex items-center">
            <input type="date" min={todayStr} value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} onClick={(e) => { try { if ('showPicker' in HTMLInputElement.prototype) e.currentTarget.showPicker(); } catch {} }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${newTaskDate ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{newTaskDate ? (() => { const [year, month, day] = newTaskDate.split('-'); return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' }); })() : 'Fecha'}</span>
            </div>
            {newTaskDate && <button type="button" onClick={() => setNewTaskDate("")} className="absolute right-1 z-20 p-1 text-indigo-400 hover:text-indigo-600 dark:text-indigo-500 dark:hover:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/20 rounded-full"><X className="w-3 h-3" /></button>}
          </div>
        </div>

        <button type="submit" disabled={!newTaskTitle.trim() || isAdding} className="p-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white rounded-xl transition-colors active:scale-95 shadow-sm">
          {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>
    </motion.form>
  );
}
