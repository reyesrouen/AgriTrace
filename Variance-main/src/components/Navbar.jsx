import { BarChart3, LineChart, ShieldAlert, ShieldCheck, Sprout, Truck } from 'lucide-react';

const navigation = [
  { id: 'dashboard', label: 'Overview', icon: BarChart3 },
  { id: 'forecasting', label: 'Forecasts', icon: LineChart },
  { id: 'provenance', label: 'Provenance', icon: Truck }
];

export default function Navbar({ activeTab, setActiveTab, circuitBreakerStatus }) {
  const isHalted = circuitBreakerStatus === 'HALTED';
  const StatusIcon = isHalted ? ShieldAlert : ShieldCheck;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-2.5 text-left">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-800 text-white">
            <Sprout className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight text-slate-950">AgriTrace</span>
            <span className="hidden text-[11px] text-slate-500 sm:block">Markets · valuation · provenance</span>
          </span>
        </button>

        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  active ? 'bg-emerald-50 font-medium text-emerald-900' : 'text-slate-600 hover:bg-stone-100 hover:text-slate-950'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => setActiveTab('audit')}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
            isHalted ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}
          title="Open integrity audit details"
        >
          <StatusIcon className="h-3.5 w-3.5" />
          <span className="hidden md:inline">{isHalted ? 'Halted' : 'Integrity OK'}</span>
        </button>
      </div>
    </header>
  );
}
