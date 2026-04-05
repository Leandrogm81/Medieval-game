'use client';

import React, { useState, useEffect } from 'react';
import { SavedChart, NatalChart } from '@/types';
import { getSavedCharts, loadChart, deleteChart } from '@/lib/storage';
import { Calendar, MapPin, Trash2, ChevronRight } from 'lucide-react';

interface SavedChartsProps {
  onSelectChart: (savedChart: SavedChart) => void;
}

export default function SavedCharts({ onSelectChart }: SavedChartsProps) {
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharts();
  }, []);

  const loadCharts = () => {
    try {
      const saved = getSavedCharts();
      const validCharts = saved.filter((c) => 
        c && c.chart && c.chart.birthData && c.chart.birthData.name
      );
      setCharts(validCharts);
    } catch (err) {
      console.error('Error loading saved charts:', err);
      setCharts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este mapa astral?')) {
      deleteChart(id);
      loadCharts();
    }
  };

  const handleSelect = (savedChart: SavedChart) => {
    onSelectChart(savedChart);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (charts.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
          <Calendar className="w-8 h-8 text-purple-400" />
        </div>
        <h3 className="text-lg font-medium text-purple-200 mb-2">
          Nenhum mapa astral salvo
        </h3>
        <p className="text-sm text-slate-400">
          Calcule seu primeiro mapa astral e ele aparecerá aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-purple-200">
        Mapas Astrais Salvos ({charts.length})
      </h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {charts
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((savedChart) => (
            <div
              key={savedChart.id}
              onClick={() => handleSelect(savedChart)}
              className="group p-4 bg-slate-900/50 border border-purple-500/20 rounded-lg cursor-pointer hover:border-purple-500/50 hover:bg-slate-800/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-200 truncate">
                      {savedChart.name || 'Mapa sem nome'}
                    </h4>
                    
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {savedChart.birthData?.date || 'Data desconhecida'}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {(savedChart.birthData?.location || '').split(',')[0] || 'Local desconhecido'}
                      </span>
                    </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Salvo em {formatDate(savedChart.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={(e) => handleDelete(savedChart.id, e)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <ChevronRight className="w-5 h-5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
