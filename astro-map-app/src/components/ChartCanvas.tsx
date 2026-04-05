'use client';

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { NatalChart, PlanetPosition, ZODIAC_SIGNS } from '@/types';

export interface ChartCanvasRef {
  toDataURL: () => string;
}

interface ChartCanvasProps {
  chart: NatalChart;
  size?: number;
}

const ChartCanvas = forwardRef<ChartCanvasRef, ChartCanvasProps>(
  ({ chart, size = 800 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(ref, () => ({
      toDataURL: () => {
        return canvasRef.current?.toDataURL('image/png', 1.0) || '';
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = 2; // Retina quality
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.scale(dpr, dpr);

      const centerX = size / 2;
      const centerY = size / 2;
      const outerRadius = size / 2 - 20;
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

      // Background - white for PDF
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Zodiac slices
      ZODIAC_SIGNS.forEach((sign) => {
        const startAngle = longitudeToAngle(sign.start);
        const endAngle = longitudeToAngle((sign.start + 30) % 360);
        const color = getSignElementColor(sign.name);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = color + '15';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Sign symbol
        const midAngle = (startAngle + endAngle) / 2;
        const symbolX = centerX + (outerRadius - 28) * Math.cos(midAngle);
        const symbolY = centerY + (outerRadius - 28) * Math.sin(midAngle);
        ctx.fillStyle = color;
        ctx.font = 'bold 20px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sign.symbol, symbolX, symbolY);
      });

      // House lines
      chart.housesPlacidus.forEach((house) => {
        const angle = longitudeToAngle(house.longitude);
        const x = centerX + houseRadius * Math.cos(angle);
        const y = centerY + houseRadius * Math.sin(angle);

        const isAscendant = house.number === 1;
        const isMC = house.number === 10;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = isAscendant ? '#fbbf24' : isMC ? '#22c55e' : '#7c3aed';
        ctx.lineWidth = isAscendant ? 2 : 1;
        ctx.globalAlpha = isAscendant ? 1 : isMC ? 0.8 : 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // House number
        const numX = centerX + (houseRadius + 15) * Math.cos(angle);
        const numY = centerY + (houseRadius + 15) * Math.sin(angle);
        ctx.fillStyle = isAscendant ? '#fbbf24' : isMC ? '#22c55e' : '#94a3b8';
        ctx.font = isAscendant || isMC ? 'bold 12px sans-serif' : '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(house.number.toString(), numX, numY);
      });

      // House circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, houseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Aspect lines
      const aspectColors: Record<string, string> = {
        conjunction: '#fbbf24',
        trine: '#22c55e',
        square: '#ef4444',
        opposition: '#f97316',
        sextile: '#3b82f6',
      };

      chart.aspects.slice(0, 15).forEach((aspect) => {
        const p1 = chart.planets.find(p => p.name === aspect.planet1);
        const p2 = chart.planets.find(p => p.name === aspect.planet2);
        if (!p1 || !p2) return;

        const angle1 = longitudeToAngle(p1.longitude);
        const angle2 = longitudeToAngle(p2.longitude);
        const r = innerRadius + 20;

        ctx.beginPath();
        ctx.moveTo(centerX + r * Math.cos(angle1), centerY + r * Math.sin(angle1));
        ctx.lineTo(centerX + r * Math.cos(angle2), centerY + r * Math.sin(angle2));
        ctx.strokeStyle = aspectColors[aspect.type] || '#64748b';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        if (aspect.type === 'opposition') {
          ctx.setLineDash([5, 3]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      });

      // Inner circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.8;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Planets
      const planetPositions: { planet: PlanetPosition; x: number; y: number }[] = [];

      chart.planets.forEach((planet) => {
        const angle = longitudeToAngle(planet.longitude);
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
            if (dist < 20) {
              overlap = true;
              planetRadius += 15;
              break;
            }
          }
          attempts++;
        }

        const x = centerX + planetRadius * Math.cos(angle);
        const y = centerY + planetRadius * Math.sin(angle);
        planetPositions.push({ planet, x, y });

        // Planet circle
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = planet.retrograde ? '#ef4444' : '#fbbf24';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Planet symbol
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 14px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(planet.symbol, x, y);

        // Retrograde indicator
        if (planet.retrograde) {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('R', x + 8, y - 8);
        }
      });

      // Center circle with Sun sign
      const sunPlanet = chart.planets.find(p => p.name === 'Sol');
      const sunSign = sunPlanet?.sign || '';
      const sunSymbol = ZODIAC_SIGNS.find(s => s.name === sunSign)?.symbol || '☉';

      ctx.beginPath();
      ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sunSymbol, centerX, centerY);

    }, [chart, size]);

    return (
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    );
  }
);

ChartCanvas.displayName = 'ChartCanvas';

export default ChartCanvas;