import Sidebar from './Sidebar';

export default function MainLayout({ activeTab, onTabChange, children }) {
  return (
    <div className="flex min-h-screen bg-cream-50">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-cream-200 bg-white/80 px-8 py-5 backdrop-blur">
          <p className="text-sm text-slate-500">Selamat datang</p>
          <h2 className="text-xl font-semibold text-slate-brand">
            Dashboard Pemantauan Sopir & Kendaraan
          </h2>
        </header>
        <div className="flex-1 overflow-auto p-8">{children}</div>
      </main>
    </div>
  );
}
