import { NatalChart, ZODIAC_SIGNS } from '@/types';
import { getElementColor } from '@/lib/astrology';

interface HousesTableProps {
  chart: NatalChart;
  system?: 'placidus' | 'whole';
}

export default function HousesTable({ chart, system = 'placidus' }: HousesTableProps) {
  const houses = system === 'placidus' ? chart.housesPlacidus : chart.housesWhole;

  const formatDegree = (degree: number): string => {
    const d = Math.floor(degree);
    const m = Math.floor((degree - d) * 60);
    return `${d}°${m.toString().padStart(2, '0')}'`;
  };

  const getElementFromSign = (sign: string): 'fire' | 'earth' | 'air' | 'water' => {
    const signData = ZODIAC_SIGNS.find(s => s.name === sign);
    return signData?.element || 'fire';
  };

  const houseMeanings: Record<number, string> = {
    1: 'Personalidade, aparência',
    2: 'Finanças, valores',
    3: 'Comunicação, irmãos',
    4: 'Lar, família',
    5: 'Criatividade, romance',
    6: 'Trabalho, saúde',
    7: 'Relacionamentos',
    8: 'Transformação, herança',
    9: 'Filosofia, viagens',
    10: 'Carreira, status',
    11: 'Amizades, causas',
    12: 'Subconsciente, espiritualidade',
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-purple-200">
          Casas Astrológicas
        </h3>
        <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
          {system === 'placidus' ? 'Sistema Placidus' : 'Signos Inteiros'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {houses.map((house) => (
          <div
            key={house.number}
            className="p-4 bg-slate-900/50 border border-purple-500/20 rounded-lg hover:border-purple-500/40 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-purple-300">
                    {house.number}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-400">{houseMeanings[house.number]}</p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium"
                  style={{
                    backgroundColor: `${getElementColor(getElementFromSign(house.sign))}20`,
                    color: getElementColor(getElementFromSign(house.sign)),
                  }}
                >
                  {house.sign}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  {formatDegree(house.degree)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
