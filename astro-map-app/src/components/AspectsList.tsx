import { NatalChart, Aspect } from '@/types';

interface AspectsListProps {
  chart: NatalChart;
}

export default function AspectsList({ chart }: AspectsListProps) {
  const getAspectColor = (type: Aspect['type']): string => {
    switch (type) {
      case 'conjunction':
        return '#fbbf24'; // amarelo
      case 'sextile':
        return '#3b82f6'; // azul
      case 'square':
        return '#ef4444'; // vermelho
      case 'trine':
        return '#22c55e'; // verde
      case 'opposition':
        return '#f97316'; // laranja
      default:
        return '#64748b'; // cinza
    }
  };

  const getAspectSymbol = (type: Aspect['type']): string => {
    switch (type) {
      case 'conjunction':
        return '☌';
      case 'sextile':
        return '⚹';
      case 'square':
        return '□';
      case 'trine':
        return '△';
      case 'opposition':
        return '☍';
      case 'semisextile':
        return '⚺';
      case 'semisquare':
        return '∠';
      case 'sesquiquadrate':
        return '⚼';
      case 'quincunx':
        return '⚻';
      default:
        return '◦';
    }
  };

  const getAspectName = (type: Aspect['type']): string => {
    const names: Record<string, string> = {
      'conjunction': 'Conjunção',
      'sextile': 'Sextil',
      'square': 'Quadratura',
      'trine': 'Trígono',
      'opposition': 'Oposição',
      'semisextile': 'Semisextil',
      'semisquare': 'Semiquadratura',
      'sesquiquadrate': 'Sesquiquadratura',
      'quincunx': 'Quincúncio',
    };
    return names[type] || type;
  };

  // Filtrar apenas aspectos principais
  const majorAspects = chart.aspects.filter(a =>
    ['conjunction', 'sextile', 'square', 'trine', 'opposition'].includes(a.type)
  ).slice(0, 15);

  return (
    <div>
      <h3 className="text-lg font-medium text-purple-200 mb-4">
        Aspectos Principais
      </h3>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {majorAspects.length === 0 ? (
          <p className="text-slate-400 text-center py-8">
            Nenhum aspecto principal encontrado
          </p>
        ) : (
          majorAspects.map((aspect, index) => (
            <div
              key={`${aspect.planet1}-${aspect.planet2}-${index}`}
              className="flex items-center justify-between p-3 bg-slate-900/50 border border-purple-500/10 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-300 min-w-[80px]">
                  {aspect.planet1}
                </span>

                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800"
                  style={{ color: getAspectColor(aspect.type) }}
                  title={getAspectName(aspect.type)}
                >
                  <span className="text-lg">{getAspectSymbol(aspect.type)}</span>
                </div>

                <span className="text-sm text-slate-300 min-w-[80px]">
                  {aspect.planet2}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span
                  className="px-2 py-1 rounded"
                  style={{
                    backgroundColor: `${getAspectColor(aspect.type)}20`,
                    color: getAspectColor(aspect.type),
                  }}
                >
                  {getAspectName(aspect.type)}
                </span>

                <span className="text-slate-500">
                  {aspect.angle.toFixed(1)}°
                </span>

                <span
                  className={`px-2 py-1 rounded ${
                    aspect.orb <= 3
                      ? 'bg-green-500/20 text-green-400'
                      : aspect.orb <= 6
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  órbita: {aspect.orb.toFixed(1)}°
                </span>

                <span className="text-slate-500">
                  {aspect.applying ? 'aplicando' : 'separando'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Legenda */}
      <div className="mt-6 grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fbbf24' }}></span>
          <span className="text-slate-400">Conjunção (0°)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }}></span>
          <span className="text-slate-400">Sextil (60°)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }}></span>
          <span className="text-slate-400">Quadratura (90°)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }}></span>
          <span className="text-slate-400">Trígono (120°)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f97316' }}></span>
          <span className="text-slate-400">Oposição (180°)</span>
        </div>
      </div>
    </div>
  );
}
