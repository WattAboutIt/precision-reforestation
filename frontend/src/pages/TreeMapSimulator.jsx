import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import PageShell from "../components/PageShell.jsx";
import { getEnvironment } from "../services/api.js";
import { DEFAULT_LOCATION, NEPAL_BOUNDS } from "../services/location.js";

const treeProfiles = [
  {
    name: "Shorea robusta (Sal)",
    reason: "Dominant low-elevation Terai species; thrives in warm, fertile alluvial soils.",
    elevIdeal: 500,
    elevTol: 400,
    phIdeal: 6.5,
    phTol: 0.8,
    ndviIdeal: 0.45,
    ndviTol: 0.25,
    slopeMax: 15,
    nitrogenIdeal: 5.0,
    nitrogenTol: 2.5,
    omIdeal: 4.0,
    omTol: 2.0,
    base: 95,
  },
  {
    name: "Dalbergia sissoo (Sisau)",
    reason: "Fast-growing nitrogen-fixer ideal for riverine and degraded lowland restoration.",
    elevIdeal: 350,
    elevTol: 350,
    phIdeal: 7.0,
    phTol: 1.0,
    ndviIdeal: 0.3,
    ndviTol: 0.3,
    slopeMax: 20,
    nitrogenIdeal: 4.0,
    nitrogenTol: 3.0,
    omIdeal: 3.0,
    omTol: 2.0,
    base: 92,
  },
  {
    name: "Tectona grandis (Sagwan / Teak)",
    reason: "High-value timber tree suited to moist tropical lowlands with deep loamy soils.",
    elevIdeal: 400,
    elevTol: 400,
    phIdeal: 6.5,
    phTol: 1.0,
    ndviIdeal: 0.4,
    ndviTol: 0.25,
    slopeMax: 15,
    nitrogenIdeal: 5.0,
    nitrogenTol: 2.0,
    omIdeal: 4.5,
    omTol: 2.0,
    base: 90,
  },
  {
    name: "Bombax ceiba (Simal)",
    reason: "Pioneer deciduous tree that colonises disturbed Terai land quickly.",
    elevIdeal: 300,
    elevTol: 300,
    phIdeal: 6.8,
    phTol: 1.2,
    ndviIdeal: 0.2,
    ndviTol: 0.3,
    slopeMax: 25,
    nitrogenIdeal: 3.5,
    nitrogenTol: 2.5,
    omIdeal: 3.0,
    omTol: 2.5,
    base: 88,
  },
  {
    name: "Terminalia alata (Saj)",
    reason: "Mixed Shorea-Saj forest associate; tolerates seasonally dry Terai conditions.",
    elevIdeal: 600,
    elevTol: 400,
    phIdeal: 6.5,
    phTol: 1.0,
    ndviIdeal: 0.35,
    ndviTol: 0.25,
    slopeMax: 20,
    nitrogenIdeal: 4.0,
    nitrogenTol: 2.5,
    omIdeal: 3.5,
    omTol: 2.0,
    base: 86,
  },
  {
    name: "Acacia catechu (Khair)",
    reason: "Drought-hardy agroforestry species common in Terai buffer-zone plantations.",
    elevIdeal: 400,
    elevTol: 400,
    phIdeal: 7.0,
    phTol: 1.2,
    ndviIdeal: 0.2,
    ndviTol: 0.3,
    slopeMax: 25,
    nitrogenIdeal: 3.0,
    nitrogenTol: 3.0,
    omIdeal: 2.5,
    omTol: 2.0,
    base: 85,
  },
  {
    name: "Pinus roxburghii (Khote Sallo / Chir Pine)",
    reason: "Dominant mid-elevation pine; resilient on disturbed, dry south-facing slopes.",
    elevIdeal: 1300,
    elevTol: 400,
    phIdeal: 5.8,
    phTol: 0.8,
    ndviIdeal: 0.35,
    ndviTol: 0.25,
    slopeMax: 35,
    nitrogenIdeal: 3.5,
    nitrogenTol: 2.5,
    omIdeal: 2.5,
    omTol: 1.5,
    base: 95,
  },
  {
    name: "Alnus nepalensis (Utis / Himalayan Alder)",
    reason: "Nitrogen-fixing pioneer; rapidly stabilises landslide scars and eroded hillsides.",
    elevIdeal: 1200,
    elevTol: 500,
    phIdeal: 6.0,
    phTol: 1.0,
    ndviIdeal: 0.25,
    ndviTol: 0.3,
    slopeMax: 40,
    nitrogenIdeal: 5.0,
    nitrogenTol: 3.0,
    omIdeal: 3.5,
    omTol: 2.0,
    base: 93,
  },
  {
    name: "Castanopsis indica (Katus)",
    reason: "Broadleaf evergreen dominant in moist subtropical forests; high biodiversity value.",
    elevIdeal: 1500,
    elevTol: 400,
    phIdeal: 5.5,
    phTol: 0.8,
    ndviIdeal: 0.5,
    ndviTol: 0.2,
    slopeMax: 30,
    nitrogenIdeal: 5.0,
    nitrogenTol: 2.5,
    omIdeal: 5.0,
    omTol: 2.0,
    base: 91,
  },
  {
    name: "Michelia champaca (Champ)",
    reason: "Valuable timber and fragrant flowering tree of warm subtropical valleys.",
    elevIdeal: 1000,
    elevTol: 300,
    phIdeal: 6.0,
    phTol: 0.8,
    ndviIdeal: 0.45,
    ndviTol: 0.2,
    slopeMax: 25,
    nitrogenIdeal: 5.0,
    nitrogenTol: 2.0,
    omIdeal: 5.0,
    omTol: 2.0,
    base: 87,
  },
  {
    name: "Myrica esculenta (Kafal)",
    reason: "Native mid-hill fruit tree that supports birds and small mammals.",
    elevIdeal: 1600,
    elevTol: 400,
    phIdeal: 5.8,
    phTol: 0.8,
    ndviIdeal: 0.4,
    ndviTol: 0.25,
    slopeMax: 30,
    nitrogenIdeal: 4.0,
    nitrogenTol: 2.5,
    omIdeal: 4.0,
    omTol: 2.0,
    base: 85,
  },
  {
    name: "Quercus lanata (Banjh Oak)",
    reason: "Dominant temperate oak; robust carbon store and fodder resource in montane Nepal.",
    elevIdeal: 2300,
    elevTol: 500,
    phIdeal: 5.5,
    phTol: 0.8,
    ndviIdeal: 0.55,
    ndviTol: 0.2,
    slopeMax: 35,
    nitrogenIdeal: 5.0,
    nitrogenTol: 2.5,
    omIdeal: 6.0,
    omTol: 2.0,
    base: 95,
  },
  {
    name: "Rhododendron arboreum (Lali Gurans)",
    reason: "National flower; thrives in acidic montane soils and supports pollinator diversity.",
    elevIdeal: 2400,
    elevTol: 500,
    phIdeal: 4.8,
    phTol: 0.6,
    ndviIdeal: 0.5,
    ndviTol: 0.2,
    slopeMax: 40,
    nitrogenIdeal: 3.5,
    nitrogenTol: 2.0,
    omIdeal: 7.0,
    omTol: 2.5,
    base: 92,
  },
  {
    name: "Betula alnoides (Saur Salla Birch)",
    reason: "Pioneer birch that regenerates degraded upper-temperate slopes quickly.",
    elevIdeal: 2500,
    elevTol: 400,
    phIdeal: 5.5,
    phTol: 0.8,
    ndviIdeal: 0.3,
    ndviTol: 0.3,
    slopeMax: 40,
    nitrogenIdeal: 4.0,
    nitrogenTol: 2.5,
    omIdeal: 5.0,
    omTol: 2.0,
    base: 90,
  },
  {
    name: "Acer campbellii (Maple)",
    reason: "Broadleaf maple adding structural diversity and autumn forage to temperate forests.",
    elevIdeal: 2200,
    elevTol: 400,
    phIdeal: 5.8,
    phTol: 0.8,
    ndviIdeal: 0.45,
    ndviTol: 0.2,
    slopeMax: 30,
    nitrogenIdeal: 4.5,
    nitrogenTol: 2.0,
    omIdeal: 5.5,
    omTol: 2.0,
    base: 88,
  },
  {
    name: "Lyonia ovalifolia (Angeri)",
    reason: "Ericaceous understorey shrub-tree that restores acidic montane forest understoreys.",
    elevIdeal: 2000,
    elevTol: 400,
    phIdeal: 5.0,
    phTol: 0.7,
    ndviIdeal: 0.4,
    ndviTol: 0.25,
    slopeMax: 35,
    nitrogenIdeal: 3.0,
    nitrogenTol: 2.0,
    omIdeal: 6.0,
    omTol: 2.5,
    base: 86,
  },
  {
    name: "Prunus cerasoides (Paiyun / Wild Cherry)",
    reason: "Wildlife-friendly fruiting tree suited to mid-montane valley edges.",
    elevIdeal: 2000,
    elevTol: 500,
    phIdeal: 6.0,
    phTol: 0.8,
    ndviIdeal: 0.4,
    ndviTol: 0.25,
    slopeMax: 30,
    nitrogenIdeal: 4.0,
    nitrogenTol: 2.5,
    omIdeal: 4.5,
    omTol: 2.0,
    base: 84,
  },
  {
    name: "Abies spectabilis (Talispatra / Himalayan Fir)",
    reason: "Dominant subalpine conifer forming dense stands near the treeline.",
    elevIdeal: 3500,
    elevTol: 600,
    phIdeal: 5.5,
    phTol: 0.8,
    ndviIdeal: 0.5,
    ndviTol: 0.2,
    slopeMax: 35,
    nitrogenIdeal: 3.5,
    nitrogenTol: 2.0,
    omIdeal: 8.0,
    omTol: 3.0,
    base: 95,
  },
  {
    name: "Betula utilis (Bhojpatra / Himalayan Birch)",
    reason: "Key treeline species; pioneer on glacial moraines and avalanche tracks.",
    elevIdeal: 3800,
    elevTol: 600,
    phIdeal: 5.0,
    phTol: 0.7,
    ndviIdeal: 0.3,
    ndviTol: 0.25,
    slopeMax: 40,
    nitrogenIdeal: 3.0,
    nitrogenTol: 2.0,
    omIdeal: 7.0,
    omTol: 3.0,
    base: 93,
  },
  {
    name: "Rhododendron campanulatum (Bell Gurans)",
    reason: "Subalpine rhododendron that stabilises steep rocky terrain above 3 000 m.",
    elevIdeal: 4000,
    elevTol: 600,
    phIdeal: 4.5,
    phTol: 0.6,
    ndviIdeal: 0.25,
    ndviTol: 0.2,
    slopeMax: 45,
    nitrogenIdeal: 2.5,
    nitrogenTol: 1.5,
    omIdeal: 9.0,
    omTol: 3.0,
    base: 91,
  },
  {
    name: "Pinus wallichiana (Gobre Sallo / Blue Pine)",
    reason: "Tall subalpine pine well adapted to rocky, well-drained high-altitude soils.",
    elevIdeal: 3200,
    elevTol: 600,
    phIdeal: 5.8,
    phTol: 0.8,
    ndviIdeal: 0.35,
    ndviTol: 0.25,
    slopeMax: 35,
    nitrogenIdeal: 3.0,
    nitrogenTol: 2.0,
    omIdeal: 5.0,
    omTol: 2.5,
    base: 89,
  },
  {
    name: "Juniperus recurva (Dhup Salla / Drooping Juniper)",
    reason: "Drought- and cold-tolerant juniper; crucial ground cover above 3 500 m.",
    elevIdeal: 4200,
    elevTol: 700,
    phIdeal: 6.5,
    phTol: 1.0,
    ndviIdeal: 0.15,
    ndviTol: 0.2,
    slopeMax: 50,
    nitrogenIdeal: 2.0,
    nitrogenTol: 1.5,
    omIdeal: 4.0,
    omTol: 3.0,
    base: 87,
  },
  {
    name: "Sorbus microphylla (Himalayan Whitebeam)",
    reason: "Small subalpine tree providing berries for wildlife near the treeline.",
    elevIdeal: 3500,
    elevTol: 500,
    phIdeal: 5.5,
    phTol: 0.8,
    ndviIdeal: 0.25,
    ndviTol: 0.25,
    slopeMax: 40,
    nitrogenIdeal: 2.5,
    nitrogenTol: 2.0,
    omIdeal: 6.0,
    omTol: 2.5,
    base: 85,
  },
  {
    name: "Bambusa nutans (Mal Bans)",
    reason: "Rapid slope-binding bamboo; excellent soil reinforcement on steeper terrain.",
    elevIdeal: 800,
    elevTol: 700,
    phIdeal: 6.0,
    phTol: 1.2,
    ndviIdeal: 0.3,
    ndviTol: 0.3,
    slopeMax: 50,
    nitrogenIdeal: 4.0,
    nitrogenTol: 3.0,
    omIdeal: 3.5,
    omTol: 2.5,
    base: 88,
  },
  {
    name: "Celtis australis (Khari / Nettle Tree)",
    reason: "Versatile native tree for multi-strata restoration on moderately stable ground.",
    elevIdeal: 1000,
    elevTol: 800,
    phIdeal: 6.5,
    phTol: 1.2,
    ndviIdeal: 0.35,
    ndviTol: 0.3,
    slopeMax: 30,
    nitrogenIdeal: 4.0,
    nitrogenTol: 3.0,
    omIdeal: 4.0,
    omTol: 2.5,
    base: 86,
  },
];

const levelMeta = {
  high: { label: "High", color: "#22c55e", ring: "rgba(34, 197, 94, 0.25)" },
  moderate: { label: "Moderate", color: "#eab308", ring: "rgba(234, 179, 8, 0.28)" },
  low: { label: "Low", color: "#f97316", ring: "rgba(249, 115, 22, 0.26)" },
  poor: { label: "Poor", color: "#ef4444", ring: "rgba(239, 68, 68, 0.24)" },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function gaussian(value, ideal, tolerance) {
  const exponent = -((value - ideal) ** 2) / (2 * tolerance ** 2);
  return Math.exp(clamp(exponent, -10, 0));
}

function scoreTree(tree, environment) {
  const elevation = environment?.elevation?.elevation ?? 0;
  const slope = environment?.slope ?? 0;
  const ndvi = environment?.ndvi ?? 0;
  const soil = environment?.soil ?? {};
  const ph = soil.ph ?? 0;
  const nitrogen = soil.nitrogen ?? 0;
  const organicMatter = soil.organic_matter ?? 0;

  const elevFit = gaussian(elevation, tree.elevIdeal, tree.elevTol);
  const phFit = gaussian(ph, tree.phIdeal, tree.phTol);
  const ndviFit = gaussian(ndvi, tree.ndviIdeal, tree.ndviTol);
  const nitrogenFit = gaussian(nitrogen, tree.nitrogenIdeal, tree.nitrogenTol);
  const omFit = gaussian(organicMatter, tree.omIdeal, tree.omTol);
  const slopeFit = clamp(1.0 - Math.max(0, slope - tree.slopeMax) / 30.0, 0, 1);

  const composite =
    0.3 * elevFit +
    0.2 * phFit +
    0.18 * ndviFit +
    0.14 * slopeFit +
    0.1 * nitrogenFit +
    0.08 * omFit;

  return clamp(Math.round(tree.base * composite), 30, 97);
}

function getFeasibilityLevel(score) {
  if (score >= 75) {
    return "high";
  }
  if (score >= 60) {
    return "moderate";
  }
  if (score >= 45) {
    return "low";
  }
  return "poor";
}

function makeMarkerIcon(color, ring) {
  return new L.DivIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:${color};box-shadow:0 0 0 8px ${ring},0 10px 22px ${ring};border:1px solid rgba(255,255,255,0.85);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function BoundsHandler() {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(NEPAL_BOUNDS, { padding: [24, 24] });
  }, [map]);

  return null;
}

function ZoomControls() {
  const map = useMap();

  useEffect(() => {
    const control = L.control.zoom({ position: "bottomright" });
    control.addTo(map);
    return () => control.remove();
  }, [map]);

  return null;
}

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(event) {
      onMapClick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}

export default function TreeMapSimulator() {
  const [markers, setMarkers] = useState([]);
  const [activePoint, setActivePoint] = useState(null);
  const [environment, setEnvironment] = useState(null);
  const [scoredTrees, setScoredTrees] = useState([]);
  const [pendingTreeName, setPendingTreeName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const draftedIcon = useMemo(() => makeMarkerIcon("#3b82f6", "rgba(59, 130, 246, 0.25)"), []);

  const handleMapClick = async (point) => {
    setActivePoint(point);
    setEnvironment(null);
    setScoredTrees([]);
    setPendingTreeName("");
    setError("");
    setLoading(true);

    try {
      const response = await getEnvironment(point.lat, point.lng);
      const env = response.data;
      const allScored = treeProfiles
        .map((tree) => {
          const score = scoreTree(tree, env);
          const level = getFeasibilityLevel(score);
          return {
            ...tree,
            score,
            level,
          };
        })
        .sort((a, b) => b.score - a.score);

      setEnvironment(env);
      setScoredTrees(allScored);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Unable to fetch environmental data.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlantTree = () => {
    if (!activePoint || !pendingTreeName) {
      return;
    }

    const selectedTree = scoredTrees.find((tree) => tree.name === pendingTreeName);
    if (!selectedTree) {
      return;
    }

    const meta = levelMeta[selectedTree.level];
    const nextMarker = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      lat: activePoint.lat,
      lng: activePoint.lng,
      treeName: selectedTree.name,
      score: selectedTree.score,
      levelLabel: meta.label,
      icon: makeMarkerIcon(meta.color, meta.ring),
    };

    setMarkers((prev) => [...prev, nextMarker]);
    setPendingTreeName("");
  };

  return (
    <PageShell
      title="Tree Map Simulator"
      subtitle="Click a point first, evaluate all available trees for that exact environment, then plant one with a feasibility color marker."
      loading={false}
      error={""}
      action={
        <span style={{ background: "var(--page-surface-strong)", color: "var(--page-accent)", border: "1px solid var(--page-accent-soft)", borderRadius: 100, padding: "6px 14px", fontSize: "0.8rem", fontWeight: 600 }}>
          {markers.length} planted markers
        </span>
      }
    >
      <style>{`
        .tree-sim-root { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(360px, 1fr); gap: 18px; }
        .tree-map-card { background: var(--page-surface-strong); border: 1px solid var(--page-border); border-radius: 24px; overflow: hidden; box-shadow: 0 18px 48px var(--page-shadow); }
        .tree-map-head { padding: 14px 16px; border-bottom: 1px solid var(--page-border); display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .tree-map-title { font-size: 1rem; font-weight: 700; color: var(--page-text); }
        .tree-map-subtitle { font-size: 0.78rem; color: var(--page-muted); margin-top: 2px; }
        .tree-map-badge { border-radius: 999px; border: 1px solid var(--page-accent-soft); color: var(--page-accent); background: var(--page-surface); padding: 5px 10px; font-size: 0.73rem; font-weight: 700; }
        .tree-map-shell .leaflet-container { height: 620px; width: 100%; }
        .tree-side-card { background: var(--page-surface-strong); border: 1px solid var(--page-border); border-radius: 24px; box-shadow: 0 18px 48px var(--page-shadow); display: flex; flex-direction: column; min-height: 620px; }
        .tree-side-head { padding: 16px; border-bottom: 1px solid var(--page-border); }
        .tree-side-title { font-size: 1rem; font-weight: 700; color: var(--page-text); }
        .tree-side-subtitle { margin-top: 4px; font-size: 0.82rem; color: var(--page-muted); line-height: 1.5; }
        .tree-side-body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
        .tree-state-card { border: 1px solid var(--page-border); border-radius: 14px; background: var(--page-surface); padding: 12px; }
        .tree-state-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: var(--page-accent); margin-bottom: 6px; }
        .tree-state-value { font-size: 0.86rem; color: var(--page-text); }
        .tree-error { border: 1px solid rgba(248, 113, 113, 0.35); background: rgba(127, 29, 29, 0.08); border-radius: 12px; color: #f87171; font-size: 0.82rem; padding: 10px 12px; }
        .tree-list { display: flex; flex-direction: column; gap: 10px; max-height: 320px; overflow-y: auto; padding-right: 4px; }
        .tree-item { border: 1px solid var(--page-border); border-radius: 14px; padding: 10px 12px; background: var(--page-surface); cursor: pointer; transition: transform 0.15s ease, border-color 0.2s ease; }
        .tree-item:hover { transform: translateY(-1px); border-color: var(--page-accent-soft); }
        .tree-item.active { border-color: var(--page-accent-soft); box-shadow: 0 8px 20px var(--page-shadow); }
        .tree-item-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .tree-item-name { font-size: 0.86rem; color: var(--page-text); font-weight: 700; line-height: 1.3; text-align: left; }
        .tree-score-pill { border-radius: 999px; padding: 4px 9px; font-size: 0.72rem; font-weight: 700; color: #052e16; }
        .tree-item-reason { margin-top: 6px; font-size: 0.76rem; line-height: 1.45; color: var(--page-muted); text-align: left; }
        .tree-plant-btn { border: none; border-radius: 14px; background: var(--page-accent); color: #052e16; font-size: 0.86rem; font-weight: 700; padding: 11px 14px; cursor: pointer; transition: transform 0.15s ease, opacity 0.2s ease; }
        .tree-plant-btn:hover { transform: translateY(-1px); }
        .tree-plant-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
        .tree-legend { display: flex; flex-wrap: wrap; gap: 8px; }
        .tree-legend-item { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--page-border); border-radius: 999px; background: var(--page-surface); padding: 5px 9px; font-size: 0.72rem; color: var(--page-text); }
        .tree-dot { width: 9px; height: 9px; border-radius: 999px; }
        @media (max-width: 1080px) {
          .tree-sim-root { grid-template-columns: 1fr; }
          .tree-map-shell .leaflet-container { height: 500px; }
          .tree-side-card { min-height: initial; }
        }
      `}</style>

      <div className="tree-sim-root">
        <div className="tree-map-card">
          <div className="tree-map-head">
            <div>
              <div className="tree-map-title">Planting Map</div>
              <div className="tree-map-subtitle">Click to evaluate and plant at any Nepal location.</div>
            </div>
            <div className="tree-map-badge">{markers.length} planted</div>
          </div>
          <div className="tree-map-shell">
            <MapContainer
              center={[DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng]}
              zoom={7}
              zoomControl={false}
              scrollWheelZoom={true}
              doubleClickZoom={true}
              touchZoom={true}
              className="h-full w-full"
            >
              <BoundsHandler />
              <ZoomControls />
              <ClickHandler onMapClick={handleMapClick} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {markers.map((marker) => (
                <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={marker.icon}>
                  <Popup>
                    <strong>{marker.treeName}</strong>
                    <br />
                    Feasibility: {marker.score}% ({marker.levelLabel})
                    <br />
                    {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
                  </Popup>
                </Marker>
              ))}
              {activePoint ? (
                <Marker position={[activePoint.lat, activePoint.lng]} icon={draftedIcon}>
                  <Popup>
                    Candidate location
                    <br />
                    {activePoint.lat.toFixed(5)}, {activePoint.lng.toFixed(5)}
                  </Popup>
                </Marker>
              ) : null}
            </MapContainer>
          </div>
        </div>

        <div className="tree-side-card">
          <div className="tree-side-head">
            <div className="tree-side-title">Tree Feasibility Panel</div>
            <div className="tree-side-subtitle">
              Tree selection unlocks only after map click and environment fetch.
            </div>
          </div>
          <div className="tree-side-body">
            <div className="tree-state-card">
              <div className="tree-state-label">Current point</div>
              <div className="tree-state-value">
                {activePoint ? `${activePoint.lat.toFixed(4)}, ${activePoint.lng.toFixed(4)}` : "No location selected yet"}
              </div>
            </div>

            {environment ? (
              <div className="tree-state-card">
                <div className="tree-state-label">Environment snapshot</div>
                <div className="tree-state-value">Elevation: {environment.elevation?.elevation?.toFixed(0)} m</div>
                <div className="tree-state-value">Slope: {environment.slope?.toFixed(1)} deg</div>
                <div className="tree-state-value">NDVI: {environment.ndvi?.toFixed(3)}</div>
                <div className="tree-state-value">Soil pH: {environment.soil?.ph?.toFixed(2)}</div>
              </div>
            ) : null}

            <div className="tree-legend">
              {Object.values(levelMeta).map((item) => (
                <span className="tree-legend-item" key={item.label}>
                  <span className="tree-dot" style={{ background: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>

            {loading ? <div className="tree-state-card tree-state-value">Scoring all trees for this location...</div> : null}
            {error ? <div className="tree-error">{error}</div> : null}

            <div className="tree-list">
              {scoredTrees.length ? (
                scoredTrees.map((tree) => {
                  const meta = levelMeta[tree.level];
                  const isActive = pendingTreeName === tree.name;
                  return (
                    <button
                      type="button"
                      className={`tree-item${isActive ? " active" : ""}`}
                      key={tree.name}
                      onClick={() => setPendingTreeName(tree.name)}
                    >
                      <div className="tree-item-top">
                        <div className="tree-item-name">{tree.name}</div>
                        <span className="tree-score-pill" style={{ background: meta.color }}>
                          {tree.score}%
                        </span>
                      </div>
                      <div className="tree-item-reason">{tree.reason}</div>
                    </button>
                  );
                })
              ) : (
                <div className="tree-state-card tree-state-value">
                  Click the map to fetch environmental data and score all trees.
                </div>
              )}
            </div>

            <button
              type="button"
              className="tree-plant-btn"
              disabled={!activePoint || !pendingTreeName || !scoredTrees.length || loading}
              onClick={handlePlantTree}
            >
              Plant selected tree
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
