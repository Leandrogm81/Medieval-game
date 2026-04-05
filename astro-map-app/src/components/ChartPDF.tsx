import React from 'react';
import { Svg, Circle, Line, Text, G, Path } from '@react-pdf/renderer';
import { NatalChart, PlanetPosition, ZODIAC_SIGNS } from '@/types';

interface ChartPDFProps {
  chart: NatalChart;
  size?: number;
}

export default function ChartPDF({ chart, size = 300 }: ChartPDFProps) {
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size / 2 - 15;
  const innerRadius = outerRadius * 0.35;
  const houseRadius = outerRadius * 0.75;

  // Helper functions
  const longitudeToAngle = (lon: number) => (lon - 90) * (Math.PI / 180);
  
  const getSignElementColor = (sign: string): string => {
    const signData = ZODIAC_SIGNS.find(s => s.name === sign);
    switch (signData?.element) {
      case 'fire': return '#ef4444';
      case 'earth': return '#22c55e';
      case 'air': return '#3b82f6';
      case 'water': return '#06b6d4';
      default: return '#94a3b8';
    }
  };

  // Calculate planet positions avoiding overlap
  const planetPositions: { planet: PlanetPosition; x: number; y: number }[] = [];
  chart.planets.forEach((planet) => {
    const angle = longitudeToAngle(planet.longitude);
    let planetRadius = innerRadius + 5;
    let attempts = 0;
    let overlap = true;

    while (overlap && attempts < 10) {
      overlap = false;
      const x = centerX + planetRadius * Math.cos(angle);
      const y = centerY + planetRadius * Math.sin(angle);

      for (const pos of planetPositions) {
        const dx = pos.x - x;
        const dy = pos.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 15) {
          overlap = true;
          planetRadius += 10;
          break;
        }
      }
      attempts++;
    }

    planetPositions.push({
      planet,
      x: centerX + planetRadius * Math.cos(angle),
      y: centerY + planetRadius * Math.sin(angle),
    });
  });

  // Get Sun symbol
  const sunPlanet = chart.planets.find(p => p.name === 'Sol');
  const sunSign = sunPlanet?.sign || '';
  const sunSymbol = ZODIAC_SIGNS.find(s => s.name === sunSign)?.symbol || '☉';

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background - white for PDF */}
      <Circle cx={centerX} cy={centerY} r={outerRadius} fill="#ffffff" stroke="#7c3aed" strokeWidth="2" />

      {/* Zodiac slices */}
      {ZODIAC_SIGNS.map((sign, index) => {
        const startAngle = longitudeToAngle(sign.start);
        const endAngle = longitudeToAngle((sign.start + 30) % 360);
        const color = getSignElementColor(sign.name);

        // Create arc path for the slice
        const x1 = centerX + outerRadius * Math.cos(startAngle);
        const y1 = centerY + outerRadius * Math.sin(startAngle);
        const x2 = centerX + outerRadius * Math.cos(endAngle);
        const y2 = centerY + outerRadius * Math.sin(endAngle);
        const largeArcFlag = 0;

        const pathD = `M ${centerX} ${centerY} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

        return (
          <G key={index}>
            <Path d={pathD} fill={`${color}15`} stroke={color} strokeWidth="0.5" />
            {/* Sign symbol */}
            <Text
              x={centerX + (outerRadius - 18) * Math.cos((startAngle + endAngle) / 2)}
              y={centerY + (outerRadius - 18) * Math.sin((startAngle + endAngle) / 2) + 4}
              style={{ fontSize: 10, textAlign: 'center', fill: color }}
            >
              {sign.symbol}
            </Text>
          </G>
        );
      })}

      {/* House lines */}
      {chart.housesPlacidus.map((house) => {
        const angle = longitudeToAngle(house.longitude);
        const x = centerX + houseRadius * Math.cos(angle);
        const y = centerY + houseRadius * Math.sin(angle);

        const isAscendant = house.number === 1;
        const isMC = house.number === 10;
        const strokeColor = isAscendant ? '#fbbf24' : isMC ? '#22c55e' : '#7c3aed';
        const strokeWidth = isAscendant ? 2 : 1;

        return (
          <G key={house.number}>
            <Line
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeOpacity={isAscendant ? 1 : isMC ? 0.8 : 0.4}
            />
            {/* House number */}
            <Text
              x={centerX + (houseRadius + 10) * Math.cos(angle)}
              y={centerY + (houseRadius + 10) * Math.sin(angle) + 3}
              style={{
                fontSize: 6,
                textAlign: 'center',
                fill: strokeColor,
                fontWeight: isAscendant || isMC ? 'bold' : 'normal',
              }}
            >
              {house.number}
            </Text>
          </G>
        );
      })}

      {/* House circle */}
      <Circle
        cx={centerX}
        cy={centerY}
        r={houseRadius}
        fill="none"
        stroke="#7c3aed"
        strokeWidth="1"
        strokeOpacity="0.3"
      />

      {/* Aspect lines */}
      {chart.aspects.slice(0, 15).map((aspect, index) => {
        const p1 = chart.planets.find(p => p.name === aspect.planet1);
        const p2 = chart.planets.find(p => p.name === aspect.planet2);
        if (!p1 || !p2) return null;

        const angle1 = longitudeToAngle(p1.longitude);
        const angle2 = longitudeToAngle(p2.longitude);
        const r = innerRadius + 10;

        const aspectColors: Record<string, string> = {
          conjunction: '#fbbf24',
          trine: '#22c55e',
          square: '#ef4444',
          opposition: '#f97316',
          sextile: '#3b82f6',
        };

        return (
          <Line
            key={index}
            x1={centerX + r * Math.cos(angle1)}
            y1={centerY + r * Math.sin(angle1)}
            x2={centerX + r * Math.cos(angle2)}
            y2={centerY + r * Math.sin(angle2)}
            stroke={aspectColors[aspect.type] || '#64748b'}
            strokeWidth="1"
            strokeOpacity="0.3"
          />
        );
      })}

      {/* Inner circle */}
      <Circle
        cx={centerX}
        cy={centerY}
        r={innerRadius}
        fill="#f8fafc"
        stroke="#7c3aed"
        strokeWidth="1"
        strokeOpacity="0.8"
      />

      {/* Planets */}
      {planetPositions.map(({ planet, x, y }) => (
        <G key={planet.name}>
          <Circle
            cx={x}
            cy={y}
            r={8}
            fill="#f8fafc"
            stroke={planet.retrograde ? '#ef4444' : '#fbbf24'}
            strokeWidth="1.5"
          />
          <Text
            x={x}
            y={y + 3}
            style={{
              fontSize: 8,
              textAlign: 'center',
              fill: '#1e293b',
              fontWeight: 'bold',
            }}
          >
            {planet.symbol}
          </Text>
          {planet.retrograde && (
            <Text
              x={x + 6}
              y={y - 5}
              style={{ fontSize: 5, fill: '#ef4444', fontWeight: 'bold' }}
            >
              R
            </Text>
          )}
        </G>
      ))}

      {/* Center circle with Sun sign */}
      <Circle cx={centerX} cy={centerY} r={15} fill="#f8fafc" stroke="#fbbf24" strokeWidth="1.5" />
      <Text
        x={centerX}
        y={centerY + 4}
        style={{ fontSize: 12, textAlign: 'center', fill: '#1e293b' }}
      >
        {sunSymbol}
      </Text>
    </Svg>
  );
}
