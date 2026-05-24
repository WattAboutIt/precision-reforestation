from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.models.schemas import AnalysisRequest, AnalysisResult, PrescriptionResponse, PrescriptionRecommendation
from backend.routers.environment import get_environment
from backend.services.ai_service import analyze_with_claude
from ml_pipeline.predict import predict_species_suitability

router = APIRouter(prefix="/analyze", tags=["analysis"])


@router.post("", response_model=AnalysisResult)
async def analyze_patch(request: AnalysisRequest) -> AnalysisResult:
    environment = await get_environment(request.lat, request.lng)
    return await analyze_with_claude(environment)


@router.post("/prescribe", response_model=PrescriptionResponse)
def prescribe_species(request: AnalysisRequest) -> PrescriptionResponse:
    """
    Model-specific endpoint that queries the FeatureProvider and ML model directly
    to return a ranked tree species recommendation with confidence scores and explanations.
    """
    try:
        res = predict_species_suitability(request.lat, request.lng)
        return PrescriptionResponse(
            location={
                "latitude": res["location"]["latitude"],
                "longitude": res["location"]["longitude"]
            },
            features=res["features"],
            recommendations=[
                PrescriptionRecommendation(
                    species=rec["species"],
                    score=rec["score"],
                    reasons=rec["reasons"]
                ) for rec in res["recommendations"]
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
