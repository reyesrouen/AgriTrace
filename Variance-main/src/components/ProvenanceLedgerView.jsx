import { useMemo, useState } from 'react';
import { ArrowDownToLine, Search, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { exportToCSV, exportToExcel, formatBatchesForExport } from '../utils/exportUtils';
import { measureBatchCarryingValue } from '../utils/ias41Valuation';

const fieldClass = 'rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100';

const classificationName = (classification) => ({
  BIOLOGICAL_ASSET: 'Growing asset · IAS 41',
  AGRICULTURAL_PRODUCE: 'At harvest · IAS 41',
  INVENTORY_IAS2: 'Inventory · IAS 2'
}[classification] || classification);

const currency = (amount) => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0
}).format(amount);

export default function ProvenanceLedgerView({ batches, onTamperToggle, circuitBreakerStatus, tamperedInfo }) {
  const [query, setQuery] = useState('');
  const [classification, setClassification] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [exportMessage, setExportMessage] = useState('');

  const filteredBatches = useMemo(() => batches.filter((batch) => {
    const searchText = `${batch.id} ${batch.commodity} ${batch.origin} ${batch.destination}`.toLowerCase();
    return (!query || searchText.includes(query.toLowerCase()))
      && (classification === 'ALL' || classification === batch.ias41Classification)
      && (status === 'ALL' || status === batch.status.toUpperCase());
  }), [batches, classification, query, status]);
  const selectedBatch = batches.find((batch) => batch.id === selectedBatchId) || null;
  const selectedMeasurement = selectedBatch ? measureBatchCarryingValue(selectedBatch) : null;

  const exportFilteredRows = async (format) => {
    try {
      const rows = formatBatchesForExport(filteredBatches);
      const filename = `AgriTrace_ledger_${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      if (format === 'excel') await exportToExcel(rows, 'Batch ledger', filename);
      else exportToCSV(rows, filename);
      setExportMessage(`Exported ${rows.length} ${rows.length === 1 ? 'batch' : 'batches'}.`);
    } catch (error) {
      setExportMessage(`Export failed: ${error instanceof Error ? error.message : 'Unexpected error.'}`);
    }
  };

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-800">Supply chain records</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Provenance ledger</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Browse verified lots, accounting stage and current carrying-value estimates. Select a record for custody history and cryptographic evidence.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportFilteredRows('csv')} className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50">
            <ArrowDownToLine className="h-4 w-4" /> CSV
          </button>
          <button onClick={() => exportFilteredRows('excel')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-900">
            <ArrowDownToLine className="h-4 w-4" /> Excel
          </button>
        </div>
      </header>

      {circuitBreakerStatus === 'HALTED' && (
        <section className="flex flex-col justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
            <div>
              <p className="text-sm font-semibold text-rose-900">Integrity check halted an update</p>
              <p className="mt-1 text-xs text-rose-800">Open the affected batch to inspect its verification details. Forecast accuracy is not implied by integrity status.</p>
            </div>
          </div>
          {tamperedInfo && (
            <button onClick={() => setSelectedBatchId(tamperedInfo.batchId)} className="shrink-0 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-medium text-rose-900 hover:bg-rose-100">
              Inspect affected batch
            </button>
          )}
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ['Growing assets', 'BIOLOGICAL_ASSET'],
          ['Produce at harvest', 'AGRICULTURAL_PRODUCE'],
          ['IAS 2 inventory', 'INVENTORY_IAS2']
        ].map(([label, code]) => (
          <article key={code} className="rounded-xl border border-stone-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{batches.filter((batch) => batch.ias41Classification === code).length}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search batch, commodity or route" className={`${fieldClass} w-full pl-9`} />
          </label>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Filter by accounting stage" value={classification} onChange={(event) => setClassification(event.target.value)} className={fieldClass}>
              <option value="ALL">All accounting stages</option>
              <option value="BIOLOGICAL_ASSET">Growing assets · IAS 41</option>
              <option value="AGRICULTURAL_PRODUCE">At harvest · IAS 41</option>
              <option value="INVENTORY_IAS2">Inventory · IAS 2</option>
            </select>
            <select aria-label="Filter by batch status" value={status} onChange={(event) => setStatus(event.target.value)} className={fieldClass}>
              <option value="ALL">All statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="IN_TRANSIT">In transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FLAGGED">Flagged</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-stone-50 text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Batch</th>
                <th className="px-5 py-3">Accounting stage</th>
                <th className="px-5 py-3">Carrying measure</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredBatches.map((batch) => {
                const measurement = measureBatchCarryingValue(batch);
                const isHalted = batch.tampered;
                return (
                  <tr key={batch.id} className="align-top hover:bg-stone-50/70">
                    <td className="px-5 py-4">
                      <button onClick={() => setSelectedBatchId(batch.id)} className="text-left">
                        <span className="block font-medium text-slate-900">{batch.commodity}</span>
                        <span className="mt-1 block font-mono text-[11px] text-slate-500">{batch.id}</span>
                        <span className="mt-1 block text-xs text-slate-500">{batch.quantityKg.toLocaleString()} kg</span>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <span className="block text-slate-800">{classificationName(batch.ias41Classification)}</span>
                      <span className="mt-1 block max-w-xs text-xs text-slate-500">{measurement.measurementBasis}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="block font-medium tabular-nums text-slate-900">{currency(measurement.totalCarryingValuePhp)}</span>
                      <span className="mt-1 block text-xs tabular-nums text-slate-500">{currency(measurement.carryingValuePerKg)} / kg</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        isHalted || batch.status === 'flagged'
                          ? 'bg-rose-50 text-rose-800'
                          : 'bg-emerald-50 text-emerald-900'
                      }`}>
                        {isHalted || batch.status === 'flagged' ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        {isHalted ? 'Tampered' : batch.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelectedBatchId(batch.id)} className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-white">
                          Details
                        </button>
                        <button onClick={() => onTamperToggle(batch.id)} className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${isHalted ? 'bg-rose-100 text-rose-900 hover:bg-rose-200' : 'bg-stone-100 text-slate-700 hover:bg-stone-200'}`}>
                          {isHalted ? 'Restore' : 'Test'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredBatches.length === 0 && (
                <tr><td colSpan="5" className="px-5 py-12 text-center text-sm text-slate-500">No batches match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col justify-between gap-2 border-t border-stone-100 px-5 py-3 text-xs text-slate-500 sm:flex-row">
          <span>{filteredBatches.length} of {batches.length} batches</span>
          {exportMessage && <span role="status" className="text-emerald-800">{exportMessage}</span>}
        </div>
      </section>

      {selectedBatch && selectedMeasurement && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm" onClick={() => setSelectedBatchId(null)}>
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedBatch.commodity} batch details`}
            className="h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">{classificationName(selectedBatch.ias41Classification)}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedBatch.commodity}</h2>
                <p className="mt-1 font-mono text-xs text-slate-500">{selectedBatch.id}</p>
              </div>
              <button onClick={() => setSelectedBatchId(null)} className="rounded-lg border border-stone-200 p-2 text-slate-500 hover:bg-stone-50" aria-label="Close batch details">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-stone-50 p-4">
                <p className="text-xs text-slate-500">{selectedMeasurement.measurementBasis}</p>
                <p className="mt-2 text-lg font-semibold tabular-nums text-slate-900">{currency(selectedMeasurement.totalCarryingValuePhp)}</p>
              </div>
              <div className="rounded-xl bg-stone-50 p-4">
                <p className="text-xs text-slate-500">Quantity</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{selectedBatch.quantityKg.toLocaleString()} kg</p>
              </div>
              {selectedMeasurement.deemedCostPerKg !== null && (
                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs text-slate-500">Harvest-date deemed cost</p>
                  <p className="mt-2 font-semibold text-slate-900">{currency(selectedMeasurement.deemedCostPerKg)} / kg</p>
                </div>
              )}
              {selectedMeasurement.estimatedNRVPerKg !== null && (
                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs text-slate-500">Estimated NRV</p>
                  <p className="mt-2 font-semibold text-slate-900">{currency(selectedMeasurement.estimatedNRVPerKg)} / kg</p>
                </div>
              )}
            </div>
            {selectedBatch.tampered && (
              <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-900">
                The changed payload is blocked. Values above use the last verified price and exclude the simulated mutation.
              </p>
            )}

            <dl className="mt-6 space-y-3 border-t border-stone-200 pt-5 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Status</dt><dd className="text-right font-medium capitalize text-slate-900">{selectedBatch.status.replace('_', ' ')}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Origin</dt><dd className="max-w-[65%] text-right text-slate-900">{selectedBatch.origin}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Destination</dt><dd className="max-w-[65%] text-right text-slate-900">{selectedBatch.destination}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Harvest date</dt><dd className="text-right text-slate-900">{selectedBatch.harvestTimestamp}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Cold-chain compliance</dt><dd className="text-right text-slate-900">{selectedBatch.coldChainCompliance}%</dd></div>
            </dl>

            <div className="mt-6 border-t border-stone-200 pt-5">
              <h3 className="text-sm font-semibold text-slate-900">Custody history</h3>
              <ol className="mt-4 space-y-4 border-l border-stone-200 pl-4">
                {selectedBatch.stages.map((stage) => (
                  <li key={stage.stageNumber} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-700 ring-1 ring-emerald-700" />
                    <p className="text-sm font-medium text-slate-900">{stage.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{stage.location} · {stage.timestamp}</p>
                  </li>
                ))}
              </ol>
            </div>

            <details className="mt-6 rounded-xl border border-stone-200 p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-800">Verification evidence</summary>
              <div className="mt-4 space-y-3 break-all font-mono text-[11px] text-slate-600">
                <p><span className="font-sans text-slate-500">Manifest SHA-256</span><br />{selectedBatch.manifestHash}</p>
                <p><span className="font-sans text-slate-500">ECDSA signature</span><br />{selectedBatch.signatureEcdsa}</p>
                <p><span className="font-sans text-slate-500">Public key</span><br />{selectedBatch.publicKey}</p>
                {selectedBatch.tampered && tamperedInfo?.batchId === selectedBatch.id && (
                  <>
                    <p><span className="font-sans text-slate-500">Expected hash</span><br />{tamperedInfo.expectedHash}</p>
                    <p className="text-rose-800"><span className="font-sans">Computed hash</span><br />{tamperedInfo.computedHash}</p>
                    <p className="font-sans text-rose-800">{tamperedInfo.error}</p>
                  </>
                )}
              </div>
            </details>

            <button onClick={() => onTamperToggle(selectedBatch.id)} className={`mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-medium ${selectedBatch.tampered ? 'bg-rose-700 text-white hover:bg-rose-800' : 'border border-stone-300 text-slate-700 hover:bg-stone-50'}`}>
              {selectedBatch.tampered ? 'Restore authentic record' : 'Run tamper simulation'}
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
