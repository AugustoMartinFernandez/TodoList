import Navbar from "@/src/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      {/* Padding superior para desktop y inferior para mobile */}
      <main className="pt-20 pb-28 md:pt-24 md:pb-10 px-4 max-w-5xl mx-auto">
        {children}
      </main>
    </div>
  );
}