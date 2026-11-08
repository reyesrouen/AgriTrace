import { ArrowDownRight, ArrowUpRight, ArrowUpRightFromCircle, Layers3, Leaf, ShieldCheck, Wheat } from 'lucide-react';
import { COMMODITIES_METADATA } from '../data/commoditiesData';
import { measureBatchCarryingValue } from '../utils/ias41Valuation';

const money = (value) => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0
}).format(value);

function MetricCard({ label, value, note, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{label}</span>
        <Icon className="h-4 w-4 text-emerald-700" />
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </article>
  );
}

export default function DashboardView({ onSelectCommodity, batches, circuitBreakerStatus, onNavigate }) {
  const measurements = batches.map((batch) => ({
    batch,
    measurement: measureBatchCarryingValue(batch)
  }));
  const bioValue = measurements
    .filter(({ batch }) => batch.ias41Classification === 'BIOLOGICAL_ASSET')
    .reduce((sum, { measurement }) => sum + measurement.totalCarryingValuePhp, 0);
  const harvestValue = measurements
    .filter(({ batch }) => batch.ias41Classification === 'AGRICULTURAL_PRODUCE')
    .reduce((sum, { measurement }) => sum + measurement.totalCarryingValuePhp, 0);
  const inventoryValue = measurements
    .filter(({ batch }) => batch.ias41Classification === 'INVENTORY_IAS2')
    .reduce((sum, { measurement }) => sum + measurement.totalCarryingValuePhp, 0);
  const monitoredCommodities = COMMODITIES_METADATA.slice(0, 4);

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-800">Market & asset overview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            A clearer view of the harvest.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Track fair-value estimates, market signals and verified movement across Central Luzon.
            Forecasts are decision support, not a guarantee of future prices.
          </p>
        </div>
        <button
          onClick={() => onNavigate('forecasting')}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-900"
        >
          Open forecast studio <ArrowUpRightFromCircle className="h-4 w-4" />
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Portfolio summary">
        <MetricCard label="Growing biological assets" value={money(bioValue)} note="IAS 41 · fair value less costs to sell" icon={Leaf} />
        <MetricCard label="Produce at harvest" value={money(harvestValue)} note="IAS 41 harvest measurement · IAS 2 deemed cost" icon={Wheat} />
        <MetricCard label="Post-harvest inventory" value={money(inventoryValue)} note="IAS 2 · lower of deemed cost and estimated NRV" icon={Layers3} />
        <MetricCard
          label="Traceability status"
          value={circuitBreakerStatus === 'HALTED' ? 'Review required' : 'Verified'}
          note={`${batches.length} batches · integrity is separate from forecast accuracy`}
          icon={ShieldCheck}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">Market watch</h2>
              <p className="mt-1 text-xs text-slate-500">Latest market quotes and modeled harvest-date FVLCTS</p>
            </div>
            <button onClick={() => onNavigate('forecasting')} className="text-sm font-medium text-emerald-800 hover:text-emerald-950">
              View forecasts
            </button>
          </div>
          <div className="divide-y divide-stone-100">
            {monitoredCommodities.map((commodity) => {
              const isUp = commodity.priceChange7d >= 0;
              return (
                <button
                  key={commodity.id}
                  onClick={() => {
                    onSelectCommodity(commodity.id);
                    onNavigate('forecasting');
                  }}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 text-left transition hover:bg-stone-50 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">{commodity.name}</span>
                    <span className="mt-1 block truncate text-xs text-slate-500">{commodity.regions[0]}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-semibold tabular-nums text-slate-900">{money(commodity.currentPrice)}</span>
                    <span className="mt-1 block text-xs text-slate-500">gross · FVLCTS ₱{commodity.fvlctsPerKg.toFixed(2)}/kg</span>
                  </span>
                  <span className={`hidden min-w-20 items-center justify-end gap-1 text-sm font-medium sm:flex ${isUp ? 'text-emerald-800' : 'text-rose-700'}`}>
                    {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {isUp ? '+' : ''}{commodity.priceChange7d}%
                  </span>
                  <span className="col-span-2 flex items-center justify-between text-xs sm:hidden">
                    <span className="text-slate-500">7-day change</span>
                    <span className={isUp ? 'text-emerald-800' : 'text-rose-700'}>{isUp ? '+' : ''}{commodity.priceChange7d}%</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`h-5 w-5 ${circuitBreakerStatus === 'HALTED' ? 'text-rose-700' : 'text-emerald-800'}`} />
            <h2 className="font-semibold text-slate-900">Integrity monitor</h2>
          </div>
          <p className={`mt-4 text-lg font-semibold ${circuitBreakerStatus === 'HALTED' ? 'text-rose-800' : 'text-emerald-900'}`}>
            {circuitBreakerStatus === 'HALTED' ? 'Update halted' : 'No active integrity alerts'}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Signature and payload checks flag unauthorized changes. They confirm data integrity, not the economic validity of a price or forecast.
          </p>
          <button onClick={() => onNavigate('provenance')} className="mt-5 text-sm font-medium text-emerald-800 hover:text-emerald-950">
            Review batch records <span aria-hidden="true">→</span>
          </button>
        </aside>
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Estimates use modeled market quotes and selling-cost assumptions. IAS 2 inventory is presented at the lower of harvest-date deemed cost and estimated net realizable value; validate inputs and accounting judgments before reporting.
      </p>
    </div>
  );
}
