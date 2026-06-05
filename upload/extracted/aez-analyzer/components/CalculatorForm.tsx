import React, { useState, useEffect } from 'react';
import { SoilComposition, AEZData } from '../types';
import { AlertCircle, FlaskConical, TestTube2, AlertTriangle } from 'lucide-react';
import SoilCompositionChart from './SoilCompositionChart';

interface Props {
  onAnalyze: (data: SoilComposition, om?: number) => void;
  selectedAEZ?: AEZData;
  isLoading: boolean;
}

const CalculatorForm: React.FC<Props> = ({ onAnalyze, selectedAEZ, isLoading }) => {
  const [sand, setSand] = useState<number>(40);
  const [silt, setSilt] = useState<number>(40);
  const [clay, setClay] = useState<number>(20);
  const [om, setOm] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const total = sand + silt + clay;
  const isValid = Math.abs(total - 100) <= 1;

  useEffect(() => {
    if (total !== 100) {
      setError(`Total must be 100%. Current: ${total}%`);
    } else {
      setError(null);
    }
  }, [sand, silt, clay, total]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isLoading) {
      onAnalyze(
        { sand, silt, clay },
        om ? Number(om) : undefined
      );
    }
  };

  const InputGroup = ({ label, value, setter, colorClass }: { label: string, value: number, setter: (v: number) => void, colorClass: string }) => (
    <div className="bg-earth-50 p-3 rounded-lg border border-earth-100">
        <div className="flex justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-earth-600">{label}</label>
            <span className="text-xs font-mono font-bold text-earth-800">{value}%</span>
        </div>
        <input 
            type="range" 
            min="0" 
            max="100" 
            value={value} 
            onChange={(e) => setter(Number(e.target.value))}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-earth-200 ${colorClass}`} 
        />
        <input
            type="number"
            min="0"
            max="100"
            value={value}
            onChange={(e) => setter(Number(e.target.value))}
            className="w-full mt-2 px-2 py-1 text-sm border border-earth-200 rounded text-center focus:ring-1 focus:ring-agri-500 outline-none"
        />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-earth-200 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 bg-agri-50 rounded-md">
                <FlaskConical className="w-4 h-4 text-agri-600"/>
            </div>
            <div>
                <h3 className="text-lg font-bold text-earth-800 leading-none">Soil Data</h3>
                <p className="text-xs text-earth-500 mt-0.5">Enter sample composition</p>
            </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Visual Composition Bar */}
          <div className="w-full h-4 rounded-full overflow-hidden flex bg-earth-100 shadow-inner">
            <div style={{ width: `${(sand/total)*100}%` }} className="bg-[#eab308] h-full transition-all duration-300"></div>
            <div style={{ width: `${(silt/total)*100}%` }} className="bg-[#a8a29e] h-full transition-all duration-300"></div>
            <div style={{ width: `${(clay/total)*100}%` }} className="bg-[#78350f] h-full transition-all duration-300"></div>
          </div>
          <div className="flex justify-between text-[10px] text-earth-500 px-1">
             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#eab308]"></div>Sand</span>
             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#a8a29e]"></div>Silt</span>
             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#78350f]"></div>Clay</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <InputGroup label="Sand" value={sand} setter={setSand} colorClass="accent-yellow-500" />
            <InputGroup label="Silt" value={silt} setter={setSilt} colorClass="accent-stone-400" />
            <InputGroup label="Clay" value={clay} setter={setClay} colorClass="accent-amber-900" />
          </div>

          <div className="pt-2">
             <label className="block text-xs font-semibold uppercase tracking-wider text-earth-600 mb-2">Organic Matter % (Optional)</label>
             <div className="relative">
                 <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder={selectedAEZ ? "Estimating..." : "e.g. 2.5"}
                    value={om}
                    onChange={(e) => setOm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-earth-200 rounded-lg focus:ring-2 focus:ring-agri-500 focus:border-agri-500 text-sm font-mono shadow-sm transition-all"
                  />
                  <TestTube2 className="w-4 h-4 text-earth-400 absolute left-3 top-3" />
             </div>
             {!om && (
                <p className="text-[10px] text-earth-500 mt-1.5 flex items-center gap-1">
                    <InfoIcon /> Leave blank to estimate based on texture & AEZ.
                </p>
             )}
          </div>

          {/* Error / Validation Message */}
          <div className={`flex items-center gap-2 text-sm p-3 rounded-lg transition-colors ${isValid ? 'bg-agri-50 text-agri-700' : 'bg-red-50 text-red-700'}`}>
              {isValid ? (
                  <>
                    <div className="w-2 h-2 bg-agri-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">Composition valid (100%)</span>
                  </>
              ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-medium">{error}</span>
                  </>
              )}
          </div>

          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition-all transform duration-200
              ${!isValid || isLoading 
                ? 'bg-earth-200 text-earth-400 cursor-not-allowed' 
                : 'bg-agri-600 text-white hover:bg-agri-700 shadow-lg shadow-agri-600/30 hover:-translate-y-0.5 active:translate-y-0'}`}
          >
            {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Analyzing...
                </span>
            ) : 'Analyze Sample'}
          </button>
        </form>
      </div>

      <SoilCompositionChart data={{ sand, silt, clay }} />
    </div>
  );
};

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
)

export default CalculatorForm;