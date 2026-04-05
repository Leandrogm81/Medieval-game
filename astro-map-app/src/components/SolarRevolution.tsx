'use client';

import React, { useState, useEffect } from 'react';
import { NatalChart, PlanetPosition, AIReport } from '@/types';
import { calculateSolarReturn } from '@/lib/ephemeris';
import { Sun, ArrowRight, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface SolarRevolutionProps {
  natalChart: NatalChart;
  onRevolutionCalculated?: (solarReturn: NatalChart | null, year: number) => void;
  onSolarReportGenerated?: (report: AIReport | null) => void;
}

export default function SolarRevolution({ natalChart, onRevolutionCalculated, onSolarReportGenerated }: SolarRevolutionProps) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [solarReturn, setSolarReturn] = useState<NatalChart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solarReport, setSolarReport] = useState<AIReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (onRevolutionCalculated && solarReturn) {
      onRevolutionCalculated(solarReturn, year);
    }
  }, [solarReturn, year, onRevolutionCalculated]);

  useEffect(() => {
    if (onSolarReportGenerated && solarReport) {
      onSolarReportGenerated(solarReport);
    }
  }, [solarReport, onSolarReportGenerated]);

  useEffect(() => {
    calculateRevolution();
  }, [year]);

  const calculateRevolution = async () => {
    setLoading(true);
    setError(null);
    setSolarReport(null);

    try {
      const result = await calculateSolarReturn(natalChart, year);
      setSolarReturn(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao calcular revolução solar');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!solarReturn) return;
    
    const storedApiKey = localStorage.getItem('openrouter_api_key') || '';
    
    if (!storedApiKey) {
      setError('Por favor, insira sua chave API da OpenRouter na seção de Relatório IA');
      return;
    }

    setGeneratingReport(true);
    setError(null);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chart: natalChart,
          solarRevolution: solarReturn,
          solarYear: year,
          model: 'google/gemini-2.5-flash',
          apiKey: storedApiKey,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao gerar relatório');
      }

      const data = await response.json();
      setSolarReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar relatório');
    } finally {
      setGeneratingReport(false);
    }
  };

  const getZodiacSign = (longitude: number): string => {
    const signs = ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
                   'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'];
    return signs[Math.floor(longitude / 30) % 12];
  };

  const formatDegree = (degree: number): string => {
    const d = Math.floor(degree);
    const m = Math.floor((degree - d) * 60);
    return `${d}°${m}'`;
  };

  const getAscendantInterpretation = (natalAsc: string, solarAsc: string): string => {
    if (natalAsc === solarAsc) {
      return `O Ascendente da Revolução é o mesmo do mapa natal (${natalAsc}). Este é um ano de grande importância pessoal, onde temas fundamentais da sua vida ganham destaque. É um momento propício para autodesenvolvimento e concretização de objetivos pessoais de longo prazo.`;
    }

    const interpretations: Record<string, string> = {
      'Áries': 'ano de novos começos, iniciativa e afirmação pessoal. Momento de assumir liderança.',
      'Touro': 'ano focado em estabilidade financeira, valores materiais e construção de segurança.',
      'Gêmeos': 'ano de comunicação, aprendizado, conexões e diversificação de interesses.',
      'Câncer': 'ano voltado para família, emoções, lar e questões domésticas.',
      'Leão': 'ano de criatividade, expressão pessoal, romance e busca por reconhecimento.',
      'Virgem': 'ano de organização, saúde, trabalho aprimoramento pessoal.',
      'Libra': 'ano de relacionamentos, parcerias, equilíbrio e questões jurídicas.',
      'Escorpião': 'ano de transformação, recursos compartilhados, profundidade emocional.',
      'Sagitário': 'ano de expansão, filosofia, viagens, ensino e busca por significado.',
      'Capricórnio': 'ano de ambição, carreira, status público e conquistas materiais.',
      'Aquário': 'ano de inovação, grupos, redes sociais e ideias progressistas.',
      'Peixes': 'ano de espiritualidade, intuição, compaixão e conclusão de ciclos.',
    };

    return `O Ascendente da Revolução em ${solarAsc} indica ${interpretations[solarAsc] || 'mudanças significativas na abordagem de vida.'}`;
  };

  const getSunHouseInterpretation = (house: number): string => {
    const interpretations: Record<number, string> = {
      1: 'Este ano o foco está em VOCÊ. Sua personalidade, aparência e como se apresenta ao mundo ganham destaque. É momento de cuidar de si mesmo.',
      2: 'Ano focado em finanças pessoais, valores e autoestima. Momento de avaliar o que é valioso para você.',
      3: 'Ano de comunicação, aprendizado, irmãos e vizinhos. Momento de expandir sua rede de contatos locais.',
      4: 'Ano voltado para lar, família, propriedade e raízes. Momento de cuidar do seu espaço pessoal.',
      5: 'Ano de criatividade, romance, filhos e diversão. Momento de expressar sua alegria e criatividade.',
      6: 'Ano focado em saúde, trabalho diário e rotinas. Momento de aprimorar hábitos e organização.',
      7: 'Ano de parcerias, casamento e relacionamentos próximos. Momento de equilibrar dar e receber.',
      8: 'Ano de transformação, recursos compartilhados e intimidade. Momento de lidar com mudanças profundas.',
      9: 'Ano de expansão, viagens, filosofia e ensino superior. Momento de ampliar horizontes.',
      10: 'Ano focado em carreira, status público e realizações. Momento de consolidar sua posição profissional.',
      11: 'Ano de amizades, grupos e aspirações futuras. Momento de conectar com comunidades.',
      12: 'Ano de espiritualidade, retiro e conclusão de ciclos. Momento de introspecção e processamento interior.',
    };
    return interpretations[house] || 'Área importante da vida ativada este ano.';
  };

  const getMoonSignInterpretation = (sign: string): string => {
    const interpretations: Record<string, string> = {
      'Áries': 'emoções impulsivas e diretas. Momento de agir com coragem emocional.',
      'Touro': 'emoções estáveis e sensuais. Momento de buscar conforto e segurança.',
      'Gêmeos': 'emoções mentais e comunicativas. Momento de expressar sentimentos verbalmente.',
      'Câncer': 'emoções profundas e protetoras. Momento de cuidar e ser cuidado.',
      'Leão': 'emoções dramáticas e generosas. Momento de expressar amor de forma grandiosa.',
      'Virgem': 'emoções analíticas e práticas. Momento de organizar sentimentos.',
      'Libra': 'emoções equilibradas e relacionais. Momento de buscar harmonia emocional.',
      'Escorpião': 'emoções intensas e transformadoras. Momento de profundidade emocional.',
      'Sagitário': 'emoções expansivas e filosóficas. Momento de buscar significado emocional.',
      'Capricórnio': 'emoções contidas e ambiciosas. Momento de responsabilidade emocional.',
      'Aquário': 'emoções únicas e desapegadas. Momento de liberdade emocional.',
      'Peixes': 'emoções sensíveis e universais. Momento de compaixão e intuição.',
    };
    return interpretations[sign] || 'Energia emocional importante este ano.';
  };

  const getRetrogradePlanets = (planets: PlanetPosition[]): PlanetPosition[] => {
    return planets.filter(p => p.retrograde);
  };

  const natalAsc = natalChart.housesPlacidus[0].sign;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-lg font-medium text-purple-200 flex items-center gap-2">
          <Sun className="w-5 h-5 text-yellow-400" />
          Revolução Solar {year}
        </h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYear(y => y - 1)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
            disabled={loading}
          >
            ←
          </button>
          <span className="px-4 py-2 bg-slate-800 rounded-lg text-slate-200 font-medium min-w-[80px] text-center">
            {year}
          </span>
          <button
            onClick={() => setYear(y => y + 1)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
            disabled={loading}
          >
            →
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-purple-400" />
          <p className="mt-2 text-sm text-slate-400">Calculando data exata do retorno solar...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {solarReturn && !loading && (
        <div className="space-y-6">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <h4 className="text-yellow-200 font-medium mb-2 flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Retorno Solar {year}
            </h4>
            <p className="text-sm text-yellow-200/70">
              <strong>Data:</strong> {solarReturn.birthData.date} às {solarReturn.birthData.time} UTC
            </p>
            <p className="text-sm text-yellow-200/70 mt-1">
              <strong>Local:</strong> {solarReturn.birthData.location}
            </p>
            <p className="text-xs text-yellow-200/50 mt-2">
              Momento exato em que o Sol retorna à mesma posição zodiacal do nascimento
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/50 border border-purple-500/20 rounded-lg">
              <h5 className="text-purple-300 font-medium mb-2">Ascendente da Revolução</h5>
              <div className="text-2xl font-bold text-white mb-1">
                {solarReturn.housesPlacidus[0].sign} {formatDegree(solarReturn.housesPlacidus[0].degree)}
              </div>
              <p className="text-xs text-slate-400">
                Natal: {natalAsc}
                {solarReturn.housesPlacidus[0].sign === natalAsc ? ' (mesmo signo)' : ' (diferente)'}
              </p>
            </div>

            <div className="p-4 bg-slate-900/50 border border-purple-500/20 rounded-lg">
              <h5 className="text-purple-300 font-medium mb-2">Sol na Casa</h5>
              <div className="text-2xl font-bold text-white mb-1">
                Casa {solarReturn.planets.find(p => p.name === 'Sol')?.house}
              </div>
              <p className="text-xs text-slate-400">
                Posição: {solarReturn.planets.find(p => p.name === 'Sol')?.sign} {formatDegree(solarReturn.planets.find(p => p.name === 'Sol')?.degree || 0)}
              </p>
            </div>

            <div className="p-4 bg-slate-900/50 border border-purple-500/20 rounded-lg">
              <h5 className="text-purple-300 font-medium mb-2">Lua na Revolução</h5>
              <div className="text-2xl font-bold text-white mb-1">
                {solarReturn.planets.find(p => p.name === 'Lua')?.sign}
              </div>
              <p className="text-xs text-slate-400">
                Casa {solarReturn.planets.find(p => p.name === 'Lua')?.house}
                {solarReturn.planets.find(p => p.name === 'Lua')?.retrograde ? ' (R)' : ''}
              </p>
            </div>

            <div className="p-4 bg-slate-900/50 border border-purple-500/20 rounded-lg">
              <h5 className="text-purple-300 font-medium mb-2">Planetas Retrógrados</h5>
              <div className="text-lg font-bold text-white">
                {getRetrogradePlanets(solarReturn.planets).map(p => p.name).join(', ') || 'Nenhum'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-center gap-2 py-2 text-purple-300 hover:text-purple-200 transition-colors"
          >
            {showDetails ? 'Ocultar' : 'Mostrar'} comparação detalhada
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-purple-200">
                Comparação: Mapa Natal × Revolução Solar
              </h4>
              
              <div className="space-y-2">
                {['Sol', 'Lua', 'Mercúrio', 'Vênus', 'Marte', 'Júpiter', 'Saturno', 'Urano', 'Netuno', 'Plutão'].map((planetName) => {
                  const natalPlanet = natalChart.planets.find(p => p.name === planetName);
                  const solarPlanet = solarReturn.planets.find(p => p.name === planetName);
                  
                  if (!natalPlanet || !solarPlanet) return null;

                  const signChange = natalPlanet.sign !== solarPlanet.sign;
                  const houseChange = natalPlanet.house !== solarPlanet.house;

                  return (
                    <div
                      key={planetName}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        signChange || houseChange 
                          ? 'bg-yellow-500/10 border border-yellow-500/20' 
                          : 'bg-slate-900/50 border border-purple-500/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{natalPlanet.symbol}</span>
                        <span className="text-slate-200">{planetName}</span>
                        {(signChange || houseChange) && (
                          <span className="text-xs text-yellow-400">*</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-right">
                          <div className="text-slate-400 text-xs">Natal</div>
                          <div className="text-slate-300">
                            {natalPlanet.sign} ({natalPlanet.house}ª casa)
                            {natalPlanet.retrograde && ' R'}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600" />
                        <div className="text-left">
                          <div className="text-slate-400 text-xs">{year}</div>
                          <div className={signChange || houseChange ? 'text-yellow-300' : 'text-purple-300'}>
                            {solarPlanet.sign} ({solarPlanet.house}ª casa)
                            {solarPlanet.retrograde && ' R'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-slate-500 italic">
                * Mudanças em relação ao mapa natal
              </p>
            </div>
          )}

          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg space-y-4">
            <h4 className="text-purple-200 font-medium">
              Interpretação para {year}
            </h4>
            
            <div className="space-y-3 text-sm text-slate-300">
              <div>
                <span className="text-purple-400 font-medium">Ascendente: </span>
                {getAscendantInterpretation(natalAsc, solarReturn.housesPlacidus[0].sign)}
              </div>
              
              <div>
                <span className="text-purple-400 font-medium">Sol na {solarReturn.planets.find(p => p.name === 'Sol')?.house}ª Casa: </span>
                {getSunHouseInterpretation(solarReturn.planets.find(p => p.name === 'Sol')?.house || 1)}
              </div>
              
              <div>
                <span className="text-purple-400 font-medium">Lua em {solarReturn.planets.find(p => p.name === 'Lua')?.sign}: </span>
                {getMoonSignInterpretation(solarReturn.planets.find(p => p.name === 'Lua')?.sign || '')}
              </div>

              {getRetrogradePlanets(solarReturn.planets).length > 0 && (
                <div>
                  <span className="text-purple-400 font-medium">Planetas Retrógrados: </span>
                  {getRetrogradePlanets(solarReturn.planets).map(p => p.name).join(', ')}. 
                  Esses planetas pedem revisão e reflexão sobre suas áreas de influência durante o ano.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all"
            >
              {generatingReport ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando relatório...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Gerar Relatório IA da Revolução Solar
                </>
              )}
            </button>
          </div>

          {solarReport && (
            <div className="space-y-4 mt-6">
              <h4 className="text-lg font-semibold text-purple-200">
                Análise Completa da Revolução Solar {year}
              </h4>
              
              {solarReport.sections.map((section, index) => (
                <div
                  key={index}
                  className="p-4 bg-slate-900/50 border border-purple-500/20 rounded-lg"
                >
                  <h5 className="text-purple-300 font-medium mb-2">{section.title}</h5>
                  <div className="text-sm text-slate-300 whitespace-pre-wrap">
                    {section.content}
                  </div>
                </div>
              ))}

              <button
                onClick={() => setSolarReport(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-purple-500/30 rounded-lg text-slate-300 transition-colors"
              >
                Limpar Relatório
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
