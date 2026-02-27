"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Zap, Smartphone, Cloud, ArrowRight, Circle } from "lucide-react";
import Link from "next/link";

export default function Home() {
  // Configuración de las animaciones para que los elementos aparezcan en cascada
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <main className="min-h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      
      {/* SECCIÓN HERO (El impacto principal) */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8"
          >
            <motion.div variants={itemVariants} className="inline-block">
              <span className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide">
                Lanzamiento 2026
              </span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900">
              Organizá tu vida <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">
                sin fricción
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              El gestor de tareas minimalista diseñado para que dejes de planear y empieces a hacer. Sincronización instantánea y diseño de primer nivel.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-medium transition-all active:scale-95 shadow-lg shadow-indigo-200">
                Comenzar gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#caracteristicas" className="w-full sm:w-auto flex items-center justify-center px-8 py-4 rounded-xl text-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                Ver características
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECCIÓN VISUAL (La maqueta de la app flotando) */}
      <section className="px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-200 p-6 md:p-8 relative z-10"
        >
          {/* Cabecera falsa estilo ventana de macOS */}
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
            </div>
            <div className="text-sm font-medium text-slate-400">Mis Tareas - Todo List Pro</div>
            <div className="w-12"></div> {/* Espaciador para centrar el título */}
          </div>

          {/* Lista de tareas falsa simulando la interfaz real */}
          <div className="space-y-3">
            {[
              { text: "Hacer las compras del supermercado para la semana", checked: true },
              { text: "Llamar al dentista para reprogramar el turno", checked: false },
              { text: "Pagar la tarjeta de crédito antes del viernes", checked: false },
            ].map((task, i) => (
              <div key={i} className={`group flex items-center gap-4 p-4 rounded-xl border transition-all ${task.checked ? 'bg-slate-50 border-transparent' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-200'}`}>
                {task.checked ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-300 group-hover:text-indigo-400 shrink-0 transition-colors" />
                )}
                <span className={`text-lg truncate ${task.checked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {task.text}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* SECCIÓN DE CARACTERÍSTICAS (Features grid) */}
      <section id="caracteristicas" className="bg-white py-24 px-4 border-t border-slate-200 relative z-0">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Por qué elegir nuestra app</h2>
            <p className="text-lg text-slate-500">Todo lo que necesitás para ser productivo, sin distracciones visuales.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Velocidad extrema", desc: "Arquitectura moderna que compila en milisegundos para que no pierdas el hilo." },
              { icon: Smartphone, title: "Mobile-First real", desc: "Se ve y se siente como una app nativa en tu celular, con áreas táctiles perfectas." },
              { icon: Cloud, title: "Nube sincronizada", desc: "Tus tareas guardadas y encriptadas al instante. Nunca más vas a perder una idea." },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.2 }}
                className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-md hover:border-indigo-100 transition-all"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}