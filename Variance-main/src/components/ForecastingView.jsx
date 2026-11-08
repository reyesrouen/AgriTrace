import { useMemo, useState } from 'react';
import { ArrowDownToLine, CloudRain, Fuel, LineChart as LineChartIcon, SlidersHorizontal } from 'lucide-react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { COMMODITIES_METADATA, HISTORICAL_SERIES } from '../data/commoditiesData';
import { WEATHER_STATIONS } from '../data/weatherFuelData';
import { estimateMultivariatePrice, computeConfidenceIntervals } from '../utils/forecaster';
import { calculateFVLCTS } from '../utils/ias41Valuation';
import { exportToCSV, exportToExcel, formatForecastForExport } from '../utils/exportUtils';

const money = (value) => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(value);

const fieldClass = 'rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100';

export default function ForecastingView({ selectedCommodityId, onSelectCommodity }) {
  const [commodityId, setCommodityId] = useState(selectedCommodityId || 'onions_red');
  const [modelType, setModelType] = useState('sarimax');
  const [horizon, setHorizon] = useState(4);
  const [valuationMode, setValuationMode] = useState('fvlcts');
  const [dieselPricePhp, setDieselPricePhp] = useState(65.5);
  const [weatherStationId, setWeatherStationId] = useState('clark');
  const [rainfallAnomalyMm, setRainfallAnomalyMm] = useState(0);
  const [typhoonSeverity, setTyphoonSeverity] = useState('NORMAL');
  const [rowFilter, setRowFilter] = useState('ALL');
  const [exportMessage, setExportMessage] = useState('');

  const commodity = COMMODITIES_METADATA.find((item) => item.id === commodityId) || COMMODITIES_METADATA[0];
  const rawSeries = HISTORICAL_SERIES[commodityId] || HISTORICAL_SERIES.onions_red;
  const station = WEATHER_STATIONS.find((item) => item.id === weatherStationId) || WEATHER_STATIONS[0];
  const forecast = useMemo(() => {
    const historicalPrices = rawSeries.map((point) => point.price);
    const result = estimateMultivariatePrice({
      series: rawSeries,
      commodityId,
      commodityName: commodity.name,
      horizon,
      modelType,
      dieselPricePhp,
      baseDieselPricePhp: 65.5,
      weatherStationId,
      typhoonSeverity,
      rainfallAnomalyMm
    });
    const projectedValues = valuationMode === 'fvlcts' ? result.fvlctsPoints : result.projectedPoints;
    const intervals = computeConfidenceIntervals(historicalPrices, projectedValues);
    const historicalRows = rawSeries.map((point) => ({
      period: point.period,
      date: point.date,
      isForecast: false,
      historical: Number((valuationMode === 'fvlcts'
        ? calculateFVLCTS(commodityId, point.price, 1).fvlctsPerKg
        : point.price).toFixed(2)),
      forecast: null,
      baseline: null,
      lower95: null,
      upper95: null,
      price: point.price,
      fvlctsPrice: calculateFVLCTS(commodityId, point.price, 1).fvlctsPerKg,
      dieselIndex: point.dieselLag7,
      rainfallMm: point.rainfallLag14
    }));
    const forecastRows = result.componentAttribution.map((point, index) => {
      const estimate = projectedValues[index];
      const baseline = valuationMode === 'fvlcts'
        ? calculateFVLCTS(commodityId, point.basePrice, 1).fvlctsPerKg
        : point.basePrice;
      return {
        period: `+${index + 1}w`,
        date: `Forecast W+${index + 1}`,
        isForecast: true,
        historical: null,
        forecast: estimate,
        baseline,
        lower95: intervals[index]?.lower95 ?? null,
        upper95: intervals[index]?.upper95 ?? null,
        forecastValuation: estimate,
        sarimaxValuation: valuationMode === 'fvlcts' ? point.fvlcts : point.finalMultivariate,
        prophetValuation: valuationMode === 'fvlcts'
          ? calculateFVLCTS(commodityId, point.finalMultivariate * 1.01, 1).fvlctsPerKg
          : point.finalMultivariate * 1.01,
        holtWintersValuation: valuationMode === 'fvlcts'
          ? calculateFVLCTS(commodityId, point.finalMultivariate * 0.99, 1).fvlctsPerKg
          : point.finalMultivariate * 0.99,
        baselineValuation: baseline,
        fuelDelta: point.fuelDeltaPhp,
        weatherDelta: point.weatherDeltaPhp,
        dieselIndex: dieselPricePhp,
        rainfallMm: rainfallAnomalyMm,
        typhoonIndex: typhoonSeverity === 'SEVERE' ? 2 : typhoonSeverity === 'WARNING' ? 1 : 0
      };
    });

    return {
      result,
      historicalRows,
      forecastRows,
      chartRows: [...historicalRows, ...forecastRows],
      latestPrice: historicalPrices.at(-1) ?? commodity.currentPrice,
      finalEstimate: projectedValues.at(-1) ?? commodity.fvlctsPerKg
    };
  }, [
    commodity,
    commodityId,
    dieselPricePhp,
    horizon,
    modelType,
    rainfallAnomalyMm,
    rawSeries,
    typhoonSeverity,
    valuationMode,
    weatherStationId
  ]);

  const filteredRows = useMemo(() => forecast.chartRows.filter((point) => (
    rowFilter === 'ALL' || (rowFilter === 'FORECAST' ? point.isForecast : !point.isForecast)
  )), [forecast.chartRows, rowFilter]);

  const exportRows = async (format) => {
    try {
      const data = formatForecastForExport(filteredRows, commodity, valuationMode);
      const date = new Date().toISOString().slice(0, 10);
      const filename = `AgriTrace_${commodity.id}_${horizon}w_${date}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      if (format === 'excel') await exportToExcel(data, 'Forecast', filename);
      else exportToCSV(data, filename);
      setExportMessage(`Exported ${data.length} ${data.length === 1 ? 'row' : 'rows'} to ${format === 'excel' ? 'Excel' : 'CSV'}.`);
    } catch (error) {
      setExportMessage(`Export failed: ${error instanceof Error ? error.message : 'Unexpected error.'}`);
    }
  };

  const currentNetPrice = calculateFVLCTS(commodityId, forecast.latestPrice, 1).fvlctsPerKg;
  const priceLabel = valuationMode === 'fvlcts' ? 'Forecast FVLCTS' : 'Forecast spot value';
  const chartData = forecast.chartRows.map((point) => ({
    ...point,
    lowerBand: point.lower95,
    bandRange: point.upper95 !== null && point.lower95 !== null ? point.upper95 - point.lower95 : null
  }));

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-800">Price intelligence</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Forecast studio</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Explore how historical prices, diesel costs and rainfall scenarios shape a modeled outlook.
            Forecasts are estimates, not accounting fair-value determinations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportRows('csv')} className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50">
            <ArrowDownToLine className="h-4 w-4" /> CSV
          </button>
          <button onClick={() => exportRows('excel')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-900">
            <ArrowDownToLine className="h-4 w-4" /> Excel
          </button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Latest market observation</p>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-950">{money(forecast.latestPrice)}<span className="ml-1 text-sm font-normal text-slate-500">/kg gross</span></p>
          <p className="mt-1 text-xs text-slate-500">Modeled net harvest value: {money(currentNetPrice)}/kg</p>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{priceLabel} · {horizon} weeks</p>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-emerald-900">{money(forecast.finalEstimate)}<span className="ml-1 text-sm font-normal text-slate-500">/kg</span></p>
          <p className="mt-1 text-xs text-slate-500">{valuationMode === 'fvlcts' ? 'After modeled estimated costs to sell' : 'Before estimated costs to sell'}</p>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Average exogenous effect</p>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-950">{money(forecast.result.driverSummary.totalExogenousShiftPhp)}<span className="ml-1 text-sm font-normal text-slate-500">/kg</span></p>
          <p className="mt-1 text-xs text-slate-500">Fuel {money(forecast.result.driverSummary.netFuelEffectPhp)} · Weather {money(forecast.result.driverSummary.netWeatherEffectPhp)}</p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">{commodity.name} · weekly price path</h2>
              <p className="mt-1 text-xs text-slate-500">Historical rows and projected values use the selected valuation view.</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="forecast-row-filter" className="text-xs text-slate-500">Export rows</label>
              <select id="forecast-row-filter" value={rowFilter} onChange={(event) => setRowFilter(event.target.value)} className={`${fieldClass} py-1.5`}>
                <option value="ALL">All data</option>
                <option value="HISTORY">History only</option>
                <option value="FORECAST">Forecast only</option>
              </select>
            </div>
          </div>
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid stroke="#eeeae2" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: '#78716c', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={18} />
                <YAxis tick={{ fill: '#78716c', fontSize: 11 }} tickLine={false} axisLine={false} width={56} tickFormatter={(value) => `₱${value}`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#e7e5e4', fontSize: 12 }}
                  formatter={(value, name) => [value == null ? '—' : money(value), name]}
                  labelFormatter={(label) => `${label} · ${commodity.name}`}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area dataKey="lowerBand" stackId="confidence" stroke="none" fill="transparent" legendType="none" tooltipType="none" />
                <Area dataKey="bandRange" stackId="confidence" stroke="none" fill="#bbf7d0" fillOpacity={0.55} name="95% modeled range" />
                <Line type="monotone" dataKey="historical" stroke="#64748b" strokeWidth={2} dot={false} connectNulls name={valuationMode === 'fvlcts' ? 'Historical net' : 'Historical spot'} />
                <Line type="monotone" dataKey="forecast" stroke="#047857" strokeWidth={2.5} strokeDasharray="5 4" dot={{ r: 3 }} connectNulls name="Forecast" />
                <Line type="monotone" dataKey="baseline" stroke="#d6a542" strokeWidth={1.5} strokeDasharray="3 4" dot={false} connectNulls name="Unadjusted baseline" />
                <ReferenceLine y={valuationMode === 'fvlcts' ? currentNetPrice : forecast.latestPrice} stroke="#cbd5e1" strokeDasharray="4 4" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {exportMessage && <p role="status" className="mt-3 text-xs text-emerald-800">{exportMessage}</p>}
        </article>

        <aside className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-emerald-800" />
            <h2 className="font-semibold text-slate-900">Scenario controls</h2>
          </div>
          <div className="mt-5 space-y-4">
            <label className="block space-y-1.5 text-xs font-medium text-slate-600">
              Commodity
              <select
                value={commodityId}
                onChange={(event) => {
                  setCommodityId(event.target.value);
                  onSelectCommodity?.(event.target.value);
                }}
                className={`${fieldClass} w-full`}
              >
                {COMMODITIES_METADATA.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5 text-xs font-medium text-slate-600">
              Forecast model
              <select value={modelType} onChange={(event) => setModelType(event.target.value)} className={`${fieldClass} w-full`}>
                <option value="sarimax">Trend + exogenous regression</option>
                <option value="prophet">Additive seasonal (Prophet-style)</option>
                <option value="holt_winters">Holt-Winters</option>
                <option value="naive">Naive baseline</option>
              </select>
            </label>
            <label className="block space-y-2 text-xs font-medium text-slate-600">
              Measurement display
              <select value={valuationMode} onChange={(event) => setValuationMode(event.target.value)} className={`${fieldClass} w-full`}>
                <option value="fvlcts">Net of estimated selling costs</option>
                <option value="gross">Gross market price</option>
              </select>
            </label>
            <label className="block space-y-2 text-xs font-medium text-slate-600">
              Horizon <span className="float-right font-semibold text-slate-800">{horizon} weeks</span>
              <input type="range" min="1" max="12" value={horizon} onChange={(event) => setHorizon(Number(event.target.value))} className="w-full accent-emerald-800" />
            </label>
            <details className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-slate-700">External assumptions</summary>
              <div className="mt-4 space-y-4">
                <label className="block space-y-2 text-xs text-slate-600">
                  <span className="flex items-center justify-between"><span className="inline-flex items-center gap-1"><Fuel className="h-3.5 w-3.5 text-amber-700" /> Diesel price</span><strong>{money(dieselPricePhp)}/L</strong></span>
                  <input type="range" min="50" max="85" step="0.5" value={dieselPricePhp} onChange={(event) => setDieselPricePhp(Number(event.target.value))} className="w-full accent-amber-700" />
                </label>
                <label className="block space-y-1.5 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1"><CloudRain className="h-3.5 w-3.5 text-sky-700" /> Weather station</span>
                  <select value={weatherStationId} onChange={(event) => setWeatherStationId(event.target.value)} className={`${fieldClass} w-full`}>
                    {WEATHER_STATIONS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
                <label className="block space-y-2 text-xs text-slate-600">
                  <span className="flex items-center justify-between">Rainfall anomaly <strong>{rainfallAnomalyMm} mm</strong></span>
                  <input type="range" min="-100" max="250" step="25" value={rainfallAnomalyMm} onChange={(event) => setRainfallAnomalyMm(Number(event.target.value))} className="w-full accent-sky-700" />
                </label>
                <label className="block space-y-1.5 text-xs text-slate-600">
                  Storm condition
                  <select value={typhoonSeverity} onChange={(event) => setTyphoonSeverity(event.target.value)} className={`${fieldClass} w-full`}>
                    <option value="NORMAL">Normal</option>
                    <option value="WARNING">Warning</option>
                    <option value="SEVERE">Severe</option>
                  </select>
                </label>
                <p className="text-[11px] leading-5 text-slate-500">
                  {station.name} · historical correlation r: fuel {forecast.result.correlationIndicators.correlationFuel.toFixed(2)}, rain {forecast.result.correlationIndicators.correlationRainfall.toFixed(2)}. Scenario effects use fitted historical slopes; inputs are illustrative.
                </p>
              </div>
            </details>
          </div>
        </aside>
      </section>

      <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
        <LineChartIcon className="mt-0.5 h-4 w-4 shrink-0" />
        Model results depend on the supplied history and scenario assumptions. A forecast FVLCTS series is an estimated decision-support output, not a substitute for a reporting-date IAS 41 fair-value assessment.
      </p>
    </div>
  );
}
