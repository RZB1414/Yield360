import { Link, NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/adicionar-cliente', label: 'Adicionar cliente' }
];

export function AppShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(229,182,123,0.28),_transparent_32%),radial-gradient(circle_at_80%_20%,_rgba(14,82,87,0.18),_transparent_24%),linear-gradient(180deg,_#f7efe4_0%,_#dfe8e2_52%,_#f2f5f0_100%)] text-slate">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.78),_transparent_58%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1520px] px-4 py-6 sm:px-6 lg:px-10">
        <header className="mb-8 px-1">
          <div className="border-b border-[#173d5d]/10 pb-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-clay">Yield 360</p>
                <Link to="/" className="mt-2 block font-display text-[2.15rem] leading-none tracking-tight text-slate sm:text-[2.75rem]">
                  Yield 360
                </Link>
                <p className="mt-3 text-sm font-medium uppercase tracking-[0.18em] text-slate/58">
                  Clients Management
                </p>
              </div>

              <nav className="flex flex-wrap gap-2.5">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-slate text-white shadow-[0_12px_24px_rgba(23,38,50,0.18)]'
                          : 'border border-white/60 bg-white/55 text-slate hover:bg-white/80'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </header>
        <main className="pb-8">{children}</main>
      </div>
    </div>
  );
}