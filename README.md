# AI-Powered Ecological Restoration Intelligence Platform (Nepal)

This is a production-ready, GIS-aware machine learning recommendation system that suggests the most suitable tree species for reforestation at any geographic coordinate in Nepal.

It features a modular data pipeline, spatial cross-validation, and an explainable AI module, fully decoupled from the future Nepal Agricultural Research Council (NARC) API via a clean provider abstraction.

---

## System Architecture

The application is structured into three primary modules: the **Vite + React Frontend**, the **FastAPI Backend**, and the **ML Pipeline**.

```
├── backend/                  # FastAPI Application
│   ├── config/               # Settings & environment variables
│   ├── models/schemas.py     # Pydantic schemas (added PrescriptionResponse)
│   ├── routers/analysis.py   # Routers (added /analyze/prescribe endpoint)
│   ├── services/ai_service.py# AI orchestration (integrated ML predictions)
│   └── requirements.txt      # Backend dependencies (updated with ML libs)
│
├── ml_pipeline/              # Tree Prescriber ML Pipeline
│   ├── models/               # Serialized model and encoder outputs
│   ├── config.py             # Feature lists, boundaries, and paths
│   ├── provider.py           # FeatureProvider abstraction (Mock vs NARC stub)
│   ├── build_dataset.py      # Spatial data cleaning and join pipeline
│   ├── train.py              # Spatial group cross-validation & model training
│   ├── explain.py            # SHAP and ecological rules explainer
│   └── predict.py            # Inference coordinator and CLI
│
├── data/                     # Species Occurrences & Local Datasets
│   ├── Dalbergia sissoo/     # Real GBIF presence data for Sisau
│   └── Pinus roxburghii Sarg/# Real GBIF presence data for Salla
│
├── run_pipeline.py           # End-to-end automated runner & validation
├── requirements.txt          # Root project dependencies
└── README.md                 # Project documentation (this file)
```

---

## The ML Pipeline

### 1. Data Cleaning & Spatial Joining (`build_dataset.py`)
- Loads real occurrences for **Dalbergia sissoo** and **Pinus roxburghii** from local text files.
- Filters coordinates to ensure they fall strictly within the bounding box of Nepal (Lat: `26.3` to `30.5`, Lon: `80.0` to `88.2`).
- Filters out records with identified geospatial issues (`hasGeospatialIssues == True`).
- Filters out occurrences with high coordinate uncertainty (`coordinateUncertaintyInMeters > 1000m`).
- Deduplicates occurrences (by coordinates and species) to eliminate duplicate collection biases.
- For each coordinate, queries the active `FeatureProvider` to retrieve a complete environmental feature vector (pH, nitrogen, sand, clay, silt, elevation, parent soil, administrative region).

### 2. Feature Provider Abstraction (`provider.py`)
To ensure the pipeline can be upgraded later without code modification, we abstract feature fetching behind `FeatureProvider`:
- **`MockFeatureProvider`**: Generates deterministic, physical-geography-based soil and terrain parameters for Nepal coordinates (e.g. modelling elevation lapse rates and soil texture distributions). Used for development and training.
- **`NARCFeatureProvider` (Stub)**: Outlines the connection, caching (SQLite/Redis), and response parsing mechanisms. Ready for future API integration.

### 3. Feature Engineering (`feature_engineering.py`)
- **Elevation Bands**: Categorizes coordinates into geographic bands (Terai, Siwalik, Middle Hills, High Mountains, High Himalaya).
- **USDA Soil Texture**: Classifies clay, sand, and silt percentages into physical texture classes (e.g., Silty Clay, Sandy Loam).
- **Nutrient Ratios**: Calculates N/K, N/P, and OM/Clay ratios.
- **Geographic Clusters**: Applies `KMeans` to latitude/longitude coordinates to capture regional biogeographical groupings.
- **Climate Proxies**: Calculates temperature and precipitation estimates based on lapse rates and geography.

### 4. Model Training & Spatial CV (`train.py`)
- Employs **Spatial Group K-Fold Cross-Validation** (groups = KMeans spatial clusters) to evaluate model performance. This prevents spatial autocorrelation leakage, ensuring the model generalizes to unseen geographical regions.
- Compares **Random Forest**, **XGBoost**, and **LightGBM** classifiers.
- Evaluates models based on Accuracy, Macro F1-Score, and Top-2 accuracy.
- Exports the best-performing model to `ml_pipeline/models/tree_model.joblib`.

### 5. Explainability (`explain.py`)
- Uses **SHAP (Shapley Additive exPlanations)** values to isolate feature contributions pushing the model's classification score.
- Combines model values with **Expert Ecological Rules** (temperature lapse rates, pH preferences, soil drainage conditions) to build human-readable explanations of recommendations.

---

## API Endpoints

### 1. Unified Dashboard REST API
- `POST /analyze`
  Accepts: `{"lat": float, "lng": float}`
  Returns a full restoration report (`AnalysisResult`). The backend replaces the old rule heuristics by running predictions through the new ML pipeline and returning top recommendations with confidence percentages (0-100%) and explanations.

### 2. Model-Specific REST API
- `POST /analyze/prescribe`
  Accepts: `{"lat": float, "lng": float}`
  Returns the exact model-specific JSON recommendation:
  ```json
  {
    "location": { "latitude": 27.55, "longitude": 84.45 },
    "features": { ... },
    "recommendations": [
      {
        "species": "Dalbergia sissoo",
        "score": 0.95,
        "reasons": [
          "Elevation of 340m is within the optimal range (60-1000m) for Dalbergia sissoo.",
          "Soil pH (7.41) is optimal (preferred: 5.8-7.8) for this species.",
          "Soil texture 'Silty Clay Loam' provides the excellent drainage required by this species."
        ]
      }
    ]
  }
  ```

---

## How to Run

### Run the ML Pipeline End-to-End (Verification)
Execute the verification script to build or synthesize a dataset, train the model, and run a sample inference:
```bash
python -m ml_pipeline.verify_pipeline
```

### Run the Backend Server
Start the backend using uvicorn:
```bash
cd backend
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Run the Frontend Dashboard
Launch the Vite React dashboard:
```bash
cd frontend
npm install
npm run dev
```

---

## Future NARC API Integration TODO List

To replace the `MockFeatureProvider` with the real NARC API once it is ready:

1. **API Key Setup**: Add the `NARC_API_KEY` and `NARC_API_URL` to `backend/.env`.
2. **Settings Mapping**: Update `backend/config/settings.py` to parse the environment variables.
3. **Implement NARCFeatureProvider Methods**:
   - Open [ml_pipeline/provider.py](file:///c:/Users/Safal%20Neupane/precision%20reforestation/precision-reforestation/ml_pipeline/provider.py) and navigate to `NARCFeatureProvider`.
   - Implement `_check_cache` and `_write_cache` using `sqlite3` (or Redis) to cache coordinate requests (e.g. rounding lat/lon to 4 decimal places to capture a ~10-meter block).
   - In `get_features()`, implement the HTTP request using `requests` or `httpx` with a retry decorator (e.g. `tenacity`).
   - Implement `_normalize_response()` to map NARC API output fields to the exact keys defined in `config.NUMERIC_FEATURES` and `config.CATEGORICAL_FEATURES`.
4. **Switch Default Provider**:
   - Update `ml_pipeline/predict.py` or the backend routers to initialize `NARCFeatureProvider` as the active provider instance.
