import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Circle, CheckCircle2, Flag, CalendarDays, Timer, Pencil } from "lucide-react";
import { Database } from "@/src/types/database.types";
import { usePomodoro } from "@/src/context/PomodoroContext";
import EditTaskInline from "./EditTaskInline";

type Task = Database['public']['Tables']['tasks']['Row'];
type Priority = 'baja' | 'normal' | 'alta';

interface TaskItemProps {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task, newTitle: string, newPriority: Priority, newDate: string | null) => void;
}

export default function TaskItem({ task, onToggle, onDelete, onEdit }: TaskItemProps) {
  const { openPomodoro } = usePomodoro();
  const [isEditing, setIsEditing] = useState(false);

  const renderTaskTitle = (title: string) => {
    return title.split(' ').map((word, index) => {
      if (word.startsWith('#') && word.length > 1) {
        return (
          <span key={index} className="inline-block bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold mx-0.5 uppercase tracking-wider border border-indigo-100/50">
            {word}
          </span>
        );
      }
      return word + ' ';
    });
  };

  const handleSaveEdit = (newTitle: string, newPriority: Priority, newDate: string | null) => {
    onEdit(task, newTitle, newPriority, newDate);
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`group flex items-center justify-between p-3 sm:p-4 bg-white border border-slate-200 shadow-sm hover:shadow-md rounded-2xl transition-all ${
        task.is_completed ? 'bg-slate-50 border-slate-100 opacity-60' : ''
      }`}
    >
      {isEditing ? (
        <EditTaskInline 
          initialTitle={task.title} 
          initialPriority={task.priority as Priority || 'normal'}
          initialDate={task.due_date}
          onSave={handleSaveEdit} 
          onCancel={() => setIsEditing(false)} 
        />
      ) : (
        <>
          <div className="flex items-center gap-3 flex-1 overflow-hidden cursor-pointer touch-manipulation" onClick={() => onToggle(task)}>
            <button type="button" className={`flex-shrink-0 transition-colors ${task.is_completed ? 'text-green-500' : 'text-slate-300 hover:text-indigo-400'}`}>
              {task.is_completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
            </button>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className={`font-medium truncate transition-all ${task.is_completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                {renderTaskTitle(task.title)}
              </span>
              {(!task.is_completed && (task.priority !== 'normal' || task.due_date)) && (
                <div className="flex items-center gap-2 mt-1">
                  {task.priority !== 'normal' && (
                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${task.priority === 'alta' ? 'text-red-500' : 'text-blue-500'}`}>
                      <Flag className="w-3 h-3" /> {task.priority}
                    </span>
                  )}
                  {task.due_date && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                      <CalendarDays className="w-3 h-3" /> 
                      {new Date(task.due_date + 'T00:00:00').toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 ml-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
            {!task.is_completed && (
              <>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditing(true); }} 
                  className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative z-10"
                >
                  <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); openPomodoro(task); }} 
                  className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative z-10"
                >
                  <Timer className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </>
            )}
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(task); }}
              className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all relative z-10"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}