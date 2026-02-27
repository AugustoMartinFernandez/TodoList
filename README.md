# 🚀 TodoPro - Task Management SaaS

> Una aplicación de gestión de tareas de nivel profesional, diseñada con la filosofía de **"Fricción Cero"** y una experiencia **Mobile-First** impecable.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-47C28D?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-E902B5?style=for-the-badge&logo=framer)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript)

TodoPro no es "otra lista de tareas". Es un motor de productividad construido con los estándares más altos de desarrollo web moderno. Con interacciones a 60FPS, actualizaciones optimistas (Optimistic UI) y una interfaz nativa para celulares, TodoPro se siente como una aplicación descargada del App Store, pero directamente en tu navegador.

---

## ✨ Características Principales

- 📱 **Mobile-First UX:** Barra de navegación inferior (Bottom Bar), scroll con inercia (Momentum Scroll), áreas seguras para iOS y selectores de fecha nativos.
- ⚡ **Optimistic UI:** Sincronización instantánea. Las tareas se crean, tachan o eliminan en pantalla en milisegundos, sincronizándose con la base de datos en segundo plano sin bloqueos.
- 🎨 **Animaciones Fluidas:** Transiciones de estado elásticas, micro-interacciones de retroalimentación táctil y animaciones de layout impulsadas por **Framer Motion**.
- 🗂️ **Filtros Inteligentes:** Sistema de pestañas en formato "Píldora" de alto contraste para organizar tareas por "Hoy", "Próximas", "Urgentes" o "Todas".
- 🔒 **Seguridad Blindada:** Autenticación robusta y base de datos protegida a nivel de fila (**RLS - Row Level Security**) mediante Supabase. Nadie puede ver ni alterar las tareas de otros.
- 🌓 **Diseño "Floating Glass":** Interfaz minimalista con efectos de desenfoque (backdrop-blur), paleta de colores cuidada y tipografía premium.

---

## 🛠️ Stack Tecnológico

- **Frontend:** [Next.js](https://nextjs.org/) (App Router), React 18
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Animaciones:** [Framer Motion](https://www.framer.com/motion/)
- **Backend & Auth:** [Supabase](https://supabase.com/)
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Notificaciones:** [Sileo](https://github.com/sileo)

---

## 🚀 Instalación y Desarrollo Local

Si querés correr este proyecto en tu propia máquina, seguí estos pasos:

### 1. Clonar el repositorio
```bash
git clone [https://github.com/TuUsuario/TodoList.git](https://github.com/TuUsuario/TodoList.git)
cd TodoList
2. Instalar dependencias
Bash

npm install
# o yarn install / pnpm install

3. Configurar Variables de Entorno

Renombrá el archivo .env.example a .env.local (o creá uno nuevo) y agregá tus credenciales de Supabase:
Fragmento de código

NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase

4. Levantar el servidor de desarrollo
Bash

npm run dev

Abrí http://localhost:3000 en tu navegador para ver la aplicación.

🤝 Contribuciones

Las contribuciones, problemas (issues) y solicitudes de extracción (pull requests) son bienvenidas. Siéntete libre de revisar la página de issues si quieres aportar.
📝 Licencia

Este proyecto está bajo la Licencia MIT - mira el archivo LICENSE para más detalles.