import { NavLink } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-slate-800 text-white'
        : 'text-slate-400 hover:text-white hover:bg-slate-700'
    }`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-8">
          <div>
            <span className="text-lg font-semibold text-white">SMS Prices</span>
            <span className="ml-2 text-xs text-slate-500 font-normal">агрегаторы</span>
          </div>
          <nav className="flex gap-1">
            <NavLink to="/providers" className={linkClass}>Поставщики</NavLink>
            <NavLink to="/routes" className={linkClass}>Маршруты</NavLink>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
