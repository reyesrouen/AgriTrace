import React, { lazy, Suspense, useState } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import ProvenanceLedgerView from './components/ProvenanceLedgerView';
import { INITIAL_BATCHES } from './data/provenanceBatches';
import { verifyBatchIntegrity } from './utils/cryptoSimulator';
import { AlertTriangle, ArrowLeft, Database, GitCommit, ShieldCheck, X } from 'lucide-react';

const ForecastingView = lazy(() => import('./components/ForecastingView'));
const AuditLogView = lazy(() => import('./components/AuditLogView'));

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCommodityId, setSelectedCommodityId] = useState('onions_red');
  const [batches, setBatches] = useState(INITIAL_BATCHES);
  const [circuitBreakerStatus, setCircuitBreakerStatus] = useState('OPERATIONAL'); // 'OPERATIONAL' | 'HALTED' | 'WARNING'
  const [tamperedInfo, setTamperedInfo] = useState(null);
  const [showAudit, setShowAudit] = useState(false);

  // Normalized Navigation Handler with Tab Aliasing & Commodity Selection
  const handleNavigate = (tabName, commodityId = null) => {
    if (!tabName) {
      setActiveTab('dashboard');
      return;
    }

    const normalized = String(tabName).trim().toLowerCase();
    
    // Map common aliases to canonical tab keys
    const TAB_ALIAS_MAP = {
      'dashboard': 'dashboard',
      'home': 'dashboard',
      'executive': 'dashboard',
      'forecasting': 'forecasting',
      'forecast': 'forecasting',
      'studio': 'forecasting',
      'models': 'forecasting',
      'provenance': 'provenance',
      'ledger': 'provenance',
      'batches': 'provenance',
      'supply-chain': 'provenance',
      'audit': 'audit',
      'logs': 'audit',
      'verify': 'audit',
      'cryptography': 'audit'
    };

    const targetTab = TAB_ALIAS_MAP[normalized] || 'dashboard';

    if (targetTab === 'audit') {
      setShowAudit(true);
      return;
    }
    setShowAudit(false);

    if (commodityId) {
      setSelectedCommodityId(commodityId);
    }

    setActiveTab(targetTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle Tamper State for a Batch (Directly simulates demo_security_halt.R)
  const handleTamperToggle = (batchId) => {
    const targetBatch = batches.find((batch) => batch.id === batchId);
    if (!targetBatch) return;

    const tamperedPrice = targetBatch.commodity.toLowerCase().includes('onion') ? 999.0 : 350.0;
    const tamperedPayload = {
      id: targetBatch.id,
      commodity: targetBatch.commodity,
      price_php_kg: tamperedPrice,
      quantity_kg: targetBatch.quantityKg
    };
    const gateResult = targetBatch.tampered
      ? null
      : verifyBatchIntegrity(
          tamperedPayload,
          targetBatch.manifestHash,
          targetBatch.signatureEcdsa,
          targetBatch.publicKey
        );
    const newTamperAudit = gateResult
      ? {
          batchId: targetBatch.id,
          expectedHash: targetBatch.manifestHash,
          computedHash: gateResult.computedHash,
          error: gateResult.error
        }
      : null;

    const updatedBatches = batches.map((batch) => {
      if (batch.id !== batchId) return batch;

      if (!batch.tampered) {
        return {
          ...batch,
          tampered: true,
          status: 'flagged',
          unitPricePhp: tamperedPrice,
          currentTemperatureC: 8.5,
          tamperedField: 'unitPricePhp',
          originalValue: `PHP ${batch.unitPricePhp}/kg`,
          tamperedValue: `PHP ${tamperedPrice}/kg (TAMPERED)`,
          authenticUnitPricePhp: batch.unitPricePhp,
          authenticCurrentTemperatureC: batch.currentTemperatureC,
          authenticStatus: batch.status,
          tamperAudit: newTamperAudit
        };
      }

      const {
        authenticUnitPricePhp,
        authenticCurrentTemperatureC,
        authenticStatus,
        ...restoredBatch
      } = batch;
      return {
        ...restoredBatch,
        tampered: false,
        status: authenticStatus,
        unitPricePhp: authenticUnitPricePhp,
        currentTemperatureC: authenticCurrentTemperatureC,
        tamperedField: null,
        originalValue: null,
        tamperedValue: null,
        tamperAudit: null
      };
    });

    const remainingTamperedBatch = updatedBatches.find((batch) => batch.tampered);
    const updatedTamperedInfo = remainingTamperedBatch?.tamperAudit ?? null;

    setBatches(updatedBatches);
    setCircuitBreakerStatus(remainingTamperedBatch ? 'HALTED' : 'OPERATIONAL');
    setTamperedInfo(updatedTamperedInfo);
  };

  // Fallback Guard: Render Current View with Safety Checks
  const renderCurrentView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onSelectCommodity={(id) => setSelectedCommodityId(id)}
            batches={batches}
            circuitBreakerStatus={circuitBreakerStatus}
            onNavigate={handleNavigate}
          />
        );

      case 'forecasting':
        return (
          <ForecastingView
            selectedCommodityId={selectedCommodityId}
            onSelectCommodity={(id) => setSelectedCommodityId(id)}
          />
        );

      case 'provenance':
        return (
          <ProvenanceLedgerView
            batches={batches}
            onTamperToggle={handleTamperToggle}
            circuitBreakerStatus={circuitBreakerStatus}
            tamperedInfo={tamperedInfo}
          />
        );

      case 'audit':
        return (
          <AuditLogView 
            circuitBreakerStatus={circuitBreakerStatus} 
            onNavigate={handleNavigate}
            setActiveTab={handleNavigate}
          />
        );

      default:
        // Graceful Fallback: Never render a blank screen
        return (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-sm">Unknown Route Detected: "{activeTab}"</div>
                  <div className="text-xs text-amber-400/80">Defaulting to Executive Dashboard to prevent blank screen.</div>
                </div>
              </div>
              <button
                onClick={() => handleNavigate('dashboard')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Dashboard</span>
              </button>
            </div>
            <DashboardView
              onSelectCommodity={(id) => setSelectedCommodityId(id)}
              batches={batches}
              circuitBreakerStatus={circuitBreakerStatus}
              onNavigate={handleNavigate}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      {/* Top Sticky Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        circuitBreakerStatus={circuitBreakerStatus}
      />

      {/* Main Container with Safe View Render */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Suspense fallback={<div className="rounded-2xl border border-stone-200 bg-white p-8 text-sm text-slate-500">Loading view…</div>}>
          {renderCurrentView()}
        </Suspense>
      </main>

      <footer className="border-t border-stone-200 bg-white py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => handleNavigate('dashboard')}
              className="flex items-center gap-2 hover:text-slate-800 transition text-left cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="font-semibold text-slate-700">AgriTrace</span>
              <span>•</span>
              <span>Agricultural markets · Central Luzon</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => handleNavigate('audit')} className="inline-flex items-center gap-1.5 hover:text-emerald-800">
              <Database className="h-3.5 w-3.5" /> Data integrity
            </button>
            <button onClick={() => handleNavigate('provenance')} className="inline-flex items-center gap-1.5 hover:text-emerald-800">
              <GitCommit className="h-3.5 w-3.5" /> Traceability
            </button>
          </div>
        </div>
      </footer>

      {showAudit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6">
          <section role="dialog" aria-modal="true" aria-label="Cryptographic audit" className="relative max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-slate-950 p-4 shadow-2xl sm:p-6">
            <button
              onClick={() => setShowAudit(false)}
              className="absolute right-5 top-5 z-10 rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800"
              aria-label="Close audit"
            >
              <X className="h-4 w-4" />
            </button>
            <Suspense fallback={<div className="p-8 text-sm text-slate-300">Loading audit details…</div>}>
              <AuditLogView circuitBreakerStatus={circuitBreakerStatus} onNavigate={handleNavigate} />
            </Suspense>
          </section>
        </div>
      )}
    </div>
  );
}
