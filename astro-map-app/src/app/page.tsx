'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BirthData, NatalChart, AIReport as AIReportType, SavedChart } from '@/types';
import { initSweph, calculateNatalChart } from '@/lib/ephemeris';
import { saveChart, getSavedCharts, updateChart } from '@/lib/storage';
import BirthForm from '@/components/BirthForm';
import AstroChart from '@/components/AstroChart';
import PlanetTable from '@/components/PlanetTable';
import HousesTable from '@/components/HousesTable';
import AspectsList from '@/components/AspectsList';
import AIReport from '@/components/AIReport';
import SolarRevolution from '@/components/SolarRevolution';
import SavedCharts from '@/components/SavedCharts';
import ExportPDF from '@/components/ExportPDF';
import { Sparkles, Moon, Sun, Star, ChevronDown, ChevronUp, Save } from 'lucide-react';

function isValidChart(chart: any): chart is NatalChart {
  return (
    chart &&
    typeof chart === 'object' &&
    chart.birthData &&
    typeof chart.birthData === 'object' &&
    chart.birthData.name &&
    chart.birthData.date &&
    chart.birthData.time &&
    Array.isArray(chart.planets) &&
    chart.planets.length > 0 &&
    Array.isArray(chart.housesPlacidus) &&
    Array.isArray(chart.housesWhole) &&
    Array.isArray(chart.aspects)
  );
}

export default function Home() {
  const [initialized, setInitialized] = useState(false);
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [savedChartId, setSavedChartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'houses' | 'aspects' | 'report' | 'revolution'>('chart');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['form', 'saved']));
  const [aiReport, setAiReport] = useState<AIReportType | null>(null);
  const [solarReport, setSolarReport] = useState<AIReportType | null>(null);
  const [solarRevolution, setSolarRevolution] = useState<NatalChart | null>(null);
  const [solarYear, setSolarYear] = useState<number | undefined>(undefined);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    initSweph()
      .then(() => setInitialized(true))
      .catch((err) => {
        console.error('Failed to initialize ephemeris:', err);
        setError('Falha ao inicializar cálculos astronômicos. Recarregue a página.');
      });
  }, []);

  const handleFormSubmit = async (birthData: BirthData) => {
    if (!initialized) {
      setError('Sistema ainda não inicializado. Aguarde um momento.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const calculatedChart = await calculateNatalChart(birthData);
      
      if (!isValidChart(calculatedChart)) {
        throw new Error('Dados do mapa astral inválidos');
      }
      
      setChart(calculatedChart);
      setAiReport(null);
      setSolarReport(null);
      setSolarRevolution(null);
      setSolarYear(undefined);
      
      try {
        const saved = saveChart(`${birthData.name} - ${birthData.date}`, calculatedChart);
        setSavedChartId(saved.id);
      } catch (saveErr) {
        console.warn('Failed to save chart:', saveErr);
      }
    } catch (err) {
      console.error('Chart calculation error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao calcular mapa astral');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChart = (savedChart: SavedChart) => {
    if (isValidChart(savedChart.chart)) {
      setChart(savedChart.chart);
      setAiReport(savedChart.aiReport || null);
      setSolarReport(savedChart.solarReport || null);
      setSolarRevolution(savedChart.solarRevolution || null);
      setSolarYear(savedChart.solarYear);
      setSavedChartId(savedChart.id);
      setError(null);
    } else {
      setError('Dados do mapa astral inválidos ou corrompidos');
    }
  };

  const handleReportGenerated = (report: AIReportType | null) => {
    setAiReport(report);
    if (savedChartId && report) {
      updateChart(savedChartId, { aiReport: report });
    }
  };

  const handleSolarReportGenerated = (report: AIReportType | null) => {
    setSolarReport(report);
    if (savedChartId && report) {
      updateChart(savedChartId, { solarReport: report, solarRevolution: solarRevolution || undefined, solarYear: solarYear });
    }
  };

  const handleRevolutionCalculated = (rev: NatalChart | null, year: number) => {
    setSolarRevolution(rev);
    setSolarYear(year);
    if (savedChartId && rev) {
      updateChart(savedChartId, { solarRevolution: rev, solarYear: year });
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const hasValidChart = isValidChart(chart);

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                  AstroMap
                </h1>
                <p className="text-xs text-slate-400">Mapa Astral com IA</p>
              </div>
            </div>

            <nav className="flex items-center gap-4">
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-400 hover:text-purple-300 transition-colors"
              >
                Obter API Key
              </a>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Formulário */}
            <div className="bg-slate-900/50 border border-purple-500/20 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('form')}
                className="w-full px-6 py-4 flex items-center justify-between bg-slate-900/80 hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-semibold text-purple-200">
                    Dados de Nascimento
                  </h2>
                </div>
                {expandedSections.has('form') ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {expandedSections.has('form') && (
                <div className="p-6">
                  {!initialized ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                      <p className="mt-2 text-sm text-slate-400">
                        Inicializando sistema astronômico...
                      </p>
                    </div>
                  ) : (
                    <BirthForm onSubmit={handleFormSubmit} loading={loading} />
                  )}
                </div>
              )}
            </div>

            {/* Mapas Salvos */}
            <div className="bg-slate-900/50 border border-purple-500/20 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('saved')}
                className="w-full px-6 py-4 flex items-center justify-between bg-slate-900/80 hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Save className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-semibold text-purple-200">
                    Mapas Salvos
                  </h2>
                </div>
                {expandedSections.has('saved') ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {expandedSections.has('saved') && (
                <div className="p-6">
                  <SavedCharts onSelectChart={handleSelectChart} />
                </div>
              )}
            </div>

            {/* Exportar PDF */}
            {hasValidChart && (
              <ExportPDF 
                chart={chart} 
                report={aiReport}
                solarRevolution={solarRevolution}
                solarYear={solarYear}
              />
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Erro */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-200">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* Resultado */}
            {hasValidChart ? (
              <div className="space-y-6">
                {/* Info Header */}
                <div className="p-6 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 rounded-xl">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {chart.birthData.name}
                  </h2>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                    <span className="flex items-center gap-1">
                      <Sun className="w-4 h-4 text-yellow-400" />
                      {chart.birthData.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Moon className="w-4 h-4 text-slate-300" />
                      {chart.birthData.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-purple-400" />
                      {chart.birthData.location}
                    </span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-purple-500/20">
                  {[
                    { id: 'chart', label: 'Mapa', icon: Star },
                    { id: 'houses', label: 'Casas', icon: Moon },
                    { id: 'aspects', label: 'Aspectos', icon: Sun },
                    { id: 'report', label: 'Relatório IA', icon: Sparkles },
                    { id: 'revolution', label: 'Revolução Solar', icon: Sun },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`px-4 py-3 flex items-center gap-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === tab.id
                          ? 'border-purple-500 text-purple-300'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="bg-slate-900/50 border border-purple-500/20 rounded-xl p-6">
                  {activeTab === 'chart' && (
                    <div className="space-y-6">
                      <AstroChart chart={chart} />
                      <PlanetTable chart={chart} />
                    </div>
                  )}

                  {activeTab === 'houses' && (
                    <div className="space-y-6">
                      <HousesTable chart={chart} system="placidus" />
                      <hr className="border-purple-500/20" />
                      <HousesTable chart={chart} system="whole" />
                    </div>
                  )}

                  {activeTab === 'aspects' && (
                    <AspectsList chart={chart} />
                  )}

                  {activeTab === 'report' && (
                    <AIReport 
                      chart={chart} 
                      onReportGenerated={handleReportGenerated}
                    />
                  )}

                  {activeTab === 'revolution' && (
                    <SolarRevolution 
                      natalChart={chart}
                      onRevolutionCalculated={handleRevolutionCalculated}
                      onSolarReportGenerated={handleSolarReportGenerated}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
                  <Sparkles className="w-12 h-12 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-purple-200 mb-3">
                  Bem-vindo ao AstroMap
                </h2>
                <p className="text-slate-400 max-w-md mb-6">
                  Calcule seu mapa astral completo com precisão profissional.
                  Descubra a posição dos planetas, casas astrológicas e gere um
                  relatório completo com inteligência artificial.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Cálculos precisos
                  </span>
                  <span className="flex items-center gap-1">
                    <Moon className="w-4 h-4" />
                    Dois sistemas de casas
                  </span>
                  <span className="flex items-center gap-1">
                    <Sun className="w-4 h-4" />
                    Aspectos completos
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    IA integrada
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>
              © 2026 AstroMap. Cálculos astronômicos via Astronomy Engine.
            </p>
            <div className="flex items-center gap-4">
              <span>Grátis e sem cadastro</span>
              <span>•</span>
              <span>Dados salvos localmente</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
