import { useState, useRef, useEffect } from "react";
import { Check, X, Flag, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

type Priority = 'baja' | 'normal' | 'alta';

interface EditTaskInlineProps {
  initialTitle: string;
  initialPriority: Priority;
  initialDate: string | null;
  onSave: (newTitle: string, newPriority: Priority, newDate: string | null) => void;
  onCancel: () => void;
}

export default function EditTaskInline({ initialTitle, initialPriority, initialDate, onSave, onCancel }: EditTaskInlineProps) {
  const [title, setTitle] = useState(initialTitle);
  const [priority, setPriority] = useState<Priority>(initialPriority);
  const [date, setDate] = useState(initialDate || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const cyclePriority = () => {
    const order: Priority[] = ['normal', 'alta', 'baja'];
    setPriority(order[(order.indexOf(priority) + 1) % order.length]);
  };

  const priorityColors = {
    normal: "text-slate-400 bg-slate-100",
    alta: "text-red-500 bg-red-50 border-red-200",
    baja: "text-blue-500 bg-blue-50 border-blue-200"
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle !== "") {
      onSave(trimmedTitle, priority, date === "" ? null : date);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onCancel();
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col gap-3 w-full py-1"
    >
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-indigo-50/50 border border-indigo-200 text-slate-800 text-sm font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
        placeholder="Nuevo título de la tarea..."
      />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={cyclePriority} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${priority === 'normal' ? 'border-transparent text-slate-500 hover:bg-slate-100' : priorityColors[priority]}`}
          >
            <Flag className="w-3.5 h-3.5" /><span className="capitalize">{priority}</span>
          </button>
          
          <div className="relative flex items-center">
            <input 
              type="date" 
              min={todayStr}
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              onClick={(e) => { try { if ('showPicker' in HTMLInputElement.prototype) e.currentTarget.showPicker(); } catch (err) {} }} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border ${date ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}>
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{date ? (() => { const [y, m, d] = date.split('-'); return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' }); })() : 'Fecha'}</span>
            </div>
            {date && (
              <button type="button" onClick={() => setDate("")} className="absolute right-1 z-20 p-0.5 text-indigo-400 hover:text-indigo-600 bg-indigo-50 rounded-full">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={onCancel} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-all active:scale-95" aria-label="Cancelar">
            <X className="w-4 h-4" />
          </button>
          <button type="button" onClick={handleSave} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all shadow-sm active:scale-95" aria-label="Guardar">
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}