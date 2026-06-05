import React, { useState } from 'react';
import { ViewMode, AEZData, SoilComposition, AnalysisResult } from './types';
import AEZSelector from './components/AEZSelector';
import CalculatorForm from './components/CalculatorForm';
import AnalysisView from './components/AnalysisView';
import { getAEZInfo, analyzeSoilSample } from './services/geminiService';
import { Sprout, Map, Calculator, Menu, X, Info, BookOpenCheck } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<ViewMode>('explorer');
  const [selectedAEZ, setSelectedAEZ] = useState<AEZData | undefined>(undefined);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>({
    textureClass: '',
    recommendation: '',
    suitableCrops: [],
    organicMatterEstimate: ''
  });
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAEZSelect = async (aez: AEZData) => {
    setSelectedAEZ(aez);
    setLoading(true);
    setMobileMenuOpen(false);
    
    // Clear previous results to trigger loading state cleanly
    setAnalysisResult({ textureClass: '', recommendation: '', suitableCrops: [], organicMatterEstimate: '' });

    try {
      const result = await getAEZInfo(aez);
      setAnalysisResult(result);
    } catch (error) {
      console.error(error);
      setAnalysisResult(prev => ({ ...prev, recommendation: "**Error:** Failed to fetch AEZ data. Please try again." }));
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async (composition: SoilComposition, om?: number) => {
    setLoading(true);
    // On mobile, scroll to results
    const resultsElement = document.getElementById('results-view');
    if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth' });
    }

    try {
      const result = await analyzeSoilSample(composition, selectedAEZ, om);
      setAnalysisResult(result);
    } catch (error) {
      setAnalysisResult(prev => ({ ...prev, recommendation: "**Error:** Analysis failed. Please check your inputs and try again." }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-earth-50 text-earth-900 font-sans flex flex-col selection:bg-agri-200 selection:text-agri-900">
      {/* Header */}
      <header className="bg-white border-b border-earth-200 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setMode('explorer'); setSelectedAEZ(undefined); }}>
              <div className="bg-gradient-to-br from-agri-100 to-agri-200 p-2 rounded-xl border border-agri-200 shadow-inner">
                <Sprout className="w-6 h-6 text-agri-700" />
              </div>
              <div className="leading-tight">
                <h1 className="text-xl font-bold text-earth-800 tracking-tight">BdSoil</h1>
                <p className="text-[10px] uppercase font-bold text-agri-600 tracking-wider">AEZ Analyzer</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-2 bg-earth-100/50 p-1.5 rounded-xl border border-earth-200/60">
              <button
                onClick={() => setMode('explorer')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  mode === 'explorer' 
                    ? 'bg-white text-agri-700 shadow-sm ring-1 ring-black/5' 
                    : 'text-earth-600 hover:text-earth-900 hover:bg-earth-200/50'
                }`}
              >
                <Map className="w-4 h-4" />
                AEZ Explorer
              </button>
              <button
                onClick={() => setMode('calculator')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  mode === 'calculator' 
                    ? 'bg-white text-agri-700 shadow-sm ring-1 ring-black/5' 
                    : 'text-earth-600 hover:text-earth-900 hover:bg-earth-200/50'
                }`}
              >
                <Calculator className="w-4 h-4" />
                Soil Calculator
              </button>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-earth-600 hover:bg-earth-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-earth-200 absolute w-full left-0 top-16 shadow-lg z-40 animate-in slide-in-from-top-2">
            <div className="p-4 space-y-2">
                <button
                onClick={() => { setMode('explorer'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    mode === 'explorer' ? 'bg-agri-50 text-agri-700 border border-agri-100' : 'text-earth-600 hover:bg-earth-50'
                }`}
                >
                <Map className="w-5 h-5" /> AEZ Explorer
                </button>
                <button
                onClick={() => { setMode('calculator'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    mode === 'calculator' ? 'bg-agri-50 text-agri-700 border border-agri-100' : 'text-earth-600 hover:bg-earth-50'
                }`}
                >
                <Calculator className="w-5 h-5" /> Soil Calculator
                </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Controls (Sticky on Desktop) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-6">
            
            {/* Context Header */}
            {selectedAEZ && (
              <div className="bg-gradient-to-r from-agri-600 to-agri-700 rounded-xl p-4 text-white shadow-lg shadow-agri-900/10 flex items-center justify-between group transition-all hover:shadow-agri-900/20">
                <div className="flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-agri-100 mb-1">Active Region</div>
                  <h2 className="font-bold text-lg leading-tight">{selectedAEZ.id}. {selectedAEZ.name}</h2>
                </div>
                <button 
                  onClick={() => {
                    setSelectedAEZ(undefined);
                    // Don't change mode, just clear context
                  }}
                  className="ml-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors"
                  title="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {mode === 'explorer' ? (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-earth-200 flex flex-col max-h-[calc(100vh-200px)]">
                <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                     <div className="p-1.5 bg-earth-100 rounded-md">
                        <Map className="w-4 h-4 text-earth-700" />
                     </div>
                     <h2 className="text-lg font-bold text-earth-800">Explore Regions</h2>
                </div>
                <p className="text-earth-600 text-sm mb-4 leading-relaxed flex-shrink-0">
                  Select an Agro-ecological Zone to see soil properties.
                </p>
                <div className="flex-grow overflow-hidden flex flex-col min-h-[300px]">
                    <AEZSelector onSelect={handleAEZSelect} selectedId={selectedAEZ?.id} />
                </div>
              </div>
            ) : (
              <CalculatorForm 
                onAnalyze={handleCalculate} 
                selectedAEZ={selectedAEZ} 
                isLoading={loading} 
              />
            )}

            {/* Source Credits - New Section */}
            <div className="bg-white p-4 rounded-xl border border-earth-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-earth-800 font-semibold text-sm">
                    <BookOpenCheck className="w-4 h-4 text-agri-600" />
                    <span>Data Sources</span>
                </div>
                <p className="text-xs text-earth-500 mb-3 leading-relaxed">
                    Analysis is grounded in data from:
                </p>
                <div className="flex flex-wrap gap-2">
                    {['SRDI', 'BARC', 'BRRI', 'BARI', 'CZIS'].map(source => (
                        <span key={source} className="px-2 py-1 bg-earth-100 text-earth-600 rounded text-[10px] font-bold tracking-wide">
                            {source}
                        </span>
                    ))}
                </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div id="results-view" className="lg:col-span-8 min-h-[500px]">
            <AnalysisView result={analysisResult} loading={loading} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;