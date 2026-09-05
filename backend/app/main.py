"""Main FastAPI application for QWANTA — A Fleet Decision Engine."""
from contextlib import asynccontextmanager
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from backend.app.api.endpoints import router as api_router
from backend.app.services.fleet_service import fleet_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("QWANTA")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize DB tables, seed catalog, and prepare ML models on boot."""
    logger.info("Initializing QWANTA SQLite Database...")
    try:
        from backend.app.db.database import init_db, SessionLocal
        from backend.app.db.seed import seed_default_data
        init_db()
        db = SessionLocal()
        try:
            seed_default_data(db)
        finally:
            db.close()
        logger.info("Database initialized and default assets seeded.")
    except Exception as e:
        logger.error(f"Error initializing Database: {e}", exc_info=True)

    logger.info("Initializing QWANTA ML & Physics Engine...")
    try:
        fleet_service.initialize_ml_engine(
            data_path="data/GreenQ_Fleet_ALL_IN_ONE.csv",
            models_dir="models"
        )
        best = fleet_service.model_registry.best_model_name
        logger.info(f"System initialized. Dynamically ranked best model: {best}")
    except Exception as e:
        logger.error(f"Error initializing ML engine: {e}", exc_info=True)

    yield
    logger.info("Shutting down QWANTA backend service.")


app = FastAPI(
    title="QWANTA API",
    description="Quantum-Inspired Fleet Decision Engine for Maritime Fuel Optimization and Green Logistics (SIH26138).",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach API endpoints
app.include_router(api_router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler avoiding leaking internal stack traces to users."""
    logger.error(f"Unhandled error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "InternalServerError", "message": "An unexpected server error occurred. Please verify your inputs."}
    )


@app.get("/")
def root():
    best_model = fleet_service.model_registry.best_model_name if fleet_service.model_registry else "Extra Trees"
    return {
        "name": "QWANTA — A Fleet Decision Engine",
        "tagline": "Quantum-Inspired Maritime Fuel Optimization & Green Logistics",
        "problem_id": "SIH26138",
        "organization": "Egreen Quanta",
        "best_model": best_model,
        "docs_url": "/docs",
        "health_check": "/api/health"
    }


if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
