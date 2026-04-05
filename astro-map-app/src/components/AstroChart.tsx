'use client';

import React, { useState, useEffect, useRef } from 'react';
import { NatalChart, PlanetPosition } from '@/types';
import { ZODIAC_SIGNS, PLANETS } from '@/types';
import { getElementColor } from '@/lib/astrology';

interface AstroChartProps {
  chart: NatalChart;
  onChartReady?: (svgElement: SVGSVGElement | null) => void;
}

export default function AstroChart({ chart, onChartReady }: AstroChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [showAspects, setShowAspects] = useState(true);

  // ResizeObserver for responsiveness
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const size = Math.min(width, height, 800);
      setDimensions({ width: size, height: size });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Notify parent when chart is ready
  useEffect(() => {
    if (svgRef.current && onChartReady) {
      onChartReady(svgRef.current);
    }
  }, [onChartReady]);

  const { width, height } = dimensions;
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.min(width, height) / 2 - 20;
  const innerRadius = outerRadius * 0.35;
  const houseRadius = outerRadius * 0.75;
  const scale = width / 500; // Scale factor for font sizes

  // Converter longitude eclíptica para ângulo SVG
  const longitudeToAngle = (longitude: number): number => {
    return (longitude - 90) * (Math.PI / 180);
  };

  // Gerar fatias do zodíaco
  const zodiacSlices = ZODIAC_SIGNS.map((sign, index) => {
    const startAngle = longitudeToAngle(sign.start);
    const endAngle = longitudeToAngle((sign.start + 30) % 360);
    
    const x1 = centerX + outerRadius * Math.cos(startAngle);
    const y1 = centerY + outerRadius * Math.sin(startAngle);
    const x2 = centerX + outerRadius * Math.cos(endAngle);
    const y2 = centerY + outerRadius * Math.sin(endAngle);

    return (
      <g key={sign.name}>
        <path
          d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2} Z`}
          fill={`${getElementColor(sign.element)}15`}
          stroke={getElementColor(sign.element)}
          strokeWidth="0.5"
          className="transition-all duration-300"
        />
        {/* Símbolo do signo - maior */}
        <text
          x={centerX + (outerRadius - 28 * scale) * Math.cos((startAngle + endAngle) / 2)}
          y={centerY + (outerRadius - 28 * scale) * Math.sin((startAngle + endAngle) / 2)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={getElementColor(sign.element)}
          fontSize={20 * scale}
          fontWeight="bold"
          className="select-none"
        >
          {sign.symbol}
        </text>
      </g>
    );
  });

  // Gerar linhas de casas com números
  const houseLines = chart.housesPlacidus.map((house, index) => {
    const angle = longitudeToAngle(house.longitude);
    const x = centerX + houseRadius * Math.cos(angle);
    const y = centerY + houseRadius * Math.sin(angle);

    const isAscendant = house.number === 1;
    const isMC = house.number === 10;

    return (
      <g key={house.number}>
        <line
          x1={centerX}
          y1={centerY}
          x2={x}
          y2={y}
          stroke={isAscendant ? '#fbbf24' : isMC ? '#22c55e' : '#7c3aed'}
          strokeWidth={isAscendant ? 2 : 1}
          opacity={isAscendant ? 1 : isMC ? 0.8 : 0.4}
        />
        {/* Número da casa */}
        <text
          x={centerX + (houseRadius + 15 * scale) * Math.cos(angle)}
          y={centerY + (houseRadius + 15 * scale) * Math.sin(angle)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isAscendant ? '#fbbf24' : isMC ? '#22c55e' : '#94a3b8'}
          fontSize={12 * scale}
          fontWeight={isAscendant || isMC ? 'bold' : 'normal'}
        >
          {house.number}
        </text>
      </g>
    );
  });

  // Posicionar planetas evitando sobreposição
  const planetPositions: { planet: PlanetPosition; x: number; y: number }[] = [];
  
  chart.planets.forEach((planet) => {
    const angle = longitudeToAngle(planet.longitude);
    
    // Distribuir planetas em diferentes raios para evitar sobreposição
    let planetRadius = innerRadius + 10;
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
        if (dist < 20 * scale) {
          overlap = true;
          planetRadius += 15;
          break;
        }
      }
      attempts++;
    }
    
    planetPositions.push({ 
      planet, 
      x: centerX + planetRadius * Math.cos(angle), 
      y: centerY + planetRadius * Math.sin(angle) 
    });
  });

  // Filtrar aspectos conectados ao planeta selecionado/hover
  const filteredAspects = chart.aspects.filter(aspect => {
    if (!hoveredPlanet && !selectedPlanet) return true;
    const focus = selectedPlanet || hoveredPlanet;
    return aspect.planet1 === focus || aspect.planet2 === focus;
  });

  // Renderizar planetas
  const planetElements = planetPositions.map(({ planet, x, y }) => {
    const isHovered = hoveredPlanet === planet.name;
    const isSelected = selectedPlanet === planet.name;
    const isFocused = isHovered || isSelected;
    const planetInfo = PLANETS.find(p => p.name === planet.name);

    return (
      <g
        key={planet.name}
        transform={`translate(${x}, ${y})`}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredPlanet(planet.name)}
        onMouseLeave={() => setHoveredPlanet(null)}
        onClick={() => setSelectedPlanet(selectedPlanet === planet.name ? null : planet.name)}
      >
        {/* Glow effect when hovered/selected */}
        {isFocused && (
          <circle
            r={18 * scale}
            fill="none"
            stroke="#fbbf24"
            strokeWidth={2}
            opacity={0.5}
          />
        )}
        
        {/* Planet circle */}
        <circle
          r={isFocused ? 14 : 12}
          fill="#1e293b"
          stroke={planet.retrograde ? '#ef4444' : '#fbbf24'}
          strokeWidth={isFocused ? 3 : 2}
          className="transition-all duration-200"
        />
        
        {/* Planet symbol */}
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fbbf24"
          fontSize={14 * scale}
          fontWeight="bold"
          className="select-none"
        >
          {planetInfo?.symbol || '●'}
        </text>
        
        {/* Retrograde indicator */}
        {planet.retrograde && (
          <text
            x={8 * scale}
            y={-8 * scale}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ef4444"
            fontSize={10 * scale}
            fontWeight="bold"
          >
            R
          </text>
        )}
        
        {/* Tooltip */}
        {isHovered && !isSelected && (
          <g transform={`translate(${x > centerX ? -160 : 20}, -40)`}>
            <rect
              x="0"
              y="0"
              width="150"
              height="70"
              rx="6"
              fill="#0f172a"
              stroke="#7c3aed"
              strokeWidth="1"
            />
            <text x="75" y="18" textAnchor="middle" fill="#e2e8f0" fontSize={13} fontWeight="bold">
              {planet.name}
            </text>
            <text x="75" y="35" textAnchor="middle" fill="#94a3b8" fontSize={11}>
              {planet.sign} {Math.floor(planet.degree)}°{Math.floor((planet.degree % 1) * 60)}'
            </text>
            <text x="75" y="50" textAnchor="middle" fill="#94a3b8" fontSize={11}>
              Casa {planet.house}
            </text>
            <text x="75" y="63" textAnchor="middle" fill="#94a3b8" fontSize={10}>
              {planet.retrograde ? 'Retrógrado • Direto em breve' : 'Direto'}
            </text>
          </g>
        )}
      </g>
    );
  });

  // Linhas de aspectos
  const aspectLines = showAspects ? filteredAspects.slice(0, 15).map((aspect, index) => {
    const p1 = planetPositions.find(pp => pp.planet.name === aspect.planet1);
    const p2 = planetPositions.find(pp => pp.planet.name === aspect.planet2);
    
    if (!p1 || !p2) return null;

    const isFocused = hoveredPlanet || selectedPlanet;

    let strokeColor = '#64748b';
    switch (aspect.type) {
      case 'conjunction':
        strokeColor = '#fbbf24';
        break;
      case 'trine':
        strokeColor = '#22c55e';
        break;
      case 'square':
        strokeColor = '#ef4444';
        break;
      case 'opposition':
        strokeColor = '#f97316';
        break;
      case 'sextile':
        strokeColor = '#3b82f6';
        break;
    }

    return (
      <line
        key={`${aspect.planet1}-${aspect.planet2}-${index}`}
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={strokeColor}
        strokeWidth={isFocused ? 2 : 1}
        opacity={isFocused ? 0.8 : 0.3}
        strokeDasharray={aspect.type === 'opposition' ? '5,3' : undefined}
      />
    );
  }) : [];

  // Get Sun sign for center
  const sunSign = chart.planets.find(p => p.name === 'Sol')?.sign || '';
  const sunSymbol = ZODIAC_SIGNS.find(s => s.name === sunSign)?.symbol || '☉';

  return (
    <div ref={containerRef} className="w-full aspect-square max-w-[800px] mx-auto">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
      >
        {/* Fundo */}
        <circle
          cx={centerX}
          cy={centerY}
          r={outerRadius}
          fill="#0f172a"
          stroke="#7c3aed"
          strokeWidth="2"
        />

        {/* Fatias do zodíaco */}
        {zodiacSlices}

        {/* Círculo das casas */}
        <circle
          cx={centerX}
          cy={centerY}
          r={houseRadius}
          fill="none"
          stroke="#7c3aed"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Linhas de casas */}
        {houseLines}

        {/* Linhas de aspectos */}
        {aspectLines}

        {/* Círculo interno */}
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius}
          fill="#1e293b"
          stroke="#7c3aed"
          strokeWidth="1"
          opacity="0.8"
        />

        {/* Planetas */}
        {planetElements}

        {/* Centro com símbolo do signo solar */}
        <circle
          cx={centerX}
          cy={centerY}
          r={25 * scale}
          fill="#1e293b"
          stroke="#fbbf24"
          strokeWidth="2"
        />
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fbbf24"
          fontSize={20 * scale}
          className="select-none"
        >
          {sunSymbol}
        </text>
      </svg>

      {/* Controles */}
      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={showAspects}
              onChange={(e) => setShowAspects(e.target.checked)}
              className="w-4 h-4 rounded border-purple-500/30 bg-slate-900 text-purple-600 focus:ring-purple-500/50"
            />
            Mostrar aspectos
          </label>
          
          {selectedPlanet && (
            <button
              onClick={() => setSelectedPlanet(null)}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              Limpar seleção ({selectedPlanet})
            </button>
          )}
        </div>

        {/* Legenda de aspectos */}
        {showAspects && (
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-yellow-400"></span>
              Conjunção
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-green-500"></span>
              Trígono
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-red-500"></span>
              Quadratura
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-orange-500"></span>
              Oposição
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-blue-500"></span>
              Sextil
            </span>
          </div>
        )}

        {/* Legenda de casas */}
        <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 border-2 border-yellow-400 rounded-full"></span>
            Ascendente (Casa 1)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 border-2 border-green-500 rounded-full"></span>
            Meio do Céu (Casa 10)
          </span>
        </div>
      </div>
    </div>
  );
}