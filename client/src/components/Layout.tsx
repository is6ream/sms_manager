import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import ChatWidget from './ChatWidget';

interface NavSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: { to: string; label: string }[];
}

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const SupportIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const RoutesIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const ProvidersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ImportIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const NAV_SECTIONS: NavSection[] = [
  {
    id: 'routing',
    label: 'Маршрутизация',
    icon: <RoutesIcon />,
    children: [
      { to: '/routes', label: 'Маршруты' },
      { to: '/providers', label: 'Поставщики' },
    ],
  },
  {
    id: 'import',
    label: 'Импорт',
    icon: <ImportIcon />,
    children: [
      { to: '/import', label: 'Импорт Excel' },
    ],
  },
];

function NavSection({ section }: { section: NavSection }) {
  const location = useLocation();
  const isAnyChildActive = section.children.some((c) => location.pathname === c.to);
  const [open, setOpen] = useState(isAnyChildActive || section.children.length <= 2);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-sm transition-colors ${
          isAnyChildActive
            ? 'text-indigo-700 bg-indigo-50 font-medium'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <span className="flex items-center gap-2.5">
          <span className={isAnyChildActive ? 'text-indigo-600' : 'text-gray-400'}>
            {section.icon}
          </span>
          {section.label}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="mt-0.5 ml-4 pl-3 border-l border-gray-200 space-y-0.5">
          {section.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) =>
                `block px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'text-indigo-700 bg-indigo-50 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

const PAGE_TITLES: Record<string, string> = {
  '/routes': 'Маршруты',
  '/providers': 'Поставщики',
  '/import': 'Импорт Excel',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'SMS Prices';

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Top utility bar */}
      <header className="h-11 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10">
        <div className="w-48 shrink-0" />
        <div className="flex items-center gap-6 text-xs text-gray-500 ml-auto">
          <button className="flex items-center gap-1.5 hover:text-gray-800 transition-colors">
            <BellIcon />
            Уведомления
          </button>
          <button className="flex items-center gap-1.5 hover:text-gray-800 transition-colors">
            <SupportIcon />
            Поддержка
          </button>
          <span className="text-gray-300">|</span>
          <span className="text-gray-600 font-medium">admin@sms-prices.ru</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-48 bg-white border-r border-gray-200 flex flex-col shrink-0">
          {/* Logo */}
          <div className="h-12 flex items-center px-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900">SMS Prices</span>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 py-3 border-b border-gray-100">
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Поиск в меню"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors placeholder-gray-400"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
            {NAV_SECTIONS.map((section) => (
              <NavSection key={section.id} section={section} />
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Page title bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <h1 className="text-indigo-700 text-lg font-semibold">{pageTitle}</h1>
          </div>

          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      <ChatWidget />
    </div>
  );
}
