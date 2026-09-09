"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  RotateCw, RotateCcw, Play, Pause, ZoomIn, ZoomOut, 
  Maximize2, Minimize2, Move, RefreshCw, Download, 
  Sparkles, Atom, Check, Eye, EyeOff, X
} from "lucide-react";
import { Compound } from "@/lib/data";
import { useLanguage } from "@/lib/LanguageContext";
import { translations, translateDb } from "@/lib/i18n";
import { fetchWithCache } from "@/lib/offlineCache";

interface Molecular3DViewerProps {
  compound: Compound;
  isMobile?: boolean;
}

type DisplayStyle = "ballAndStick" | "stick" | "sphere" | "wireframe";

// Clean name for chemical query
function getCleanName(name: string): string {
  return name
    .replace(/^α-|^beta-|^γ-|^delta-/i, "")
    .replace(/\s*\(.*?\)/g, "")
    .trim();
}

// Get vibrant glowing accent color for each pharmacophore class
function getMoietyGlowColor(groupName: string): string {
  const g = groupName.toLowerCase();
  if (g.includes("nitrogen") || g.includes("pyridine") || g.includes("amine") || g.includes("pyrrolidine") || g.includes("alkaloid")) {
    return "#38bdf8"; // glowing electric cyan/blue
  }
  if (g.includes("carboxylic") || g.includes("carboxyl") || (g.includes("acid") && !g.includes("linolenic") && !g.includes("oleic") && !g.includes("fatty") && !g.includes("palmitic") && !g.includes("stearic"))) {
    return "#f43f5e"; // glowing radiant rose / crimson
  }
  if (g.includes("catechol") || g.includes("phenol") || g.includes("hydroxyl") || g.includes("alcohol")) {
    return "#10b981"; // glowing bright emerald green
  }
  if (g.includes("methoxy") || g.includes("ether") || g.includes("ester")) {
    return "#f59e0b"; // glowing warm amber / golden honey
  }
  if (g.includes("ring") || g.includes("core") || g.includes("flavone") || g.includes("anthrone")) {
    return "#a855f7"; // glowing neon purple
  }
  if (g.includes("alkene") || g.includes("unsaturated") || g.includes("chain") || g.includes("allyl") || g.includes("propenyl")) {
    return "#06b6d4"; // glowing teal
  }
  return "#10b981"; // default emerald
}

// Helper to find all atoms belonging to a specific chemical moiety
function getMoietyAtoms(groupName: string, atoms: any[]): any[] {
  if (!atoms || atoms.length === 0) return [];
  const g = groupName.toLowerCase();
  const matched = new Set<any>();

  // 1. Catechol ring (1,2-dihydroxybenzene core)
  if (g.includes("catechol")) {
    const oxygens = atoms.filter(a => a.elem === "O");
    for (let i = 0; i < oxygens.length; i++) {
      for (let j = i + 1; j < oxygens.length; j++) {
        const o1 = oxygens[i], o2 = oxygens[j];
        const c1 = o1.bonds?.map((b: number) => atoms[b]).find((a: any) => a?.elem === "C");
        const c2 = o2.bonds?.map((b: number) => atoms[b]).find((a: any) => a?.elem === "C");
        if (c1 && c2 && (c1.bonds?.includes(c2.index) || c2.bonds?.includes(c1.index) || c1.bonds?.includes(c2.serial) || c2.bonds?.includes(c1.serial))) {
          matched.add(o1);
          matched.add(o2);
          matched.add(c1);
          matched.add(c2);
          o1.bonds?.forEach((b: number) => { if (atoms[b]?.elem === "H") matched.add(atoms[b]); });
          o2.bonds?.forEach((b: number) => { if (atoms[b]?.elem === "H") matched.add(atoms[b]); });

          // Trace the benzene aromatic ring
          const ring = [c1, c2];
          let curr = c2, prev = c1;
          for (let step = 0; step < 4; step++) {
            const nextIdx = curr.bonds?.find((b: number) => {
              const a = atoms[b];
              return a?.elem === "C" && a !== prev && (a?.bonds?.filter((nb: number) => atoms[nb]?.elem === "C").length >= 2);
            });
            if (nextIdx !== undefined && !ring.includes(atoms[nextIdx])) {
              const nextAtom = atoms[nextIdx];
              ring.push(nextAtom);
              prev = curr;
              curr = nextAtom;
            } else break;
          }
          ring.forEach(r => {
            matched.add(r);
            r.bonds?.forEach((b: number) => { if (atoms[b]?.elem === "H") matched.add(atoms[b]); });
          });
        }
      }
    }
  }

  // 2. Carboxylic acid & Alpha, beta-unsaturated acid (-C(=O)OH)
  if (g.includes("carboxylic") || g.includes("carboxyl") || (g.includes("acid") && !g.includes("linolenic") && !g.includes("oleic") && !g.includes("fatty") && !g.includes("palmitic") && !g.includes("stearic"))) {
    atoms.forEach(a => {
      if (a.elem === "C") {
        const oNeighbors = a.bonds?.map((b: number) => atoms[b]).filter((ob: any) => ob?.elem === "O") || [];
        if (oNeighbors.length >= 2) {
          matched.add(a);
          oNeighbors.forEach((ob: any) => {
            matched.add(ob);
            ob.bonds?.forEach((b: number) => { if (atoms[b]?.elem === "H") matched.add(atoms[b]); });
          });
          // Check for conjugated C=C (alkene)
          if (g.includes("unsaturated") || g.includes("alkene") || g.includes("alpha") || g.includes("beta")) {
            const alphaC = a.bonds?.map((b: number) => atoms[b]).find((cb: any) => cb?.elem === "C");
            if (alphaC) {
              matched.add(alphaC);
              alphaC.bonds?.forEach((b: number) => { if (atoms[b]?.elem === "H") matched.add(atoms[b]); });
              const betaC = alphaC.bonds?.map((b: number) => atoms[b]).find((cb: any) => cb?.elem === "C" && cb !== a);
              if (betaC) {
                matched.add(betaC);
                betaC.bonds?.forEach((b: number) => { if (atoms[b]?.elem === "H") matched.add(atoms[b]); });
              }
            }
          }
        }
      }
    });
  }

  // 3. Methoxy groups (-O-CH3)
  if (g.includes("methoxy")) {
    atoms.forEach(a => {
      if (a.elem === "O") {
        const cNeighbors = a.bonds?.map((b: number) => atoms[b]).filter((cb: any) => cb?.elem === "C") || [];
        cNeighbors.forEach((c: any) => {
          const cNeighborsOfC = c.bonds?.map((b: number) => atoms[b]) || [];
          const hCount = cNeighborsOfC.filter((nb: any) => nb?.elem === "H").length;
          const cCount = cNeighborsOfC.filter((nb: any) => nb?.elem === "C").length;
          if (hCount >= 2 || cCount <= 1) {
            matched.add(a);
            matched.add(c);
            cNeighborsOfC.forEach((nb: any) => { if (nb?.elem === "H") matched.add(nb); });
          }
        });
      }
    });
  }

  // 4. Pyridine ring (aromatic 6-membered ring containing 1 Nitrogen)
  if (g.includes("pyridine")) {
    const n = atoms.find(a => a.elem === "N" && (a.bondOrder?.some((bo: number) => bo === 2) || a.bonds?.length === 2));
    if (n) {
      matched.add(n);
      const visited = new Set<any>([n]);
      const queue = [...(n.bonds?.map((b: number) => atoms[b]).filter((cb: any) => cb?.elem === "C") || [])];
      queue.forEach((cb: any) => visited.add(cb));
      while (queue.length > 0 && visited.size < 6) {
        const curr = queue.shift()!;
        curr.bonds?.map((b: number) => atoms[b]).filter((cb: any) => cb?.elem === "C" && !visited.has(cb)).forEach((next: any) => {
          visited.add(next);
          queue.push(next);
        });
      }
      visited.forEach(v => {
        matched.add(v);
        v.bonds?.forEach((b: number) => { if (atoms[b]?.elem === "H") matched.add(atoms[b]); });
      });
    }
  }

  // 5. Pyrrolidine ring (saturated 5-membered ring containing 1 Nitrogen)
  if (g.includes("pyrrolidine")) {
    const n = atoms.find(a => a.elem === "N" && (!a.bondOrder?.some((bo: number) => bo === 2) || a.bonds?.length >= 3));
    if (n) {
      matched.add(n);
      const ring = new Set<any>([n]);
      const cNeighbors = n.bonds?.map((b: number) => atoms[b]).filter((cb: any) => cb?.elem === "C") || [];
      cNeighbors.forEach((c: any) => {
        ring.add(c);
        c.bonds?.map((b: number) => atoms[b]).filter((cb: any) => cb?.elem === "C").forEach((c2: any) => ring.add(c2));
      });
      ring.forEach(r => {
        matched.add(r);
        r.bonds?.forEach((b: number) => { if (atoms[b]?.elem === "H") matched.add(atoms[b]); });
      });
    }
  }

  // 6. Flavone / Flavonol core / Anthrone / Phenolic rings
  if (g.includes("flavone") || g.includes("flavonol") || g.includes("anthrone") || g.includes("ring") || g.includes("core") || g.includes("aromatic")) {
    atoms.forEach(a => {
      if ((a.elem === "C" || a.elem === "O") && a.bonds?.filter((b: number) => atoms[b]?.elem === "C").length >= 2) {
        matched.add(a);
      }
    });
  }

  // 7. Phenolic hydroxyl / Hydroxyl groups (-OH)
  if (g.includes("phenolic") || g.includes("hydroxyl") || g.includes("alcohol") || g.includes("-oh")) {
    atoms.forEach(a => {
      if (a.elem === "O") {
        matched.add(a);
        a.bonds?.forEach((b: number) => {
          if (atoms[b]?.elem === "H" || atoms[b]?.elem === "C") matched.add(atoms[b]);
        });
      }
    });
  }

  // 8. Aldehyde group (-CH=O)
  if (g.includes("aldehyde")) {
    atoms.forEach(a => {
      if (a.elem === "C") {
        const oNeighbors = a.bonds?.map((b: number) => atoms[b]).filter((ob: any) => ob?.elem === "O") || [];
        const hasH = a.bonds?.some((b: number) => atoms[b]?.elem === "H");
        if (oNeighbors.length === 1 && (hasH || a.bonds.length <= 3)) {
          matched.add(a);
          oNeighbors.forEach((ob: any) => matched.add(ob));
          a.bonds?.forEach((b: number) => { if (atoms[b]?.elem === "H") matched.add(atoms[b]); });
        }
      }
    });
  }

  // 9. Ester linkage (-C(=O)O-)
  if (g.includes("ester")) {
    atoms.forEach(a => {
      if (a.elem === "C") {
        const oNeighbors = a.bonds?.map((b: number) => atoms[b]).filter((ob: any) => ob?.elem === "O") || [];
        if (oNeighbors.length >= 2) {
          matched.add(a);
          oNeighbors.forEach((ob: any) => matched.add(ob));
        }
      }
    });
  }

  // 10. Alkene / Unsaturated chain / Allyl / Propenyl (C=C)
  if (g.includes("alkene") || g.includes("unsaturated") || g.includes("allyl") || g.includes("propenyl")) {
    atoms.forEach(a => {
      if (a.elem === "C" && a.bondOrder?.some((bo: number) => bo === 2)) {
        matched.add(a);
        a.bonds?.forEach((b: number) => { if (atoms[b]?.elem === "H") matched.add(atoms[b]); });
      }
    });
  }

  // Fallback: If empty, match all heteroatoms and their immediate neighbors
  if (matched.size === 0) {
    atoms.forEach(a => {
      if (["O", "N", "S", "Cl", "Br", "F", "P"].includes(a.elem)) {
        matched.add(a);
        a.bonds?.forEach((b: number) => {
          if (atoms[b]) matched.add(atoms[b]);
        });
      }
    });
  }

  // Final fallback: all non-hydrogen atoms if still empty
  if (matched.size === 0) {
    atoms.filter(a => a.elem !== "H").forEach(a => matched.add(a));
  }

  return Array.from(matched);
}

// Return exact atom serials, indices, and atom objects
function identifyMoietyAtomSerials(groupName: string, atoms: any[]) {
  const moietyAtoms = getMoietyAtoms(groupName, atoms);
  return {
    serials: moietyAtoms.map(a => a.serial),
    indices: moietyAtoms.map(a => a.index),
    atoms: moietyAtoms
  };
}

export function Molecular3DViewer({ compound, isMobile }: Molecular3DViewerProps) {
  const { language } = useLanguage();
  const t = translations[language];

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sdfContent, setSdfContent] = useState<string>("");
  
  // NOTE: Initial 3D structure is static (not spinning) unless user clicks the auto-spin button
  const [isSpinning, setIsSpinning] = useState(false);
  const isSpinningRef = useRef(isSpinning);
  useEffect(() => {
    isSpinningRef.current = isSpinning;
  }, [isSpinning]);

  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>("ballAndStick");
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const [showAllGroupsHighlight, setShowAllGroupsHighlight] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeAtomCount, setActiveAtomCount] = useState<number>(0);

  // Derive functional groups from compound data or fallback
  const functionalGroups = React.useMemo(() => {
    if (compound.functionalGroups && compound.functionalGroups.length > 0) {
      return compound.functionalGroups;
    }
    return [
      {
        name: language === "ms" ? "Rangka Polifenol / Aromatik" : "Aromatic / Polyphenolic Core",
        description: language === "ms" 
          ? "Struktur gelang terkonjugasi yang menstabilkan interaksi reseptor dan perencatan radikal bebas." 
          : "Conjugated ring structure stabilizing receptor interactions and free radical scavenging."
      },
      {
        name: language === "ms" ? "Kumpulan Hidroksil (-OH)" : "Hydroxyl Groups (-OH)",
        description: language === "ms" 
          ? "Penderma ikatan hidrogen yang meningkatkan keterlarutan dan afiniti enzim sasaran." 
          : "Hydrogen bond donors providing solubility and high binding affinity to target enzymes."
      }
    ];
  }, [compound.functionalGroups, language]);

  // Apply visual representation style & glowing moieties
  const applyStyle = useCallback((
    styleType: DisplayStyle,
    highlightGroup: { name: string; description: string } | null,
    highlightAll: boolean
  ) => {
    const viewer = viewerInstance.current;
    if (!viewer || typeof viewer.setStyle !== "function") return;

    try {
      viewer.removeAllLabels();
      viewer.removeAllSurfaces();
      if (typeof viewer.removeAllShapes === "function") {
        viewer.removeAllShapes();
      }

      const model = viewer.getModel();
      const allAtoms: any[] = model && typeof model.getAtoms === "function" ? model.getAtoms() : [];

      if (highlightGroup && allAtoms.length > 0) {
        // 1. Precise graph moiety identification
        const { serials, indices, atoms: moietyAtoms } = identifyMoietyAtomSerials(highlightGroup.name, allAtoms);
        const moietyIndexSet = new Set(indices);
        const glowColor = getMoietyGlowColor(highlightGroup.name);

        // 2. Dim non-moiety background skeleton
        const nonMoietySerials = allAtoms.filter(a => !moietyIndexSet.has(a.index)).map(a => a.serial);
        if (nonMoietySerials.length > 0) {
          viewer.setStyle({ serial: nonMoietySerials }, { 
            stick: { radius: 0.08, color: "#27272a" }, 
            sphere: { scale: 0.12, color: "#27272a" } 
          });
        }

        // 3. Highlight moiety atoms with vibrant radiant sticks and prominent spheres
        viewer.setStyle({ serial: serials }, { 
          stick: { radius: 0.28, color: glowColor }, 
          sphere: { scale: 0.52, color: glowColor } 
        });
        viewer.setStyle({ index: indices }, { 
          stick: { radius: 0.28, color: glowColor }, 
          sphere: { scale: 0.52, color: glowColor } 
        });

        // 4. GUARANTEED VISIBLE 3D GLOWING VOLUMETRIC AURA (Concentric Alpha-blended Shapes)
        if (typeof viewer.addShape === "function" && moietyAtoms.length > 0) {
          // Layer A: Radiant Inner Plasma Glow (dense, medium radius)
          const innerPlasma = viewer.addShape({ opacity: 0.55 });
          // Layer B: Luminous Outer Corona Halo (translucent ethereal aura)
          const outerAura = viewer.addShape({ opacity: 0.22 });

          moietyAtoms.forEach(atom => {
            const isH = atom.elem === "H";
            innerPlasma.addSphere({
              center: { x: atom.x, y: atom.y, z: atom.z },
              radius: isH ? 0.45 : 0.78,
              color: glowColor
            });
            outerAura.addSphere({
              center: { x: atom.x, y: atom.y, z: atom.z },
              radius: isH ? 0.85 : 1.38,
              color: glowColor
            });
          });

          // Glowing orbital cylinders connecting bonded atoms in the active moiety
          for (let i = 0; i < moietyAtoms.length; i++) {
            for (let j = i + 1; j < moietyAtoms.length; j++) {
              const a1 = moietyAtoms[i];
              const a2 = moietyAtoms[j];
              if (
                a1.bonds?.includes(a2.index) || a2.bonds?.includes(a1.index) ||
                a1.bonds?.includes(a2.serial) || a2.bonds?.includes(a1.serial)
              ) {
                innerPlasma.addCylinder({
                  start: { x: a1.x, y: a1.y, z: a1.z },
                  end: { x: a2.x, y: a2.y, z: a2.z },
                  radius: 0.36,
                  color: glowColor
                });
                outerAura.addCylinder({
                  start: { x: a1.x, y: a1.y, z: a1.z },
                  end: { x: a2.x, y: a2.y, z: a2.z },
                  radius: 0.65,
                  color: glowColor
                });
              }
            }
          }
        }

        // 5. Also invoke synchronous Van der Waals Electronic Cloud / Surface Halo
        try {
          if ((window as any).$3Dmol?.setSyncSurface) {
            (window as any).$3Dmol.setSyncSurface(true);
          }
          const surfType = (window as any).$3Dmol?.SurfaceType?.VDW ?? 1;
          viewer.addSurface(surfType, {
            opacity: 0.45,
            color: glowColor,
          }, { serial: serials });
        } catch (surfErr) {
          console.warn("VDW surface generation note:", surfErr);
        }

        // 6. Compute 3D centroid and position a floating glowing billboard label
        if (moietyAtoms.length > 0) {
          let sumX = 0, sumY = 0, sumZ = 0;
          moietyAtoms.forEach(a => {
            sumX += a.x;
            sumY += a.y;
            sumZ += a.z;
          });
          const cX = sumX / moietyAtoms.length;
          const cY = sumY / moietyAtoms.length;
          const cZ = sumZ / moietyAtoms.length;

          viewer.addLabel(`✨ ${translateDb(highlightGroup.name, language)}`, {
            position: { x: cX, y: cY + 1.1, z: cZ },
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            fontColor: glowColor,
            fontSize: 12,
            font: "system-ui, sans-serif",
            borderThickness: 2,
            borderColor: glowColor,
            inFront: true
          });
        }
      } else if (highlightAll && allAtoms.length > 0) {
        // Dim all non-hetero atoms
        viewer.setStyle({}, { 
          stick: { radius: 0.08, color: "#27272a" }, 
          sphere: { scale: 0.12, color: "#27272a" } 
        });

        const oxygens = allAtoms.filter(a => a.elem === "O");
        const nitrogens = allAtoms.filter(a => a.elem === "N");
        const sulfurs = allAtoms.filter(a => a.elem === "S");

        // Multi-tier volumetric glowing halos for each heteroatom family
        if (typeof viewer.addShape === "function") {
          const heteroInner = viewer.addShape({ opacity: 0.55 });
          const heteroOuter = viewer.addShape({ opacity: 0.22 });

          oxygens.forEach(a => {
            heteroInner.addSphere({ center: { x: a.x, y: a.y, z: a.z }, radius: 0.72, color: "#f43f5e" });
            heteroOuter.addSphere({ center: { x: a.x, y: a.y, z: a.z }, radius: 1.30, color: "#f43f5e" });
          });
          nitrogens.forEach(a => {
            heteroInner.addSphere({ center: { x: a.x, y: a.y, z: a.z }, radius: 0.72, color: "#38bdf8" });
            heteroOuter.addSphere({ center: { x: a.x, y: a.y, z: a.z }, radius: 1.30, color: "#38bdf8" });
          });
          sulfurs.forEach(a => {
            heteroInner.addSphere({ center: { x: a.x, y: a.y, z: a.z }, radius: 0.75, color: "#fbbf24" });
            heteroOuter.addSphere({ center: { x: a.x, y: a.y, z: a.z }, radius: 1.35, color: "#fbbf24" });
          });
        }

        // Oxygen (Glowing Rose/Coral)
        viewer.setStyle(
          { elem: "O" }, 
          { stick: { radius: 0.26, color: "#f43f5e" }, sphere: { scale: 0.48, color: "#f43f5e" } }
        );
        // Nitrogen (Glowing Electric Blue)
        viewer.setStyle(
          { elem: "N" }, 
          { stick: { radius: 0.26, color: "#38bdf8" }, sphere: { scale: 0.48, color: "#38bdf8" } }
        );
        // Sulfur (Glowing Luminous Amber)
        viewer.setStyle(
          { elem: "S" }, 
          { stick: { radius: 0.26, color: "#fbbf24" }, sphere: { scale: 0.48, color: "#fbbf24" } }
        );

        // Add 3D pins for major heteroatom centers
        if (oxygens.length > 0) {
          viewer.addLabel("-O- / -OH", {
            position: { x: oxygens[0].x, y: oxygens[0].y + 0.8, z: oxygens[0].z },
            backgroundColor: "rgba(244, 63, 94, 0.95)",
            fontColor: "#ffffff",
            fontSize: 10,
            inFront: true
          });
        }
        if (nitrogens.length > 0) {
          viewer.addLabel("-N-", {
            position: { x: nitrogens[0].x, y: nitrogens[0].y + 0.8, z: nitrogens[0].z },
            backgroundColor: "rgba(56, 189, 248, 0.95)",
            fontColor: "#ffffff",
            fontSize: 10,
            inFront: true
          });
        }
      } else {
        // Standard view with selected representation style (no moiety glowing)
        switch (styleType) {
          case "stick":
            viewer.setStyle({}, { 
              stick: { radius: 0.20, colorscheme: "Jmol" } 
            });
            break;
          case "sphere":
            viewer.setStyle({}, { 
              sphere: { scale: 0.75, colorscheme: "Jmol" } 
            });
            break;
          case "wireframe":
            viewer.setStyle({}, { 
              line: { linewidth: 2.5, colorscheme: "Jmol" } 
            });
            break;
          case "ballAndStick":
          default:
            viewer.setStyle({}, { 
              stick: { radius: 0.15, colorscheme: "Jmol" }, 
              sphere: { scale: 0.28, colorscheme: "Jmol" } 
            });
            break;
        }
      }

      viewer.render();
    } catch (e) {
      console.warn("Failed to apply 3Dmol style:", e);
    }
  }, [language]);

  // Load 3D model data & initialize viewer
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setSelectedGroupIndex(null);
    setShowAllGroupsHighlight(false);

    const initViewer = async () => {
      if (!(window as any).$3Dmol) return;

      try {
        let modelData = "";
        let format: "sdf" | "pdb" = "sdf";
        const cleanName = getCleanName(compound.name);

        // 1. Fetch from NCI Cactus (fast, high-resolution 3D SDFs for small molecules)
        try {
          const cactusUrl = `https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(cleanName)}/file?format=sdf&get3d=true`;
          const res = await fetchWithCache(cactusUrl);
          if (res.ok) {
            const text = await res.text();
            if (text && !text.includes("<html>") && !text.includes("<title>Error")) {
              modelData = text;
              format = "sdf";
            }
          }
        } catch (e) {
          console.warn("NCI Cactus fetch fallback:", e);
        }

        // 2. Fallback to PubChem 3D SDF
        if (!modelData) {
          try {
            const pubchemUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cleanName)}/SDF?record_type=3d`;
            const res = await fetchWithCache(pubchemUrl);
            if (res.ok) {
              const text = await res.text();
              if (text && !text.includes("<Fault>") && !text.includes("PUGREST.ServerBusy")) {
                modelData = text;
                format = "sdf";
              }
            }
          } catch (e) {
            console.warn("PubChem fetch fallback:", e);
          }
        }

        // 3. Fallback to RCSB PDB if compound has pdbId
        if (!modelData && compound.pdbId) {
          try {
            const pdbUrl = `https://files.rcsb.org/download/${compound.pdbId}.pdb`;
            const res = await fetchWithCache(pdbUrl);
            if (res.ok) {
              const text = await res.text();
              if (text && !text.startsWith("<!DOCTYPE")) {
                modelData = text;
                format = "pdb";
              }
            }
          } catch (e) {
            console.warn("RCSB PDB fetch fallback:", e);
          }
        }

        if (!active) return;

        if (!modelData || modelData.trim().length === 0) {
          throw new Error("No 3D coordinate model found for this compound");
        }

        setSdfContent(modelData);

        // Setup 3Dmol viewer inside ref element
        const targetDiv = viewerRef.current;
        if (!targetDiv) return;

        targetDiv.innerHTML = "";
        const viewer = (window as any).$3Dmol.createViewer(targetDiv, {
          backgroundColor: "#18181b",
        });

        viewerInstance.current = viewer;
        viewer.addModel(modelData, format);
        
        // Count atoms
        try {
          const model = viewer.getModel();
          if (model && typeof model.getAtoms === "function") {
            setActiveAtomCount(model.getAtoms().length);
          }
        } catch {}

        viewer.zoomTo();
        applyStyle("ballAndStick", null, false);

        // NOTE: Strictly respect initial non-spinning state unless user clicks auto-spin button
        if (isSpinningRef.current) {
          viewer.spin("y", 1);
        } else {
          viewer.spin(false);
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to load 3D molecular structure:", err);
        if (active) {
          setError(true);
          setLoading(false);
        }
      }
    };

    if ((window as any).$3Dmol) {
      initViewer();
    } else {
      const timer = setInterval(() => {
        if ((window as any).$3Dmol) {
          clearInterval(timer);
          initViewer();
        }
      }, 100);
      return () => {
        clearInterval(timer);
        active = false;
      };
    }

    return () => {
      active = false;
      try {
        if (viewerInstance.current) {
          if (typeof viewerInstance.current.removeAllModels === "function") {
            viewerInstance.current.removeAllModels();
          }
          if (typeof viewerInstance.current.removeAllSurfaces === "function") {
            viewerInstance.current.removeAllSurfaces();
          }
          if (typeof viewerInstance.current.removeAllLabels === "function") {
            viewerInstance.current.removeAllLabels();
          }
          if (typeof viewerInstance.current.removeAllShapes === "function") {
            viewerInstance.current.removeAllShapes();
          }
        }
      } catch (e) {
        console.warn("3Dmol viewer cleanup error:", e);
      }
      viewerInstance.current = null;
    };
  }, [compound.name, compound.pdbId, applyStyle]);

  // Handle ResizeObserver for canvas resizing
  useEffect(() => {
    const target = viewerRef.current;
    if (!target) return;

    const observer = new ResizeObserver(() => {
      try {
        if (viewerInstance.current && typeof viewerInstance.current.resize === "function") {
          viewerInstance.current.resize();
          viewerInstance.current.render();
        }
      } catch (e) {
        console.warn("3Dmol resize error:", e);
      }
    });

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Keyboard shortcut to close fullscreen with Escape
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Ensure 3D canvas is resized properly when entering or exiting fullscreen
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (viewerInstance.current) {
          viewerInstance.current.resize();
          viewerInstance.current.render();
        }
      } catch (e) {}
    }, 120);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Update style when displayStyle, selectedGroup, or showAll changes
  useEffect(() => {
    if (loading || error || !viewerInstance.current) return;
    const currentGroup = selectedGroupIndex !== null ? functionalGroups[selectedGroupIndex] : null;
    applyStyle(displayStyle, currentGroup, showAllGroupsHighlight);
  }, [displayStyle, selectedGroupIndex, showAllGroupsHighlight, loading, error, functionalGroups, applyStyle]);

  // 3D Manipulation Functions (Rotate, Move, Zoom)
  const handleZoomIn = () => {
    try {
      viewerInstance.current?.zoom(1.25);
    } catch (e) {
      console.warn("Zoom In error:", e);
    }
  };

  const handleZoomOut = () => {
    try {
      viewerInstance.current?.zoom(0.8);
    } catch (e) {
      console.warn("Zoom Out error:", e);
    }
  };

  const handleRecenter = () => {
    try {
      viewerInstance.current?.zoomTo();
      viewerInstance.current?.center();
    } catch (e) {
      console.warn("Recenter error:", e);
    }
  };

  const toggleSpin = () => {
    try {
      const nextSpin = !isSpinning;
      setIsSpinning(nextSpin);
      if (viewerInstance.current) {
        if (nextSpin) {
          viewerInstance.current.spin("y", 1);
        } else {
          viewerInstance.current.spin(false);
        }
      }
    } catch (e) {
      console.warn("Toggle spin error:", e);
    }
  };

  const handleRotateLeft = () => {
    try {
      viewerInstance.current?.rotate(-30, "y");
    } catch (e) {
      console.warn("Rotate Left error:", e);
    }
  };

  const handleRotateRight = () => {
    try {
      viewerInstance.current?.rotate(30, "y");
    } catch (e) {
      console.warn("Rotate Right error:", e);
    }
  };

  const handleRotateUp = () => {
    try {
      viewerInstance.current?.rotate(-30, "x");
    } catch (e) {
      console.warn("Rotate Up error:", e);
    }
  };

  const handleRotateDown = () => {
    try {
      viewerInstance.current?.rotate(30, "x");
    } catch (e) {
      console.warn("Rotate Down error:", e);
    }
  };

  const handlePan = (dx: number, dy: number) => {
    try {
      viewerInstance.current?.translate(dx, dy);
    } catch (e) {
      console.warn("Translate error:", e);
    }
  };

  const handleSelectGroup = (index: number) => {
    setShowAllGroupsHighlight(false);
    if (selectedGroupIndex === index) {
      setSelectedGroupIndex(null);
    } else {
      setSelectedGroupIndex(index);
    }
  };

  const handleToggleHighlightAll = () => {
    setSelectedGroupIndex(null);
    setShowAllGroupsHighlight((prev) => !prev);
  };

  const handleDownloadSdf = () => {
    if (!sdfContent) return;
    const blob = new Blob([sdfContent], { type: "chemical/x-mdl-sdfile" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${compound.name.replace(/\s+/g, "_")}_3D_structure.sdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedGroup = selectedGroupIndex !== null ? functionalGroups[selectedGroupIndex] : null;

  // Render the Key Functional Groups (Pharmacophores) Board
  const renderPharmacophoresBoard = (isPanelInFullscreen: boolean = false) => (
    <div 
      className={`${
        isPanelInFullscreen 
          ? "w-full lg:w-[420px] xl:w-[480px] h-[48vh] lg:h-full overflow-y-auto bg-stone-900/95 border-t lg:border-t-0 lg:border-l border-stone-800 p-4 sm:p-5 space-y-4 shadow-xl z-20 flex flex-col justify-between"
          : "p-3.5 sm:p-4 bg-stone-950 border-t border-stone-800/90 space-y-3"
      }`}
      id={`pharmacophores-board-${compound.id}`}
    >
      <div className="space-y-3.5">
        {/* Board Section Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={15} className="text-emerald-400" />
            <span className="text-xs font-bold text-stone-200 uppercase tracking-wider">
              {language === "ms" ? "Kumpulan Berfungsi Utama (Pharmacophore)" : "Key Functional Groups (Pharmacophores)"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Show All Groups Highlight Toggle */}
            <button
              onClick={handleToggleHighlightAll}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors border ${
                showAllGroupsHighlight
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400/50"
                  : "bg-stone-900 text-stone-400 hover:text-stone-200 border-stone-800"
              }`}
            >
              {showAllGroupsHighlight ? <EyeOff size={12} /> : <Eye size={12} />}
              <span>{language === "ms" ? "Tunjuk Semua Kumpulan" : "Highlight All Moieties"}</span>
            </button>

            {/* Clear Button if any is active */}
            {(selectedGroupIndex !== null || showAllGroupsHighlight) && (
              <button
                onClick={() => {
                  setSelectedGroupIndex(null);
                  setShowAllGroupsHighlight(false);
                }}
                className="px-2 py-1 rounded-lg text-[10px] font-semibold text-stone-400 hover:text-stone-200 bg-stone-900 hover:bg-stone-850 transition-colors"
              >
                {language === "ms" ? "Kosongkan" : "Clear"}
              </button>
            )}
          </div>
        </div>

        {/* Functional Groups Badges Selection List */}
        <div className="flex flex-wrap gap-1.5">
          {functionalGroups.map((group, idx) => {
            const isSelected = selectedGroupIndex === idx;
            const glowColor = getMoietyGlowColor(group.name);
            return (
              <button
                key={idx}
                onClick={() => handleSelectGroup(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border text-left ${
                  isSelected
                    ? "text-white shadow-lg ring-2 ring-white/50 animate-pulse"
                    : "bg-stone-900 hover:bg-stone-850 text-stone-300 border-stone-800 hover:border-stone-700"
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: glowColor,
                        borderColor: glowColor,
                        boxShadow: `0 0 18px ${glowColor}88`,
                      }
                    : {}
                }
              >
                <span 
                  className={`w-2 h-2 rounded-full ${isSelected ? "bg-white animate-ping" : "bg-emerald-500"}`} 
                  style={!isSelected ? { backgroundColor: glowColor } : {}}
                />
                <span className="font-semibold">{translateDb(group.name, language)}</span>
              </button>
            );
          })}
        </div>

        {/* Detailed Pharmacophore Explanation Card */}
        {selectedGroup && (
          <div 
            className="p-3.5 bg-stone-900/95 rounded-xl border text-xs space-y-2 transition-all"
            style={{ 
              borderColor: `${getMoietyGlowColor(selectedGroup.name)}77`,
              boxShadow: `0 0 25px ${getMoietyGlowColor(selectedGroup.name)}33`
            }}
          >
            <div 
              className="flex items-center justify-between font-bold"
              style={{ color: getMoietyGlowColor(selectedGroup.name) }}
            >
              <span className="flex items-center gap-1.5">
                <Check size={14} />
                {translateDb(selectedGroup.name, language)}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-mono">
                {language === "ms" ? "✨ Awan Bersinar Aktif" : "✨ 3D Glowing Halo"}
              </span>
            </div>
            <p className="text-stone-300 leading-relaxed text-[11.5px]">
              {translateDb(selectedGroup.description, language)}
            </p>
          </div>
        )}
      </div>

      {/* Atom Color Legend */}
      <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between flex-wrap gap-2 text-[10px] text-stone-400 font-mono mt-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-stone-500 uppercase tracking-widest">{language === "ms" ? "Atom" : "Atoms"}:</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-stone-400 inline-block" /> C</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> O</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> N</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> S</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-stone-200 inline-block" /> H</span>
        </div>

        <span className="text-stone-500 text-[9px]">
          PubChem / NCI Cactus 3D
        </span>
      </div>
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={`rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-900 text-stone-100 flex flex-col transition-all duration-300 ${
        isFullscreen 
          ? "fixed inset-2 sm:inset-4 md:inset-6 z-[100000] shadow-2xl ring-1 ring-white/20 bg-stone-950 overflow-hidden" 
          : "relative w-full shadow-md overflow-hidden"
      }`}
      id={`3d-mol-viewer-${compound.id}`}
    >
      {/* Top Header Bar */}
      <div className="px-4 py-2.5 bg-stone-950/90 border-b border-stone-800/80 flex items-center justify-between gap-2 flex-wrap text-xs z-30">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
            <Atom size={14} className="animate-spin-slow" />
          </div>
          <span className="font-bold tracking-wider uppercase text-[11px] text-stone-300 font-mono">
            {translateDb(compound.name, language)}
          </span>
          {activeAtomCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 font-mono">
              {activeAtomCount} atoms
            </span>
          )}
          {isFullscreen && (
            <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold items-center gap-1">
              <Sparkles size={10} />
              {language === "ms" ? "Pemeriksa Farmakofor Skrin Penuh" : "Fullscreen Pharmacophore Mode"}
            </span>
          )}
        </div>

        {/* Top Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Representation Selector */}
          <div className="hidden sm:flex items-center bg-stone-800/80 rounded-lg p-0.5 border border-stone-700/60 text-[10px]">
            <button
              onClick={() => setDisplayStyle("ballAndStick")}
              className={`px-2 py-1 rounded transition-colors ${displayStyle === "ballAndStick" ? "bg-emerald-500 text-white font-bold" : "text-stone-400 hover:text-stone-200"}`}
              title="Ball & Stick"
            >
              Ball & Stick
            </button>
            <button
              onClick={() => setDisplayStyle("stick")}
              className={`px-2 py-1 rounded transition-colors ${displayStyle === "stick" ? "bg-emerald-500 text-white font-bold" : "text-stone-400 hover:text-stone-200"}`}
              title="Stick"
            >
              Stick
            </button>
            <button
              onClick={() => setDisplayStyle("sphere")}
              className={`px-2 py-1 rounded transition-colors ${displayStyle === "sphere" ? "bg-emerald-500 text-white font-bold" : "text-stone-400 hover:text-stone-200"}`}
              title="Space-Filling (CPK Sphere)"
            >
              CPK
            </button>
          </div>

          {/* Download 3D SDF */}
          {sdfContent && (
            <button
              onClick={handleDownloadSdf}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-emerald-400 transition-colors"
              title={language === "ms" ? "Muat turun fail koordinat 3D .sdf" : "Download 3D coordinates .sdf"}
            >
              <Download size={13} />
            </button>
          )}

          {/* Fullscreen Toggle / Exit */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1.5 px-2 rounded-lg flex items-center gap-1 text-[11px] font-semibold transition-colors ${
              isFullscreen 
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30" 
                : "bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-emerald-400"
            }`}
            title={isFullscreen ? (language === "ms" ? "Keluar Skrin Penuh (Esc)" : "Exit Fullscreen (Esc)") : (language === "ms" ? "Skrin Penuh" : "Fullscreen")}
          >
            {isFullscreen ? (
              <>
                <Minimize2 size={13} />
                <span className="hidden sm:inline">{language === "ms" ? "Keluar" : "Exit"}</span>
              </>
            ) : (
              <>
                <Maximize2 size={13} />
                <span className="hidden sm:inline">{language === "ms" ? "Skrin Penuh" : "Fullscreen"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main View Area: In Fullscreen, arranges 3D canvas and Pharmacophore Board side-by-side on desktop, or stacked with full visibility on mobile */}
      <div className={`flex flex-col ${isFullscreen ? "flex-1 lg:flex-row overflow-hidden min-h-0" : "w-full"}`}>
        {/* Main 3D Canvas Viewport */}
        <div 
          className={`relative bg-zinc-950 transition-all ${
            isFullscreen 
              ? "flex-1 h-full min-h-[340px] lg:min-h-0" 
              : "h-[340px] sm:h-[400px] w-full"
          }`}
          style={{
            boxShadow: selectedGroup 
              ? `inset 0 0 90px ${getMoietyGlowColor(selectedGroup.name)}33`
              : undefined
          }}
        >
          {/* 3Dmol WebGL Container */}
          <div ref={viewerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-10">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <p className="text-xs text-stone-300 font-mono tracking-wider">
                {language === "ms" ? "Menjana model spatial 3D..." : "Rendering 3D spatial conformation..."}
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 bg-stone-950/90 flex flex-col items-center justify-center p-6 text-center z-10 space-y-3">
              <Atom size={32} className="text-amber-500" />
              <div className="max-w-xs">
                <h4 className="font-bold text-sm text-stone-200">
                  {language === "ms" ? "Prapapar 3D Luar Talian" : "3D Conformation Unavailable"}
                </h4>
                <p className="text-xs text-stone-400 mt-1">
                  {language === "ms" 
                    ? "Sila semak sambungan internet untuk memuat turun koordinat stereokimia 3D daripada PubChem/NCI Cactus." 
                    : "Unable to retrieve 3D spatial coordinates. Check your connection or view the 2D diagram."}
                </p>
              </div>
            </div>
          )}

          {/* Glowing Active Indicator Badge */}
          {selectedGroup && (
            <div 
              className="absolute top-3 left-3 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 shadow-lg z-20 border"
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.92)",
                color: getMoietyGlowColor(selectedGroup.name),
                borderColor: `${getMoietyGlowColor(selectedGroup.name)}66`,
                boxShadow: `0 0 16px ${getMoietyGlowColor(selectedGroup.name)}44`
              }}
            >
              <span 
                className="w-2 h-2 rounded-full animate-ping" 
                style={{ backgroundColor: getMoietyGlowColor(selectedGroup.name) }} 
              />
              <span>
                {language === "ms" ? "✨ Sorotan 3D Bersinar Aktif" : "✨ 3D Glowing Halo Active"}
              </span>
            </div>
          )}

          {/* Floating Interaction Guidance Badge */}
          {!loading && !error && !selectedGroup && (
            <div className="absolute top-3 left-3 bg-stone-900/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-stone-700/50 text-[10px] text-stone-400 pointer-events-none flex items-center gap-1.5 shadow-sm">
              <Move size={11} className="text-emerald-400" />
              <span>
                {language === "ms" ? "Seret: Putar • Klik kanan: Alih • Skrol: Zum" : "Drag: Rotate • Right-drag: Pan • Scroll: Zoom"}
              </span>
            </div>
          )}

          {/* On-Screen Navigation & Manipulation Overlay Bar */}
          {!loading && !error && (
            <div className="absolute right-3 top-3 flex flex-col gap-1.5 z-20">
              {/* Auto Spin Toggle - Note: initially inactive, user must click to start spin */}
              <button
                onClick={toggleSpin}
                className={`p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all ${
                  isSpinning 
                    ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/30 ring-2 ring-emerald-300" 
                    : "bg-stone-900/90 text-stone-300 border-stone-700/60 hover:bg-stone-800"
                }`}
                title={isSpinning ? (language === "ms" ? "Hentikan Putaran" : "Pause Auto-Rotate") : (language === "ms" ? "Mulakan Putaran" : "Play Auto-Rotate")}
              >
                {isSpinning ? <Pause size={14} /> : <Play size={14} />}
              </button>

              {/* Zoom In */}
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-300 border border-stone-700/60 backdrop-blur-md shadow-lg transition-colors"
                title={language === "ms" ? "Zum Dekat (+)" : "Zoom In (+)"}
              >
                <ZoomIn size={14} />
              </button>

              {/* Zoom Out */}
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-300 border border-stone-700/60 backdrop-blur-md shadow-lg transition-colors"
                title={language === "ms" ? "Zum Jauh (-)" : "Zoom Out (-)"}
              >
                <ZoomOut size={14} />
              </button>

              {/* Recenter View */}
              <button
                onClick={handleRecenter}
                className="p-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-300 border border-stone-700/60 backdrop-blur-md shadow-lg transition-colors"
                title={language === "ms" ? "Pusatkan Pandangan" : "Center / Fit to View"}
              >
                <RefreshCw size={14} />
              </button>
            </div>
          )}

          {/* Discrete Directional Navigation Pad (Bottom Left of Canvas) */}
          {!loading && !error && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 z-20 bg-stone-950/85 backdrop-blur-md px-2 py-1.5 rounded-xl border border-stone-800/80 text-stone-400">
              <span className="text-[9px] uppercase tracking-wider font-bold mr-1 text-stone-500 font-mono">
                {language === "ms" ? "Putar" : "Rotate"}:
              </span>
              <button
                onClick={handleRotateLeft}
                className="p-1 rounded hover:bg-stone-800 text-stone-300 transition-colors"
                title="Rotate Left 30°"
              >
                <RotateCcw size={13} />
              </button>
              <button
                onClick={handleRotateRight}
                className="p-1 rounded hover:bg-stone-800 text-stone-300 transition-colors"
                title="Rotate Right 30°"
              >
                <RotateCw size={13} />
              </button>
              <div className="w-[1px] h-3 bg-stone-800 mx-0.5" />
              <button
                onClick={handleRotateUp}
                className="px-1 py-0.5 rounded text-[10px] hover:bg-stone-800 text-stone-300 transition-colors font-mono"
                title="Pitch Up"
              >
                ▲
              </button>
              <button
                onClick={handleRotateDown}
                className="px-1 py-0.5 rounded text-[10px] hover:bg-stone-800 text-stone-300 transition-colors font-mono"
                title="Pitch Down"
              >
                ▼
              </button>
              <div className="w-[1px] h-3 bg-stone-800 mx-0.5" />
              <span className="text-[9px] uppercase tracking-wider font-bold mx-1 text-stone-500 font-mono">
                {language === "ms" ? "Alih" : "Pan"}:
              </span>
              <button
                onClick={() => handlePan(-1.5, 0)}
                className="px-1 py-0.5 rounded text-[10px] hover:bg-stone-800 text-stone-300 font-mono"
                title="Pan Left"
              >
                ←
              </button>
              <button
                onClick={() => handlePan(1.5, 0)}
                className="px-1 py-0.5 rounded text-[10px] hover:bg-stone-800 text-stone-300 font-mono"
                title="Pan Right"
              >
                →
              </button>
            </div>
          )}
        </div>

        {/* The Key Functional Groups (Pharmacophores) Board:
            - When NOT in Fullscreen: renders right after the 3D structure viewport
            - When in Fullscreen: renders right alongside the 3D canvas on desktop (or stacked scrollable on mobile)
        */}
        {renderPharmacophoresBoard(isFullscreen)}
      </div>
    </div>
  );
}
