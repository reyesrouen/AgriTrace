import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Copy, 
  Check, 
  Lock, 
  Truck,
  Scale,
  LineChart,
  FileCheck2
} from 'lucide-react';

export default function BatchDetailModal({ 
  batch, 
  onClose, 
  onTamperToggle,
  onNavigate,
  onSelectCommodity 
}) {
  const [copied, setCopied] = useState(false);

  if (!batch) return null;

  const handleCopyManifest = () => {
    const manifestJson = JSON.stringify({
      file_name: `${batch.id.toLowerCase()}_manifest.json`,
      batch_id: batch.id,
      commodity: batch.commodity,
      variety: batch.variety,
      ias41_classification: batch.ias41Classification,
      harvest_timestamp: batch.harvestTimestamp,
      quantity_kg: batch.quantityKg,
      gross_spot_rate_php: batch.unitPricePhp,
      fvlcts_carrying_rate_php: batch.fvlctsPerKg,
      total_carrying_value_php: batch.totalCarryingValuePhp,
      current_temperature_c: batch.currentTemperatureC,
      sha256_hash: batch.manifestHash,
      signature_ecdsa: batch.signatureEcdsa,
      signer_authority: batch.signerAuthority,
      public_key: batch.publicKey,
      timestamp: batch.timestamp
    }, null, 2);

    navigator.clipboard.writeText(manifestJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/80 sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              batch.tampered
                ? 'bg-red-500/15 border-red-500/30 text-red-400'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}>
              {batch.tampered ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">{batch.id}</h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  batch.tampered
                    ? 'bg-red-500/10 text-red-400 border-red-500/30 font-bold'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {batch.tampered ? 'TAMPERED / UPDATE BLOCKED' : 'IAS 41 VERIFIED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{batch.commodity} • {batch.variety}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* QR Code & Provenance Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 items-center">
            {/* 2D QR Matrix */}
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-inner mx-auto w-36 h-36">
              <div className="grid grid-cols-7 gap-1 w-full h-full p-1 bg-white">
                {Array.from({ length: 49 }).map((_, i) => {
                  const isCorner = 
                    (i < 3 || (i >= 7 && i < 10) || (i >= 14 && i < 17)) ||
                    (i % 7 >= 4 && i < 21) ||
                    (i >= 28 && i % 7 < 3);
                  const isRandom = (i * 19 + 5) % 4 === 0 || (i * 29 + 11) % 5 === 0;
                  return (
                    <div
                      key={i}
                      className={`rounded-[1px] ${
                        isCorner || isRandom ? 'bg-slate-950' : 'bg-transparent'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">IAS 41 Classification:</span>
                <span className="font-mono font-bold text-emerald-400">{batch.ias41Classification}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Point of Harvest Cutover:</span>
                <span className="font-mono text-slate-200">{batch.harvestTimestamp}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Total FVLCTS Carrying Amount:</span>
                <span className="font-mono font-bold text-slate-100">
                  PHP {batch.totalCarryingValuePhp?.toLocaleString()} (₱{batch.fvlctsPerKg}/kg)
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Gross Spot Valuation:</span>
                <span className="font-mono text-slate-300">
                  PHP {batch.totalGrossValuePhp?.toLocaleString()} (₱{batch.unitPricePhp}/kg)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Regulatory Certifier:</span>
                <span className="text-slate-300 text-right truncate max-w-[200px]">{batch.signerAuthority}</span>
              </div>
            </div>
          </div>

          {/* IAS 41 Financial Ledger Details */}
          {batch.financialLedger && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-400" />
                  IAS 41 Financial Valuation Breakdown
                </span>
                <span className="font-mono text-[10px] text-emerald-400">{batch.financialLedger.reportingStandard}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Initial Standing Crop:</span>
                  <span className="text-slate-200">₱{batch.financialLedger.initialBiologicalValue?.toLocaleString()}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Harvest Fair Value:</span>
                  <span className="text-slate-200">₱{batch.financialLedger.harvestFairValue?.toLocaleString()}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Unrealized Bio Gain:</span>
                  <span className="text-emerald-400 font-bold">+₱{batch.financialLedger.unrealizedBioGainLoss?.toLocaleString()}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Costs to Sell Deducted:</span>
                  <span className="text-amber-400">-₱{batch.financialLedger.estimatedCostsToSellDeducted?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Cryptographic Manifest Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Signed JSON Manifest (ECDSA NIST P-256)
              </h4>
              <button
                onClick={handleCopyManifest}
                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-slate-300 space-y-2 overflow-x-auto">
              <div>
                <span className="text-slate-500">"sha256_hash": </span>
                <span className={`break-all ${batch.tampered ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                  "{batch.manifestHash}"
                </span>
              </div>
              <div>
                <span className="text-slate-500">"signature_ecdsa": </span>
                <span className="text-slate-400 break-all">"{batch.signatureEcdsa}"</span>
              </div>
              <div>
                <span className="text-slate-500">"public_key": </span>
                <span className="text-cyan-400">"{batch.publicKey}"</span>
              </div>
            </div>
          </div>

          {/* Supply Chain Custody & Regulatory Steps */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-purple-400" />
              Chain of Custody Blocks & Regulatory Checkpoints
            </h4>

            <div className="space-y-2.5">
              {batch.stages.map((stage) => (
                <div
                  key={stage.stageNumber}
                  className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 text-xs font-mono"
                >
                  <div className="flex items-center justify-between font-sans">
                    <span className="font-semibold text-slate-200">
                      Stage {stage.stageNumber}: {stage.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      {stage.regulatoryBody}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans flex justify-between">
                    <span>{stage.operator} • {stage.location}</span>
                    <span className="text-emerald-400 font-mono">
                      Carrying: ₱{stage.valuationAtStage?.fvlctsPerKg || batch.fvlctsPerKg}/kg
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-2 pt-1 border-t border-slate-900">
                    <span>Block Hash:</span>
                    <span className="text-slate-400 truncate">{stage.blockHash}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer: Circuit Breaker Simulation & Cross-Navigation */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Simulate data mutation to test the R verification gate circuit breaker.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onNavigate && (
              <>
                <button
                  onClick={() => {
                    if (onSelectCommodity) {
                      const lower = batch.commodity.toLowerCase();
                      const mappedId = lower.includes('red onion') ? 'onions_red'
                        : lower.includes('white onion') ? 'onions_white'
                        : lower.includes('tomato') ? 'tomatoes'
                        : lower.includes('premium') ? 'rice_premium'
                        : lower.includes('rice') ? 'rice_regular'
                        : 'onions_red';
                      onSelectCommodity(mappedId);
                    }
                    onClose();
                    onNavigate('forecasting');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 transition cursor-pointer"
                  title="Open commodity in Multivariate Forecasting Studio"
                >
                  <LineChart className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Forecast Commodity</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onNavigate('audit');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-300 hover:text-slate-100 transition cursor-pointer"
                  title="Inspect raw manifest signatures in Audit Log"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Audit Logs</span>
                </button>
              </>
            )}

            <button
              onClick={() => onTamperToggle(batch.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                batch.tampered
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40'
              }`}
            >
              {batch.tampered ? 'Restore Authentic Payload' : 'Inject Tamper Mutation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
