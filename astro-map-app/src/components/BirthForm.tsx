'use client';

import React, { useState, useCallback } from 'react';
import { BirthData, GeocodingResult } from '@/types';
import { geocodeLocation, getTimezoneFromCoordinates } from '@/lib/geocoding';
import { Search, MapPin, Clock, Calendar, User } from 'lucide-react';

interface BirthFormProps {
  onSubmit: (data: BirthData) => void;
  initialData?: BirthData;
  loading?: boolean;
}

export default function BirthForm({ onSubmit, initialData, loading }: BirthFormProps) {
  const [formData, setFormData] = useState<BirthData>({
    name: initialData?.name || '',
    date: initialData?.date || '',
    time: initialData?.time || '',
    location: initialData?.location || '',
    latitude: initialData?.latitude || 0,
    longitude: initialData?.longitude || 0,
    timezone: initialData?.timezone || '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery || searchQuery.length < 3) return;

    setIsSearching(true);
    const results = await geocodeLocation(searchQuery);
    setSearchResults(results);
    setShowResults(true);
    setIsSearching(false);
  }, [searchQuery]);

  const handleSelectLocation = (result: GeocodingResult) => {
    setFormData(prev => ({
      ...prev,
      location: result.display_name,
      latitude: result.lat,
      longitude: result.lon,
      timezone: getTimezoneFromCoordinates(result.lat, result.lon),
    }));
    setSearchQuery(result.display_name);
    setShowResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.date && formData.time && formData.latitude && formData.longitude) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">
            <User className="inline w-4 h-4 mr-2" />
            Nome Completo
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-900/80 border border-purple-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
            placeholder="Digite seu nome"
            required
          />
        </div>

        {/* Data */}
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">
            <Calendar className="inline w-4 h-4 mr-2" />
            Data de Nascimento
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-900/80 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
            required
          />
        </div>

        {/* Hora */}
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">
            <Clock className="inline w-4 h-4 mr-2" />
            Hora de Nascimento
          </label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-900/80 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
            required
          />
        </div>

        {/* Localização */}
        <div className="relative">
          <label className="block text-sm font-medium text-purple-200 mb-2">
            <MapPin className="inline w-4 h-4 mr-2" />
            Local de Nascimento
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
              className="flex-1 px-4 py-3 bg-slate-900/80 border border-purple-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              placeholder="Cidade, Estado, País"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || searchQuery.length < 3}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Resultados da busca */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-slate-900 border border-purple-500/30 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectLocation(result)}
                  className="w-full px-4 py-3 text-left hover:bg-purple-500/20 transition-colors border-b border-purple-500/10 last:border-0"
                >
                  <p className="text-sm text-white">{result.display_name}</p>
                  <p className="text-xs text-slate-400">
                    {result.lat.toFixed(4)}°, {result.lon.toFixed(4)}°
                  </p>
                </button>
              ))}
            </div>
          )}

          {showResults && searchResults.length === 0 && !isSearching && (
            <div className="absolute z-10 w-full mt-2 bg-slate-900 border border-purple-500/30 rounded-lg shadow-xl p-4">
              <p className="text-sm text-slate-400">Nenhum local encontrado</p>
            </div>
          )}
        </div>

        {/* Coordenadas selecionadas */}
        {formData.latitude !== 0 && formData.longitude !== 0 && (
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <p className="text-sm text-purple-200">
              <MapPin className="inline w-4 h-4 mr-2" />
              Coordenadas selecionadas:
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Latitude: {formData.latitude.toFixed(4)}° | Longitude: {formData.longitude.toFixed(4)}°
            </p>
          </div>
        )}
      </div>

      {/* Botão de envio */}
      <button
        type="submit"
        disabled={loading || !formData.latitude || !formData.longitude}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-purple-800/50 disabled:to-indigo-800/50 disabled:cursor-not-allowed rounded-lg text-white font-semibold text-lg shadow-lg shadow-purple-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Calculando Mapa Astral...
          </span>
        ) : (
          'Calcular Mapa Astral'
        )}
      </button>
    </form>
  );
}
