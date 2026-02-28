import { motion } from "framer-motion";
import { Inbox, Sun, CalendarDays, Flame } from "lucide-react";

type FilterType = 'todas' | 'hoy' | 'proximas' | 'urgentes';

const filters = [
  { id: 'todas', label: 'Todas', icon: Inbox },
  { id: 'hoy', label: 'Hoy', icon: Sun },
  { id: 'proximas', label: 'Próximas', icon: CalendarDays },
  { id: 'urgentes', label: 'Urgentes', icon: Flame },
] as const;

interface FilterCarouselProps {
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
}

export default function FilterCarousel({ activeFilter, setActiveFilter }: FilterCarouselProps) {
  return (
    <div className="relative mb-6 mt-4">
      <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide overscroll-x-contain pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <motion.button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as FilterType)}
              whileTap={{ scale: 0.94 }}
              className={`shrink-0 relative flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 border ${
                isActive ? 'text-white border-transparent' : 'text-slate-500 bg-white border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {isActive && (
                <motion.div layoutId="activeFilterTab" className="absolute inset-0 bg-indigo-600 rounded-full shadow-md shadow-indigo-600/30 z-0" transition={{ type: "spring", stiffness: 450, damping: 30 }} />
              )}
              <filter.icon className={`w-4 h-4 relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 text-white' : 'text-slate-400'}`} />
              <span className="relative z-10 tracking-wide">{filter.label}</span>
            </motion.button>
          );
        })}
        <div className="w-1 shrink-0 md:hidden" />
      </div>
    </div>
  );
}