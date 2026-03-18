import { Link, NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/adicionar-cliente', label: 'Adicionar cliente' }
];

export function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(229,182,123,0.28),_transparent_32%),radial-gradient(circle_at_80%_20%,_rgba(14,82,87,0.18),_transparent_24%),linear-gradient(180deg,_#f7efe4_0%,_#dfe8e2_52%,_#f2f5f0_100%)] px-4 py-6 text-slate sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1520px] flex-col overflow-hidden rounded-[36px] border border-white/70 bg-white/55 shadow-panel backdrop-blur-xl">
        <header className="border-b border-slate/10 px-6 py-6 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-clay">Yield 360</p>
              <Link to="/" className="mt-3 block font-display text-4xl tracking-tight text-slate sm:text-5xl">
                Yield 360
              </Link>
              <p className="mt-4 max-w-2xl text-sm text-slate/70 sm:text-base">
                Sistema de planeamento financeiro com diagnostico patrimonial, simulacao de aposentadoria, protecao familiar e dashboard executivo calculados no backend.
              </p>
            </div>
            <nav className="flex flex-wrap gap-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-slate text-white shadow-[0_12px_24px_rgba(23,38,50,0.18)]'
                        : 'bg-white/85 text-slate hover:bg-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}