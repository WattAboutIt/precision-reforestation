from __future__ import annotations

import json
import re
from typing import Any, Dict, List

import httpx

from backend.config.settings import get_settings
from backend.models.schemas import AnalysisResult, EnvironmentData, SpeciesSuggestion


PROMPT_TEMPLATE = """You are an ecological restoration expert specializing in Himalayan ecosystems.

Analyze this land patch in Nepal:

Elevation: {elevation} meters  
Slope: {slope} degrees  
NDVI: {ndvi}  

Soil:
- pH: {ph}
- Nitrogen: {nitrogen}
- Clay: {clay}%
- Organic Matter: {organic_matter}%

Return STRICT JSON:

{
  "biodiversity_score": number (0-100),
  "erosion_risk": "Low | Medium | High",
  "carbon_potential": number (tons/year),
  "species": [
    {
      "name": string,
      "confidence": number (0-100),
      "reason": string
    }
  ],
  "insight": string
}
"""


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _species_from_environment(environment: EnvironmentData) -> List[SpeciesSuggestion]:
    elevation = environment.elevation.elevation
    slope = environment.slope
    ndvi = environment.ndvi
    soil = environment.soil
    species: List[SpeciesSuggestion] = []

    # ── Terai / tropical lowland  (<900 m) ───────────────────────────────────
    if elevation < 900:
        species.append(SpeciesSuggestion(
            name="Shorea robusta (Sal)",
            confidence=88,
            reason="Dominant low-elevation Terai species; thrives in warm, fertile alluvial soils.",
        ))
        species.append(SpeciesSuggestion(
            name="Dalbergia sissoo (Sisau)",
            confidence=82,
            reason="Fast-growing nitrogen-fixer ideal for riverine and degraded lowland restoration.",
        ))
        species.append(SpeciesSuggestion(
            name="Tectona grandis (Sagwan / Teak)",
            confidence=76,
            reason="High-value timber tree suited to moist tropical lowlands with deep loamy soils.",
        ))
        species.append(SpeciesSuggestion(
            name="Bombax ceiba (Simal)",
            confidence=74,
            reason="Pioneer deciduous tree that colonises disturbed Terai land quickly.",
        ))
        species.append(SpeciesSuggestion(
            name="Terminalia alata (Saj)",
            confidence=71,
            reason="Mixed Shorea-Saj forest associate; tolerates seasonally dry Terai conditions.",
        ))
        species.append(SpeciesSuggestion(
            name="Acacia catechu (Khair)",
            confidence=69,
            reason="Drought-hardy agroforestry species common in Terai buffer-zone plantations.",
        ))

    # ── Subtropical mid-hills (900–1 800 m) ──────────────────────────────────
    elif elevation < 1800:
        species.append(SpeciesSuggestion(
            name="Pinus roxburghii (Khote Sallo / Chir Pine)",
            confidence=88,
            reason="Dominant mid-elevation pine; resilient on disturbed, dry south-facing slopes.",
        ))
        species.append(SpeciesSuggestion(
            name="Alnus nepalensis (Utis / Himalayan Alder)",
            confidence=84,
            reason="Nitrogen-fixing pioneer; rapidly stabilises landslide scars and eroded hillsides.",
        ))
        species.append(SpeciesSuggestion(
            name="Castanopsis indica (Katus)",
            confidence=80,
            reason="Broadleaf evergreen dominant in moist subtropical forests; high biodiversity value.",
        ))
        species.append(SpeciesSuggestion(
            name="Schima wallichii (Chilaune)",
            confidence=78,
            reason="Fire-tolerant broadleaf associate of Chir Pine; enriches mixed forest structure.",
        ))
        species.append(SpeciesSuggestion(
            name="Michelia champaca (Champ)",
            confidence=73,
            reason="Valuable timber and fragrant flowering tree of warm subtropical valleys.",
        ))
        species.append(SpeciesSuggestion(
            name="Myrica esculenta (Kafal)",
            confidence=70,
            reason="Native mid-hill fruit tree that supports birds and small mammals.",
        ))

    # ── Temperate / montane (1 800–2 800 m) ──────────────────────────────────
    elif elevation < 2800:
        species.append(SpeciesSuggestion(
            name="Quercus lanata (Banjh Oak)",
            confidence=87,
            reason="Dominant temperate oak; robust carbon store and fodder resource in montane Nepal.",
        ))
        species.append(SpeciesSuggestion(
            name="Rhododendron arboreum (Lali Gurans)",
            confidence=82,
            reason="National flower; thrives in acidic montane soils and supports pollinator diversity.",
        ))
        species.append(SpeciesSuggestion(
            name="Betula alnoides (Saur Salla Birch)",
            confidence=78,
            reason="Pioneer birch that regenerates degraded upper-temperate slopes quickly.",
        ))
        species.append(SpeciesSuggestion(
            name="Acer campbellii (Maple)",
            confidence=75,
            reason="Broadleaf maple adding structural diversity and autumn forage to temperate forests.",
        ))
        species.append(SpeciesSuggestion(
            name="Lyonia ovalifolia (Angeri)",
            confidence=72,
            reason="Ericaceous understorey shrub-tree that restores acidic montane forest understoreys.",
        ))
        species.append(SpeciesSuggestion(
            name="Prunus cerasoides (Paiyun / Wild Cherry)",
            confidence=69,
            reason="Wildlife-friendly fruiting tree suited to mid-montane valley edges.",
        ))

    # ── Subalpine / alpine (≥2 800 m) ────────────────────────────────────────
    else:
        species.append(SpeciesSuggestion(
            name="Abies spectabilis (Talispatra / Himalayan Fir)",
            confidence=87,
            reason="Dominant subalpine conifer forming dense stands near the treeline.",
        ))
        species.append(SpeciesSuggestion(
            name="Betula utilis (Bhojpatra / Himalayan Birch)",
            confidence=83,
            reason="Key treeline species; pioneer on glacial moraines and avalanche tracks.",
        ))
        species.append(SpeciesSuggestion(
            name="Rhododendron campanulatum (Bell Gurans)",
            confidence=79,
            reason="Subalpine rhododendron that stabilises steep rocky terrain above 3 000 m.",
        ))
        species.append(SpeciesSuggestion(
            name="Pinus wallichiana (Gobre Sallo / Blue Pine)",
            confidence=76,
            reason="Tall subalpine pine well adapted to rocky, well-drained high-altitude soils.",
        ))
        species.append(SpeciesSuggestion(
            name="Juniperus recurva (Dhup Salla / Drooping Juniper)",
            confidence=73,
            reason="Drought- and cold-tolerant juniper; crucial ground cover above 3 500 m.",
        ))
        species.append(SpeciesSuggestion(
            name="Sorbus microphylla (Himalayan Whitebeam)",
            confidence=68,
            reason="Small subalpine tree providing berries for wildlife near the treeline.",
        ))

    # ── Cross-cutting modifiers (add up to 2 extra species) ──────────────────
    extra: List[SpeciesSuggestion] = []

    if ndvi > 0.45 and soil.organic_matter > 4:
        extra.append(SpeciesSuggestion(
            name="Schima wallichii (Chilaune)",
            confidence=76,
            reason="Thrives where canopy recovery and mixed broadleaf structure are already emerging.",
        ))
    if slope > 20:
        extra.append(SpeciesSuggestion(
            name="Bambusa nutans (Mal Bans)",
            confidence=75,
            reason="Rapid slope-binding bamboo; excellent soil reinforcement on steeper terrain.",
        ))
    if soil.ph < 5.5:
        extra.append(SpeciesSuggestion(
            name="Rhododendron arboreum (Lali Gurans)",
            confidence=74,
            reason="Acid-tolerant native broadleaf; supports biodiversity on low-pH soils.",
        ))
    if soil.nitrogen > 6:
        extra.append(SpeciesSuggestion(
            name="Alnus nepalensis (Utis)",
            confidence=73,
            reason="Nitrogen-fixer that thrives and further enriches high-nitrogen riparian soils.",
        ))
    if not extra:
        extra.append(SpeciesSuggestion(
            name="Celtis australis (Khari / Nettle Tree)",
            confidence=72,
            reason="Versatile native tree for multi-strata restoration on moderately stable ground.",
        ))

    # Deduplicate by name, primary zone list takes priority
    seen = {s.name for s in species}
    for e in extra:
        if e.name not in seen:
            species.append(e)
            seen.add(e.name)

    # Return top 5 sorted by confidence
    species.sort(key=lambda s: s.confidence, reverse=True)
    return species[:5]


def _strip_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text


async def _call_claude(prompt: str) -> Dict[str, Any]:
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not configured")

    headers = {
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = {
        "model": settings.anthropic_model,
        "max_tokens": 900,
        "temperature": 0.2,
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
    }
    timeout = httpx.Timeout(settings.api_timeout_seconds)
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        content = data.get("content") or []
        text_parts = [block.get("text", "") for block in content if isinstance(block, dict)]
        return json.loads(_strip_json("".join(text_parts)))


def _fallback_analysis(environment: EnvironmentData) -> AnalysisResult:
    species = _species_from_environment(environment)
    slope = environment.slope
    ndvi = environment.ndvi
    soil = environment.soil
    biodiversity_score = _clamp(
        28.0
        + max(0.0, 32.0 - abs(slope - 12.0))
        + max(0.0, (ndvi + 0.15) * 38.0)
        + max(0.0, (soil.organic_matter - 2.5) * 3.5),
        0.0,
        100.0,
    )
    erosion_risk = "High" if slope >= 25 else "Medium" if slope >= 12 else "Low"
    carbon_potential = round(
        max(0.5, (soil.organic_matter * 0.9) + max(0.0, ndvi + 0.05) * 6.5 + max(0.0, 18.0 - slope) * 0.06),
        2,
    )
    insight = (
        f"Estimated fallback analysis for {environment.terrain_class.lower()} terrain. "
        f"Prioritize {species[0].name} and {species[1].name} with erosion control where slope is {slope:.1f}°."
    )
    return AnalysisResult(
        biodiversity_score=round(biodiversity_score, 1),
        erosion_risk=erosion_risk,
        carbon_potential=carbon_potential,
        species=species,
        insight=insight,
        environment=environment,
    )


def _build_prompt(environment: EnvironmentData) -> str:
    return PROMPT_TEMPLATE.format(
        elevation=round(environment.elevation.elevation, 2),
        slope=round(environment.slope, 2),
        ndvi=round(environment.ndvi, 3),
        ph=round(environment.soil.ph, 2),
        nitrogen=round(environment.soil.nitrogen, 3),
        clay=round(environment.soil.clay, 2),
        organic_matter=round(environment.soil.organic_matter, 2),
    )


async def analyze_with_claude(environment: EnvironmentData) -> AnalysisResult:
    try:
        raw = await _call_claude(_build_prompt(environment))
        species = [SpeciesSuggestion(**item) for item in raw.get("species", [])]
        return AnalysisResult(
            biodiversity_score=float(raw["biodiversity_score"]),
            erosion_risk=raw["erosion_risk"],
            carbon_potential=float(raw["carbon_potential"]),
            species=species[:5],
            insight=str(raw["insight"]),
            environment=environment,
        )
    except Exception:
        return _fallback_analysis(environment)