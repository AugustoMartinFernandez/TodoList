"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  CheckCircle2, 
  Settings, 
  LogOut, 
  User, 
  Bell,
  PlusCircle
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/utils/supabase/client";
import { type User as SupabaseUser } from "@supabase/supabase-js";
import { useNotification } from "@/src/context/NotificationContext";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { notify } = useNotification();
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Prioridad: 1. avatar_url (custom) -> 2. picture (Google) -> null
        const profilePic = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
        setAvatarUrl(profilePic);
      }
    };
    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      notify("Sesión cerrada correctamente", "success");
      router.push("/login");
    } catch {
      notify("Error al cerrar sesión", "error");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { name: "Tareas", href: "/dashboard", icon: LayoutDashboard },
    { name: "Completadas", href: "/dashboard/completed", icon: CheckCircle2 },
    { name: "Ajustes", href: "/dashboard/settings", icon: Settings },
    { name: "Perfil", href: "/dashboard/profile", icon: User },
  ];

  const midPoint = Math.ceil(navItems.length / 2);

  return (
    <>
      {/* --- DESKTOP NAVBAR (TOP) --- */}
      <nav className="hidden md:flex fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100 items-center justify-between px-8 h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">TodoPro</span>
        </div>

        <div className="flex items-center gap-8">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`relative text-sm font-medium transition-colors ${
                pathname === item.href ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {item.name}
              {pathname === item.href && (
                <motion.div 
                  layoutId="activeTabDesktop"
                  className="absolute -bottom-5.25 left-0 right-0 h-0.5 bg-indigo-600"
                />
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-1 pr-3 bg-slate-50 border border-slate-100 rounded-full hover:bg-slate-100 transition-all"
            >
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 overflow-hidden border border-white">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {user?.user_metadata?.full_name?.split(" ")[0] || "Usuario"}
              </span>
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-20"
                  >
                    <Link 
                      href="/dashboard/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <User className="w-4 h-4" /> Mi Perfil
                    </Link>
                    <div className="h-px bg-slate-100 my-1 mx-2" />
                    <button 
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> 
                      {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* --- MOBILE NAVBAR (BOTTOM) --- */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
        <div className="bg-white/80 backdrop-blur-2xl border border-white/20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] rounded-3xl h-16 flex items-center justify-between px-2 relative">
          {navItems.slice(0, midPoint).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className="relative flex-1 flex flex-col items-center justify-center h-full"
              >
                <motion.div
                  whileTap={{ scale: 0.8 }}
                  className={`z-10 transition-colors duration-300 ${isActive ? "text-indigo-600" : "text-slate-400"}`}
                >
                  <item.icon className="w-6 h-6" />
                </motion.div>
                {isActive && (
                  <motion.div 
                    layoutId="activeTabMobileIndicator"
                    className="absolute inset-x-2 inset-y-2 bg-indigo-50 rounded-2xl z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className={`text-[10px] font-bold mt-0.5 z-10 ${isActive ? "text-indigo-600" : "text-slate-400"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
          
          <div className="w-16" />

          {navItems.slice(midPoint).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className="relative flex-1 flex flex-col items-center justify-center h-full"
              >
                <motion.div
                  whileTap={{ scale: 0.8 }}
                  className={`z-10 transition-colors duration-300 ${isActive ? "text-indigo-600" : "text-slate-400"}`}
                >
                  <item.icon className="w-6 h-6" />
                </motion.div>
                {isActive && (
                  <motion.div 
                    layoutId="activeTabMobileIndicator"
                    className="absolute inset-x-2 inset-y-2 bg-indigo-50 rounded-2xl z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className={`text-[10px] font-bold mt-0.5 z-10 ${isActive ? "text-indigo-600" : "text-slate-400"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
          
          {/* Botón Central de Acción */}
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => document.getElementById('mobile-task-input')?.focus(), 300); }}
            className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white p-4 rounded-2xl shadow-xl shadow-indigo-200 border-4 border-slate-50"
          >
            <PlusCircle className="w-6 h-6" />
          </motion.button>
        </div>
      </nav>
    </>
  );
}