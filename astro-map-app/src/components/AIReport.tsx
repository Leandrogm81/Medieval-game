'use client';

import React, { useState, useEffect, useRef } from 'react';
import { NatalChart, AIReport as AIReportType } from '@/types';
import { Sparkles, AlertCircle, Loader2, BookOpen, ChevronDown, Brain, Zap, Star, Key, Eye, EyeOff } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  description: string;
  cost: string;
}

interface AIReportProps {
  chart: NatalChart;
  onReportGenerated?: (report: AIReportType | null) => void;
}

export default function AIReport({ chart, onReportGenerated }: AIReportProps) {
  const [report, setReport] = useState<AIReportType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('google/gemini-2.5-flash');
  const [models, setModels] = useState<Model[]>([]);
  const [modelUsed, setModelUsed] = useState<string>('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const prevReportRef = useRef<AIReportType | null>(null);

  useEffect(() => {
    if (onReportGenerated && report !== prevReportRef.current) {
      prevReportRef.current = report;
      onReportGenerated(report);
    }
  }, [report, onReportGenerated]);

  useEffect(() => {
    fetch('/api/report')
      .then(res => res.json())
      .then(data => {
        if (data.models) {
          setModels(data.models);
        }
      })
      .catch(console.error);
  }, []);

  const handleGenerateReport = async () => {
    if (!apiKey.trim()) {
      setError('Por favor, insira sua chave API da OpenRouter');
      return;
    }

    localStorage.setItem('openrouter_api_key', apiKey.trim());

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          chart,
          model: selectedModel,
          apiKey: apiKey.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao gerar relatório');
      }

      const data = await response.json();
      setReport(data.report);
      setModelUsed(data.modelUsed || selectedModel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const selectedModelData = models.find(m => m.id === selectedModel);

  const getModelIcon = (modelId: string) => {
    if (modelId.includes('gemini')) return <Zap className="w-4 h-4" />;
    if (modelId.includes('claude')) return <Brain className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {!report && (
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-purple-200 mb-2">
              Gerar Relatório com IA
            </h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Selecione um modelo de linguagem e gere uma interpretação completa 
              e personalizada do seu mapa astral.
            </p>
          </div>

          {models.length > 0 && (
            <div className="bg-slate-900/50 border border-purple-500/20 rounded-lg p-4">
              <label className="block text-sm font-medium text-purple-200 mb-3">
                Selecionar Modelo de IA
              </label>
              
              <div className="relative">
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="w-full flex items-center justify-between p-3 bg-slate-800 border border-purple-500/30 rounded-lg hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {selectedModelData && (
                      <>
                        <div className="text-purple-400">
                          {getModelIcon(selectedModelData.id)}
                        </div>
                        <div className="text-left">
                          <div className="text-slate-200 font-medium">
                            {selectedModelData.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {selectedModelData.description} • {selectedModelData.cost}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
                </button>

                {showModelSelector && (
                  <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-purple-500/30 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                    {models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setShowModelSelector(false);
                        }}
                        className={`w-full flex items-start gap-3 p-3 text-left hover:bg-purple-500/10 transition-colors border-b border-purple-500/10 last:border-0 ${
                          selectedModel === model.id ? 'bg-purple-500/20' : ''
                        }`}
                      >
                        <div className="text-purple-400 mt-0.5">
                          {getModelIcon(model.id)}
                        </div>
                        <div className="flex-1">
                          <div className="text-slate-200 font-medium text-sm">
                            {model.name}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {model.description}
                          </div>
                          <div className="text-xs text-purple-400 mt-1">
                            {model.cost}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs text-slate-500">
                O custo é cobrado pela OpenRouter diretamente. 
                Crie uma conta em{' '}
                <a 
                  href="https://openrouter.ai/keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline"
                >
                  openrouter.ai/keys
                </a>
              </p>
            </div>
          )}

          <div className="bg-slate-900/50 border border-purple-500/20 rounded-lg p-4">
            <label className="block text-sm font-medium text-purple-200 mb-2">
              <Key className="inline w-4 h-4 mr-2" />
              Chave API OpenRouter
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full px-4 py-3 pr-12 bg-slate-800 border border-purple-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Obtenha sua chave em{' '}
              <a 
                href="https://openrouter.ai/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                openrouter.ai/keys
              </a>
            </p>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={loading || !apiKey.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando relatório...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {!apiKey.trim() ? 'Insira a chave API para continuar' : 'Gerar Relatório'}
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h4 className="text-red-200 font-medium">Erro ao gerar relatório</h4>
              <p className="text-sm text-red-200/70 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xl font-semibold text-purple-200 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Relatório Astrológico
            </h3>
            <div className="flex items-center gap-3">
              {modelUsed && (
                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                  {models.find(m => m.id === modelUsed)?.name || modelUsed}
                </span>
              )}
              <span className="text-xs text-slate-500">
                {new Date(report.generatedAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {report.sections.map((section: { title: string; content: string }, index: number) => (
              <div
                key={index}
                className="p-6 bg-slate-900/50 border border-purple-500/20 rounded-lg"
              >
                <h4 className="text-lg font-semibold text-purple-300 mb-4">
                  {section.title}
                </h4>
                <div className="whitespace-pre-wrap text-slate-300 leading-relaxed text-sm">
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setReport(null);
                setModelUsed('');
              }}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-purple-500/30 rounded-lg text-slate-300 transition-colors"
            >
              Gerar Novo Relatório
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
