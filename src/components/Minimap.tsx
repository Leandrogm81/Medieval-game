import React, { memo, useMemo, useRef } from 'react';
import { GameState } from '../types';

interface MinimapProps {
  gameState: GameState;
  panOffset: { x: number; y: number };
  zoom: number;
  viewportSize: { width: number; height: number };
  onNavigate: (x: number, y: number) => void;
}

const MAP_WIDTH = 1280;
const MAP_HEIGHT = 720;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function MinimapComponent({ gameState, panOffset, zoom, viewportSize, onNavigate }: MinimapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const provinces = useMemo(() => Object.values(gameState.provinces), [gameState.provinces]);

  const viewport = useMemo(() => {
    const width = Math.max(4, Math.min(MAP_WIDTH, viewportSize.width / Math.max(0.1, zoom)));
    const height = Math.max(4, Math.min(MAP_HEIGHT, viewportSize.height / Math.max(0.1, zoom)));
    const x = clamp((-panOffset.x) / Math.max(0.1, zoom), 0, Math.max(0, MAP_WIDTH - width));
    const y = clamp((-panOffset.y) / Math.max(0.1, zoom), 0, Math.max(0, MAP_HEIGHT - height));
    return { x, y, width, height };
  }, [panOffset.x, panOffset.y, viewportSize.height, viewportSize.width, zoom]);

  const getPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    return {
      x: ((clientX - rect.left) / rect.width) * MAP_WIDTH,
      y: ((clientY - rect.top) / rect.height) * MAP_HEIGHT
    };
  };

  const handleNavigate = (clientX: number, clientY: number) => {
    const point = getPoint(clientX, clientY);
    if (!point) return;
    onNavigate(point.x, point.y);
  };

  return (
    <div
      className="absolute bottom-4 left-4 z-20 rounded-sm border border-amber-900/30 bg-black/60 shadow-2xl backdrop-blur-sm overflow-hidden max-md:w-[100px] max-md:h-[70px]"
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="block w-[150px] h-[100px] max-md:w-[100px] max-md:h-[70px] cursor-pointer"
        preserveAspectRatio="xMidYMid slice"
        onClick={(e) => {
          e.stopPropagation();
          handleNavigate(e.clientX, e.clientY);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const touch = e.changedTouches[0];
          if (touch) handleNavigate(touch.clientX, touch.clientY);
        }}
      >
        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="rgba(8, 11, 20, 0.95)" />
        {provinces.map(prov => {
          const owner = gameState.realms[prov.ownerId];
          const fill = prov.ownerId === 'neutral' ? '#475569' : owner?.color || '#475569';
          return (
            <path
              key={prov.id}
              d={`M ${prov.polygon.map(p => p.join(',')).join(' L ')} Z`}
              fill={fill}
              stroke="rgba(15, 23, 42, 0.9)"
              strokeWidth={2}
              opacity={0.95}
            />
          );
        })}
        <rect
          x={viewport.x}
          y={viewport.y}
          width={viewport.width}
          height={viewport.height}
          fill="white"
          fillOpacity={0.2}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={2}
          pointerEvents="none"
        />
      </svg>
    </div>
  );
}

export const Minimap = memo(MinimapComponent);
