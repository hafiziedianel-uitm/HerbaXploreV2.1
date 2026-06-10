"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceArea,
  AreaChart,
  Area
} from 'recharts';
import Image from 'next/image';
import { Wifi, AlertCircle, Database, ExternalLink, Network, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface Peak {
  x: number;
  y: number;
}

interface NmrPeakDef {
  shift: number;
  intensity: number;
  split: string;
  j?: number;
}

interface NmrTableEntry {
  atom: string;
  shift: string;
  coupling: string;
}

interface ApiConnection {
  status: string;
  latencyMs: number;
  endpointUsed: string;
  predictorEndpoint?: string;
  lastAttemptUtc: string;
  details?: any;
}

interface ApiResponse {
  compoundId: string;
  compoundName: string;
  chemicalFormula: string;
  molecularWeight: string;
  massSpecSource: string;
  massSpecType: string;
  massSpecPeaks: Peak[];
  nmrSource: string;
  nmrType: string;
  nmrPeaks: NmrPeakDef[];
  nmrTable: NmrTableEntry[];
  cnmrSource?: string;
  cnmrType?: string;
  cnmrPeaks?: NmrPeakDef[];
  cnmrTable?: NmrTableEntry[];
  smiles?: string;
  apiConnection?: ApiConnection;
}

interface MassSpectrumChartProps {
  compoundName: string;
}

// Reusable hook for fetching compound spectral data from NMRShiftDB dynamic REST proxy
function useCompoundSpectra(compoundName: string) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    async function fetchData() {
      try {
        const response = await fetch(`/api/nmrshiftdb?compound=${encodeURIComponent(compoundName)}`);
        if (!response.ok) {
          throw new Error(`Endpoint returned status ${response.status}`);
        }
        const json = await response.json();
        if (active) {
          setData(json);
        }
      } catch (err: any) {
        console.error("Error fetching compound spectra from proxy API:", err);
        if (active) {
          setError(err.message || "Failed to load spectra data.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      active = false;
    };
  }, [compoundName]);

  return { data, loading, error };
}

export function MassSpectrumChart({ compoundName }: MassSpectrumChartProps) {
  const { data: spec, loading, error } = useCompoundSpectra(compoundName);

  // Compute mass spectrograph lines during render phase using hook memoization (prevents ESLint side-effect alerts)
  const chartPoints = useMemo<Peak[]>(() => {
    if (!spec) return [];

    try {
      const points: Peak[] = [];
      const mwInt = Math.ceil(parseFloat(spec.molecularWeight.replace(/[^0-9.]/g, '')) || 200);
      
      const peakVals = spec.massSpecPeaks.map(p => p.x);
      const minX = peakVals.length > 0 ? Math.max(10, Math.min(...peakVals) - 10) : 10;
      const maxX = peakVals.length > 0 ? Math.max(mwInt + 20, ...peakVals) + 15 : mwInt + 20;

      points.push({ x: minX, y: 0 });
      spec.massSpecPeaks.forEach(p => {
        points.push({ x: p.x, y: p.y });
      });
      points.push({ x: maxX, y: 0 });

      points.sort((a, b) => a.x - b.x);
      return points;
    } catch (e) {
      console.error("Error parsing mass specs:", e);
      return [];
    }
  }, [spec]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-emerald-500 bg-stone-100/30 dark:bg-stone-900/10 min-h-[220px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2"></div>
        <span className="text-xs font-mono text-stone-500">Querying MoNA Database...</span>
      </div>
    );
  }

  if (error || !spec) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 p-4 text-center min-h-[220px]">
        <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
        <span className="text-sm font-semibold">Mass Spec Sync Unsuccessful</span>
        <span className="text-xs text-stone-400 mt-1">Check internet connectivity to fetch MoNA targets.</span>
      </div>
    );
  }

  const isConnected = spec.apiConnection?.status === 'connected';

  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="flex justify-between items-center text-xs text-stone-500 mb-2 px-3 pt-1">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-semibold text-stone-700 dark:text-stone-300">{spec.massSpecSource}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-1.5 py-0.5 rounded text-[10px]">{spec.massSpecType}</span>
          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium ${isConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-400'}`}>
            <Wifi className="w-2.5 h-2.5 mr-1 animate-pulse" />
            {isConnected ? 'Sync Real' : 'Local Cache'}
          </span>
        </div>
      </div>
      
      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartPoints} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" opacity={0.1} />
            <XAxis 
              dataKey="x" 
              type="number"
              domain={['auto', 'auto']}
              name="m/z"
              label={{ value: 'm/z', position: 'bottom', fill: '#888', style: { fontSize: '10px' } }}
              stroke="#888"
              tick={{ fill: '#888', fontSize: '9px' }}
            />
            <YAxis 
              label={{ value: 'Relative Abundance (%)', angle: -90, position: 'insideLeft', fill: '#888', style: { fontSize: '10px', textAnchor: 'middle' } }} 
              stroke="#888"
              tick={{ fill: '#888', fontSize: '9px' }}
              domain={[0, 100]}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(16, 185, 129, 0.05)', strokeWidth: 1 }}
              contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #444', color: '#fff', fontSize: '11px', borderRadius: '8px' }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Abundance']}
              labelFormatter={(label) => `m/z: ${label}`}
            />
            <Bar dataKey="y" fill="#10b981" barSize={3} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function NMRSpectrumChart({ compoundName, onClick }: MassSpectrumChartProps & { onClick?: () => void }) {
  const { data: spec, loading, error } = useCompoundSpectra(compoundName);

  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null);
  const dragDetected = React.useRef(false);

  // Compute 1H HNMR Lorentzian distribution during render phase
  const chartPoints = useMemo<Peak[]>(() => {
    if (!spec) return [];

    try {
      const points: Peak[] = [];
      const peaks = spec.nmrPeaks || [];
      
      const shifts = peaks.map(p => p.shift);
      const maxShift = shifts.length > 0 ? Math.min(14.0, Math.max(...shifts) + 1.5) : 10.0;
      const minShift = shifts.length > 0 ? Math.max(-0.5, Math.min(...shifts) - 1.0) : 0.0;

      for (let ppm = maxShift; ppm >= minShift; ppm -= 0.015) {
        // Pure deterministic pseudo-noise using a fast sine wave hash (pure rendering rule)
        let intensity = Math.abs(Math.sin(ppm * 10000)) * 0.08;

        peaks.forEach(peak => {
          const shift = peak.shift;
          const h = peak.intensity;
          const jHz = peak.j || 7.5;
          
          const splitPpm = jHz * 0.0025; 
          const peakWidth = 0.010;

          const addBell = (center: number, height: number) => {
            const diff = ppm - center;
            return height * Math.exp(-(diff * diff) / (2 * peakWidth * peakWidth));
          };

          switch (peak.split) {
            case 's':
              intensity += addBell(shift, h);
              break;
            case 'd':
              intensity += addBell(shift - splitPpm / 2, h / 2);
              intensity += addBell(shift + splitPpm / 2, h / 2);
              break;
            case 't':
              intensity += addBell(shift - splitPpm, h / 4);
              intensity += addBell(shift, h / 2);
              intensity += addBell(shift + splitPpm, h / 4);
              break;
            case 'q':
              intensity += addBell(shift - 1.5 * splitPpm, h / 8);
              intensity += addBell(shift - 0.5 * splitPpm, 3 * h / 8);
              intensity += addBell(shift + 0.5 * splitPpm, 3 * h / 8);
              intensity += addBell(shift + 1.5 * splitPpm, h / 8);
              break;
            case 'dd':
              const s1 = splitPpm / 2;
              const s2 = splitPpm * 0.4;
              intensity += addBell(shift - s1 - s2, h / 4);
              intensity += addBell(shift - s1 + s2, h / 4);
              intensity += addBell(shift + s1 - s2, h / 4);
              intensity += addBell(shift + s1 + s2, h / 4);
              break;
            case 'm':
              intensity += addBell(shift - splitPpm, h / 6);
              intensity += addBell(shift - 0.5 * splitPpm, h / 4);
              intensity += addBell(shift, h / 3);
              intensity += addBell(shift + 0.5 * splitPpm, h / 4);
              intensity += addBell(shift + splitPpm, h / 6);
              break;
            default:
              intensity += addBell(shift, h);
          }
        });

        points.push({ x: parseFloat(ppm.toFixed(3)), y: intensity });
      }
      return points;
    } catch (e) {
      console.error("Error drawing Lorentzian lines:", e);
      return [];
    }
  }, [spec]);

  const { defaultMin, defaultMax } = useMemo(() => {
    if (chartPoints.length === 0) return { defaultMin: 0, defaultMax: 10 };
    const maxVal = chartPoints[0].x;
    const minVal = chartPoints[chartPoints.length - 1].x;
    return { defaultMin: minVal, defaultMax: maxVal };
  }, [chartPoints]);

  const handleMouseDown = (e: any) => {
    if (e && e.activeLabel !== undefined && e.activeLabel !== null) {
      setRefAreaLeft(parseFloat(e.activeLabel));
      dragDetected.current = false;
    }
  };

  const handleMouseMove = (e: any) => {
    if (refAreaLeft !== null && e && e.activeLabel !== undefined && e.activeLabel !== null) {
      setRefAreaRight(parseFloat(e.activeLabel));
      if (Math.abs(parseFloat(e.activeLabel) - refAreaLeft) > 0.01) {
        dragDetected.current = true;
      }
    }
  };

  const handleMouseUp = () => {
    if (refAreaLeft !== null && refAreaRight !== null) {
      let p1 = refAreaLeft;
      let p2 = refAreaRight;
      if (p1 > p2) {
        const temp = p1;
        p1 = p2;
        p2 = temp;
      }
      if (p2 - p1 > 0.02) {
        setZoomDomain([p1, p2]);
        dragDetected.current = true;
      }
    }
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const handleZoomIncrement = (direction: 'in' | 'out') => {
    const currentMin = zoomDomain ? zoomDomain[0] : defaultMin;
    const currentMax = zoomDomain ? zoomDomain[1] : defaultMax;
    const center = (currentMin + currentMax) / 2;
    const span = currentMax - currentMin;
    
    let newSpan = direction === 'in' ? span * 0.75 : span * 1.33;
    const maxAllowedSpan = defaultMax - defaultMin;
    if (newSpan > maxAllowedSpan) {
      setZoomDomain(null);
      return;
    }
    
    let newMin = center - newSpan / 2;
    let newMax = center + newSpan / 2;
    
    if (newMin < defaultMin) {
      newMin = defaultMin;
      newMax = Math.min(defaultMax, defaultMin + newSpan);
    }
    if (newMax > defaultMax) {
      newMax = defaultMax;
      newMin = Math.max(defaultMin, defaultMax - newSpan);
    }
    
    setZoomDomain([parseFloat(newMin.toFixed(3)), parseFloat(newMax.toFixed(3))]);
    dragDetected.current = true;
  };

  const handlePan = (direction: 'left' | 'right') => {
    const currentMin = zoomDomain ? zoomDomain[0] : defaultMin;
    const currentMax = zoomDomain ? zoomDomain[1] : defaultMax;
    const span = currentMax - currentMin;
    
    const shiftPercent = 0.20;
    const shiftVal = span * shiftPercent;
    
    let newMin = currentMin;
    let newMax = currentMax;
    
    if (direction === 'left') {
      newMin = currentMin + shiftVal;
      newMax = currentMax + shiftVal;
      if (newMax > defaultMax) {
        newMax = defaultMax;
        newMin = defaultMax - span;
      }
    } else {
      newMin = currentMin - shiftVal;
      newMax = currentMax - shiftVal;
      if (newMin < defaultMin) {
        newMin = defaultMin;
        newMax = defaultMin + span;
      }
    }
    
    setZoomDomain([parseFloat(newMin.toFixed(3)), parseFloat(newMax.toFixed(3))]);
    dragDetected.current = true;
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-cyan-500 bg-stone-100/30 dark:bg-stone-900/10 min-h-[220px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-2"></div>
        <span className="text-xs font-mono text-stone-500">Querying NMRShiftDB Live Server...</span>
      </div>
    );
  }

  if (error || !spec) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 p-4 text-center min-h-[220px]">
        <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
        <span className="text-sm font-semibold">NMRShiftDB Sync Unsuccessful</span>
        <span className="text-xs text-stone-400 mt-1">Fallback configuration loaded. Check internet settings.</span>
      </div>
    );
  }

  const isConnected = spec.apiConnection?.status === 'connected';
  const latency = spec.apiConnection?.latencyMs || 0;

  return (
    <div 
      className="w-full h-full flex flex-col group relative" 
      onClick={(e) => {
        if (dragDetected.current) {
          e.stopPropagation();
          dragDetected.current = false;
          return;
        }
        onClick?.();
      }}
    >
      <div className="flex justify-between items-center text-xs text-stone-500 mb-2 px-3 pt-1">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
          <span className="font-semibold text-stone-700 dark:text-stone-300">
            {spec.nmrSource} 
            {isConnected && <span className="text-[10px] font-normal font-mono text-stone-400 ml-1">({latency}ms)</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-1.5 py-0.5 rounded text-[10px]">{spec.nmrType}</span>
          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium ${isConnected ? 'bg-cyan-500/10 text-cyan-500' : 'bg-stone-200 text-stone-600 dark:bg-stone-850 dark:text-stone-400'}`}>
            <Wifi className="w-2.5 h-2.5 mr-1" />
            {isConnected ? 'API Live' : 'Cached Sync'}
          </span>
        </div>
      </div>

      {/* Dynamic interactive zoom toolbar */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-2 px-3 py-1.5 bg-stone-50 dark:bg-stone-900/30 rounded-xl text-[10px] sm:text-[11px] border border-stone-200/50 dark:border-stone-800/50" onClick={(e) => e.stopPropagation()}>
        <span className="font-medium text-stone-550 dark:text-stone-400 flex items-center gap-1">
          <span className="text-cyan-550 dark:text-cyan-400 font-bold">🔍</span>
          {zoomDomain ? (
            <span>
              Zoomed: <strong className="font-mono text-cyan-600 dark:text-cyan-400">{zoomDomain[1].toFixed(2)} - {zoomDomain[0].toFixed(2)}</strong> ppm
            </span>
          ) : (
            <span className="font-mono text-stone-400">💡 Drag a region on spectrum to zoom</span>
          )}
        </span>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePan('left')}
            title="Pan Left (Higher shift)"
            className="px-1.5 py-0.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-805 text-stone-600 dark:text-stone-300 rounded-md transition font-mono"
          >
            ←
          </button>
          <button
            onClick={() => handleZoomIncrement('in')}
            title="Zoom In"
            className="p-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-805 text-stone-600 dark:text-stone-300 rounded-md transition flex items-center justify-center"
          >
            <ZoomIn size={12} />
          </button>
          <button
            onClick={() => handleZoomIncrement('out')}
            title="Zoom Out"
            className="p-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-805 text-stone-600 dark:text-stone-300 rounded-md transition flex items-center justify-center"
          >
            <ZoomOut size={12} />
          </button>
          <button
            onClick={() => handlePan('right')}
            title="Pan Right (Lower shift)"
            className="px-1.5 py-0.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-805 text-stone-600 dark:text-stone-300 rounded-md transition font-mono"
          >
            →
          </button>
          {zoomDomain && (
            <button
              onClick={() => {
                setZoomDomain(null);
                dragDetected.current = true;
              }}
              title="Reset Zoom"
              className="ml-1 px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-md transition flex items-center gap-1 font-bold"
            >
              <RotateCcw size={10} /> Reset
            </button>
          )}
        </div>
      </div>

      <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/5 transition-colors z-10 pointer-events-none rounded-xl"></div>
      
      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartPoints} 
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" opacity={0.1} />
            <XAxis 
              dataKey="x" 
              type="number"
              domain={zoomDomain ? [zoomDomain[0], zoomDomain[1]] : ['dataMax', 'dataMin']} 
              allowDataOverflow={true}
              name="Chemical Shift (ppm)"
              label={{ value: 'Chemical Shift (ppm)', position: 'bottom', fill: '#888', style: { fontSize: '10px' } }}
              stroke="#888"
              tick={{ fill: '#888', fontSize: '9px' }}
              reversed={true}
            />
            <YAxis hide={true} domain={[0, 'dataMax']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #444', color: '#fff', fontSize: '11px', borderRadius: '8px' }}
              formatter={(value: number) => [Math.round(value), 'Rel. Intensity']}
              labelFormatter={(label) => `${label} ppm`}
            />
            <Line 
              type="monotone" 
              dataKey="y" 
              stroke="#06b6d4" 
              strokeWidth={1.5} 
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            {refAreaLeft !== null && refAreaRight !== null && (
              <ReferenceArea 
                x1={refAreaLeft} 
                x2={refAreaRight} 
                strokeOpacity={0.3} 
                fill="#06b6d4" 
                fillOpacity={0.2} 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function NMRDataTable({ compoundName }: { compoundName: string }) {
  const { data: spec, loading, error } = useCompoundSpectra(compoundName);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-8 bg-stone-50 dark:bg-stone-900 rounded-2xl min-h-[140px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500 mr-2"></div>
        <span className="text-xs text-stone-500 font-mono">Loading dynamic structural NMR assignments...</span>
      </div>
    );
  }

  if (error || !spec) {
    return (
      <div className="w-full p-6 text-center text-stone-500 bg-stone-50 dark:bg-stone-900 rounded-2xl">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <span className="text-sm font-semibold">Could not resolve NMR Table schema.</span>
      </div>
    );
  }

  const tableData = spec.nmrTable || [];
  const isConnected = spec.apiConnection?.status === 'connected';

  return (
    <div className="flex flex-col xl:flex-row gap-6 mt-4 w-full">
      {/* Structural mapping card */}
      <div className="flex-1 bg-stone-50 dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-800/80 p-5 flex flex-col items-center justify-between min-h-[280px]">
        <div className="flex justify-between items-center w-full mb-3">
          <h4 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Molecular Specimen</h4>
          {spec.smiles && (
            <span className="text-[9px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-300 px-2 py-0.5 rounded-md truncate max-w-[120px] sm:max-w-xs" title={spec.smiles}>
              {spec.smiles}
            </span>
          )}
        </div>

        <div className="relative w-full h-[180px] flex items-center justify-center bg-white dark:bg-stone-900 rounded-xl p-3 border border-stone-100 dark:border-stone-800/60 shadow-inner">
          <Image 
            src={`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(spec.compoundName)}/PNG?record_type=2d&image_size=large`} 
            alt={`Structure representation of ${spec.compoundName}`}
            fill
            unoptimized
            className="object-contain p-2 mix-blend-multiply dark:mix-blend-screen opacity-90 z-10"
            referrerPolicy="no-referrer"
          />
          {/* Spatial shifts overlays to elevate visual prestige */}
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            {tableData.slice(0, 4).map((entry, idx) => {
              const offsets = [
                { classes: "-translate-x-14 -translate-y-10", bg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30" },
                { classes: "translate-x-12 -translate-y-14", bg: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30" },
                { classes: "translate-x-14 translate-y-8", bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
                { classes: "-translate-x-10 translate-y-14", bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30" },
              ];
              const style = offsets[idx % offsets.length];
              return (
                <span 
                  key={idx} 
                  className={`absolute text-[8px] font-mono font-bold px-1 py-0.5 rounded border backdrop-blur-md transform ${style.classes} ${style.bg}`}
                >
                  {entry.shift}
                </span>
              );
            })}
          </div>
        </div>
        
        {/* API connection summary badge */}
        {spec.apiConnection && (
          <div className="w-full flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 border-t border-stone-200 dark:border-stone-800/80 pt-3 mt-3">
            <span className="flex items-center gap-1">
              <Network className="w-3 h-3 text-cyan-500" />
              API Gateway
            </span>
            <span className="font-mono text-stone-400 max-w-[150px] truncate" title={spec.apiConnection.endpointUsed}>
              Ready ({isConnected ? 'nmrshiftdb.org OK' : 'fallback cache OK'})
            </span>
          </div>
        )}
      </div>
      
      {/* Spectral Assignments Grid */}
      <div className="flex-[2] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-2xl overflow-hidden shadow-sm self-start w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-stone-400 dark:text-stone-500 bg-stone-50 dark:bg-stone-850 uppercase tracking-widest">
              <tr>
                <th scope="col" className="px-4 py-3 font-bold">Hydrogen Environment (Assignment)</th>
                <th scope="col" className="px-4 py-3 font-bold text-right">Chem Shift (ppm)</th>
                <th scope="col" className="px-4 py-3 font-bold text-right">Coupling Multiplicity (Hz)</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length > 0 ? (
                tableData.map((row, idx) => (
                  <tr key={idx} className="border-b border-stone-100 dark:border-stone-800 last:border-0 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-stone-700 dark:text-stone-300">
                      {row.atom}
                    </td>
                    <td className="px-4 py-3.5 text-cyan-600 dark:text-cyan-400 font-mono text-right font-semibold">
                      {row.shift} ppm
                    </td>
                    <td className="px-4 py-3.5 text-stone-500 dark:text-stone-400 font-mono text-right text-xs">
                      {row.coupling}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-stone-400">
                    No assignment entries resolved.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {spec.apiConnection?.predictorEndpoint && (
          <div className="bg-stone-50 dark:bg-stone-850 p-3.5 border-t border-stone-100 dark:border-stone-800 text-center flex flex-col sm:flex-row justify-between items-center gap-1.5 text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-cyan-500" />
              SMILES-keyed Predictor and Search servlets linked
            </span>
            <a 
              href={spec.apiConnection.predictorEndpoint} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
            >
              Verify Direct NMRShiftDB Query <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export function CNMRSpectrumChart({ compoundName, onClick }: MassSpectrumChartProps & { onClick?: () => void }) {
  const { data: spec, loading, error } = useCompoundSpectra(compoundName);

  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null);
  const dragDetected = React.useRef(false);

  // Compute 13C CNMR Lorentzian distribution during render phase
  const chartPoints = useMemo<Peak[]>(() => {
    if (!spec || !spec.cnmrPeaks) return [];

    try {
      const points: Peak[] = [];
      const peaks = spec.cnmrPeaks || [];
      
      const shifts = peaks.map(p => p.shift);
      const maxShift = shifts.length > 0 ? Math.min(220.0, Math.max(...shifts) + 15.0) : 200.0;
      const minShift = shifts.length > 0 ? Math.max(-5.0, Math.min(...shifts) - 10.0) : 0.0;

      // Step by 0.5 ppm for the larger 0-220 spectrum to keep points balanced at ~450 entries
      for (let ppm = maxShift; ppm >= minShift; ppm -= 0.5) {
        let intensity = Math.abs(Math.sin(ppm * 10000)) * 0.05; // background noise

        peaks.forEach(peak => {
          const shift = peak.shift;
          const h = peak.intensity;
          const peakWidth = 0.4; // standard singlet width

          const diff = ppm - shift;
          intensity += h * Math.exp(-(diff * diff) / (2 * peakWidth * peakWidth));
        });

        points.push({ x: parseFloat(ppm.toFixed(1)), y: intensity });
      }
      return points;
    } catch (e) {
      console.error("Error drawing CNMR Lorentzian lines:", e);
      return [];
    }
  }, [spec]);

  const { defaultMin, defaultMax } = useMemo(() => {
    if (chartPoints.length === 0) return { defaultMin: 0, defaultMax: 200 };
    const maxVal = chartPoints[0].x;
    const minVal = chartPoints[chartPoints.length - 1].x;
    return { defaultMin: minVal, defaultMax: maxVal };
  }, [chartPoints]);

  const handleMouseDown = (e: any) => {
    if (e && e.activeLabel !== undefined && e.activeLabel !== null) {
      setRefAreaLeft(parseFloat(e.activeLabel));
      dragDetected.current = false;
    }
  };

  const handleMouseMove = (e: any) => {
    if (refAreaLeft !== null && e && e.activeLabel !== undefined && e.activeLabel !== null) {
      setRefAreaRight(parseFloat(e.activeLabel));
      if (Math.abs(parseFloat(e.activeLabel) - refAreaLeft) > 0.1) {
        dragDetected.current = true;
      }
    }
  };

  const handleMouseUp = () => {
    if (refAreaLeft !== null && refAreaRight !== null) {
      let p1 = refAreaLeft;
      let p2 = refAreaRight;
      if (p1 > p2) {
        const temp = p1;
        p1 = p2;
        p2 = temp;
      }
      if (p2 - p1 > 0.5) {
        setZoomDomain([p1, p2]);
        dragDetected.current = true;
      }
    }
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const handleZoomIncrement = (direction: 'in' | 'out') => {
    const currentMin = zoomDomain ? zoomDomain[0] : defaultMin;
    const currentMax = zoomDomain ? zoomDomain[1] : defaultMax;
    const center = (currentMin + currentMax) / 2;
    const span = currentMax - currentMin;
    
    let newSpan = direction === 'in' ? span * 0.75 : span * 1.33;
    const maxAllowedSpan = defaultMax - defaultMin;
    if (newSpan > maxAllowedSpan) {
      setZoomDomain(null);
      return;
    }
    
    let newMin = center - newSpan / 2;
    let newMax = center + newSpan / 2;
    
    if (newMin < defaultMin) {
      newMin = defaultMin;
      newMax = Math.min(defaultMax, defaultMin + newSpan);
    }
    if (newMax > defaultMax) {
      newMax = defaultMax;
      newMin = Math.max(defaultMin, defaultMax - newSpan);
    }
    
    setZoomDomain([parseFloat(newMin.toFixed(1)), parseFloat(newMax.toFixed(1))]);
    dragDetected.current = true;
  };

  const handlePan = (direction: 'left' | 'right') => {
    const currentMin = zoomDomain ? zoomDomain[0] : defaultMin;
    const currentMax = zoomDomain ? zoomDomain[1] : defaultMax;
    const span = currentMax - currentMin;
    
    const shiftPercent = 0.20;
    const shiftVal = span * shiftPercent;
    
    let newMin = currentMin;
    let newMax = currentMax;
    
    if (direction === 'left') {
      newMin = currentMin + shiftVal;
      newMax = currentMax + shiftVal;
      if (newMax > defaultMax) {
        newMax = defaultMax;
        newMin = defaultMax - span;
      }
    } else {
      newMin = currentMin - shiftVal;
      newMax = currentMax - shiftVal;
      if (newMin < defaultMin) {
        newMin = defaultMin;
        newMax = defaultMin + span;
      }
    }
    
    setZoomDomain([parseFloat(newMin.toFixed(1)), parseFloat(newMax.toFixed(1))]);
    dragDetected.current = true;
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-purple-500 bg-stone-100/30 dark:bg-stone-900/10 min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-2"></div>
        <span className="text-xs font-mono text-stone-500">Querying NMRShiftDB Carbon-13 Server...</span>
      </div>
    );
  }

  if (error || !spec) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 p-4 text-center min-h-[200px]">
        <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
        <span className="text-sm font-semibold">NMRShiftDB CNMR Sync Unsuccessful</span>
        <span className="text-xs text-stone-400 mt-1">Fallback configuration loaded. Check internet settings.</span>
      </div>
    );
  }

  const isConnected = spec.apiConnection?.status === 'connected';
  const latency = spec.apiConnection?.latencyMs || 0;

  return (
    <div 
      className="w-full h-full flex flex-col group relative" 
      onClick={(e) => {
        if (dragDetected.current) {
          e.stopPropagation();
          dragDetected.current = false;
          return;
        }
        onClick?.();
      }}
    >
      <div className="flex justify-between items-center text-xs text-stone-500 mb-2 px-3 pt-1">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
          <span className="font-semibold text-stone-700 dark:text-stone-300">
            {spec.cnmrSource || 'NMRShiftDB'} 
            {isConnected && <span className="text-[10px] font-normal font-mono text-stone-400 ml-1">({latency}ms)</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-1.5 py-0.5 rounded text-[10px]">
            {spec.cnmrType || '13C-NMR (100 MHz, CDCl3)'}
          </span>
          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium ${isConnected ? 'bg-purple-500/10 text-purple-500' : 'bg-stone-200 text-stone-600 dark:bg-stone-850 dark:text-stone-400'}`}>
            <Wifi className="w-2.5 h-2.5 mr-1" />
            {isConnected ? 'API Live' : 'Cached Sync'}
          </span>
        </div>
      </div>

      {/* Dynamic interactive zoom toolbar */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-2 px-3 py-1.5 bg-stone-50 dark:bg-stone-900/30 rounded-xl text-[10px] sm:text-[11px] border border-stone-200/50 dark:border-stone-800/50" onClick={(e) => e.stopPropagation()}>
        <span className="font-medium text-stone-550 dark:text-stone-400 flex items-center gap-1">
          <span className="text-purple-500 font-bold">🔍</span>
          {zoomDomain ? (
            <span>
              Zoomed: <strong className="font-mono text-purple-600 dark:text-purple-400">{zoomDomain[1].toFixed(1)} - {zoomDomain[0].toFixed(1)}</strong> ppm
            </span>
          ) : (
            <span className="font-mono text-stone-400">💡 Drag a region on spectrum to zoom</span>
          )}
        </span>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePan('left')}
            title="Pan Left (Higher shift)"
            className="px-1.5 py-0.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-805 text-stone-600 dark:text-stone-300 rounded-md transition font-mono"
          >
            ←
          </button>
          <button
            onClick={() => handleZoomIncrement('in')}
            title="Zoom In"
            className="p-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-805 text-stone-600 dark:text-stone-300 rounded-md transition flex items-center justify-center"
          >
            <ZoomIn size={12} />
          </button>
          <button
            onClick={() => handleZoomIncrement('out')}
            title="Zoom Out"
            className="p-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-805 text-stone-600 dark:text-stone-300 rounded-md transition flex items-center justify-center"
          >
            <ZoomOut size={12} />
          </button>
          <button
            onClick={() => handlePan('right')}
            title="Pan Right (Lower shift)"
            className="px-1.5 py-0.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-805 text-stone-600 dark:text-stone-300 rounded-md transition font-mono"
          >
            →
          </button>
          {zoomDomain && (
            <button
              onClick={() => {
                setZoomDomain(null);
                dragDetected.current = true;
              }}
              title="Reset Zoom"
              className="ml-1 px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-md transition flex items-center gap-1 font-bold"
            >
              <RotateCcw size={10} /> Reset
            </button>
          )}
        </div>
      </div>

      <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/5 transition-colors z-10 pointer-events-none rounded-xl"></div>
      
      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartPoints} 
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" opacity={0.1} />
            <XAxis 
              dataKey="x" 
              type="number"
              domain={zoomDomain ? [zoomDomain[0], zoomDomain[1]] : ['dataMax', 'dataMin']} 
              allowDataOverflow={true}
              name="Chemical Shift (ppm)"
              label={{ value: 'Chemical Shift (ppm)', position: 'bottom', fill: '#888', style: { fontSize: '10px' } }}
              stroke="#888"
              tick={{ fill: '#888', fontSize: '9px' }}
              reversed={true}
            />
            <YAxis hide={true} domain={[0, 'dataMax']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #444', color: '#fff', fontSize: '11px', borderRadius: '8px' }}
              formatter={(value: number) => [Math.round(value), 'Rel. Intensity']}
              labelFormatter={(label) => `${label} ppm`}
            />
            <Line 
              type="monotone" 
              dataKey="y" 
              stroke="#a855f7" 
              strokeWidth={1.5} 
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            {refAreaLeft !== null && refAreaRight !== null && (
              <ReferenceArea 
                x1={refAreaLeft} 
                x2={refAreaRight} 
                strokeOpacity={0.3} 
                fill="#a855f7" 
                fillOpacity={0.2} 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CNMRDataTable({ compoundName }: { compoundName: string }) {
  const { data: spec, loading, error } = useCompoundSpectra(compoundName);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-8 bg-stone-50 dark:bg-stone-900 rounded-2xl min-h-[140px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mr-2"></div>
        <span className="text-xs text-stone-500 font-mono">Loading dynamic Carbon-13 assignments...</span>
      </div>
    );
  }

  if (error || !spec) {
    return (
      <div className="w-full p-6 text-center text-stone-500 bg-stone-50 dark:bg-stone-900 rounded-2xl">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <span className="text-sm font-semibold">Could not resolve CNMR Table schema.</span>
      </div>
    );
  }

  const tableData = spec.cnmrTable || [];

  return (
    <div className="flex flex-col xl:flex-row gap-6 mt-4 w-full">
      {/* Structural mapping card */}
      <div className="flex-1 bg-stone-50 dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-800/80 p-5 flex flex-col items-center justify-between min-h-[280px]">
        <div className="flex justify-between items-center w-full mb-3">
          <h4 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Carbon Backbone</h4>
          {spec.smiles && (
            <span className="text-[9px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-300 px-2 py-0.5 rounded-md truncate max-w-[120px] sm:max-w-xs" title={spec.smiles}>
              {spec.smiles}
            </span>
          )}
        </div>

        <div className="relative w-full h-[180px] flex items-center justify-center bg-white dark:bg-stone-900 rounded-xl p-3 border border-stone-100 dark:border-stone-800/60 shadow-inner">
          <Image 
            src={`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(spec.compoundName)}/PNG?record_type=2d&image_size=large`} 
            alt={`Structure representation of ${spec.compoundName}`}
            fill
            unoptimized
            className="object-contain p-2 mix-blend-multiply dark:mix-blend-screen opacity-90 z-10"
            referrerPolicy="no-referrer"
          />
          {/* Spatial shifts overlays */}
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            {tableData.slice(0, 4).map((entry, idx) => {
              const offsets = [
                { classes: "-translate-x-12 -translate-y-12", bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30" },
                { classes: "translate-x-14 -translate-y-8", bg: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30" },
                { classes: "translate-x-10 translate-y-14", bg: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30" },
                { classes: "-translate-x-14 translate-y-6", bg: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30" },
              ];
              const style = offsets[idx % offsets.length];
              return (
                <span 
                  key={idx} 
                  className={`absolute text-[8px] font-mono font-bold px-1 py-0.5 rounded border backdrop-blur-md transform ${style.classes} ${style.bg}`}
                >
                  {entry.shift}
                </span>
              );
            })}
          </div>
        </div>
        
        <div className="w-full flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 border-t border-stone-200 dark:border-stone-800/80 pt-3 mt-3">
          <span className="flex items-center gap-1">
            <Network className="w-3 h-3 text-purple-500" />
            Carbon-13 shifts
          </span>
          <span className="font-mono text-stone-400 max-w-[150px] truncate">
            Decoupled Spectrum (ppm)
          </span>
        </div>
      </div>
      
      {/* Spectral Assignments Grid */}
      <div className="flex-[2] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-2xl overflow-hidden shadow-sm self-start w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-stone-400 dark:text-stone-500 bg-stone-50 dark:bg-stone-850 uppercase tracking-widest">
              <tr>
                <th scope="col" className="px-4 py-3 font-bold">Carbon Environment (Assignment)</th>
                <th scope="col" className="px-4 py-3 font-bold text-right">Chem Shift (ppm)</th>
                <th scope="col" className="px-4 py-3 font-bold text-right">Multiplicity</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length > 0 ? (
                tableData.map((row, idx) => (
                  <tr key={idx} className="border-b border-stone-100 dark:border-stone-800 last:border-0 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-stone-700 dark:text-stone-300">
                      {row.atom}
                    </td>
                    <td className="px-4 py-3.5 text-purple-600 dark:text-purple-400 font-mono text-right font-semibold">
                      {row.shift} ppm
                    </td>
                    <td className="px-4 py-3.5 text-stone-500 dark:text-stone-400 font-mono text-right text-xs">
                      {row.coupling || 'singlet'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-stone-400">
                    No assignment entries resolved.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
