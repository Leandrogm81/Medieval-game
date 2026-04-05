import { NatalChart, ZODIAC_SIGNS } from '@/types';
import { getElementColor } from '@/lib/astrology';

interface PlanetTableProps {
  chart: NatalChart;
}

export default function PlanetTable({ chart }: PlanetTableProps) {
  const formatDegree = (degree: number): string => {
    const d = Math.floor(degree);
    const m = Math.floor((degree - d) * 60);
    return `${d}°${m.toString().padStart(2, '0')}'`;
  };

  const getElementFromSign = (sign: string): 'fire' | 'earth' | 'air' | 'water' => {
    const signData = ZODIAC_SIGNS.find(s => s.name === sign);
    return signData?.element || 'fire';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-purple-500/30">
            <th className="text-left py-3 px-4 text-purple-200 font-medium">Planeta</th>
            <th className="text-left py-3 px-4 text-purple-200 font-medium">Signo</th>
            <th className="text-left py-3 px-4 text-purple-200 font-medium">Grau</th>
            <th className="text-left py-3 px-4 text-purple-200 font-medium">Casa</th>
            <th className="text-center py-3 px-4 text-purple-200 font-medium">R</th>
          </tr>
        </thead>
        <tbody>
          {chart.planets.map((planet, index) => (
            <tr
              key={planet.name}
              className={`border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors ${
                index % 2 === 0 ? 'bg-slate-900/30' : ''
              }`}
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{planet.symbol}</span>
                  <span className="text-slate-200">{planet.name}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `${getElementColor(getElementFromSign(planet.sign))}20`,
                    color: getElementColor(getElementFromSign(planet.sign)),
                  }}
                >
                  {planet.sign}
                </span>
              </td>
              <td className="py-3 px-4 text-slate-300">
                {formatDegree(planet.degree)}
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium">
                  {planet.house}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                {planet.retrograde && (
                  <span className="text-red-400 font-bold" title="Retrógrado">
                    R
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
