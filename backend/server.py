from fastapi import APIRouter, FastAPI

from models.health import HealthResponse


app = FastAPI(title="CashGPT Preview API")
api_router = APIRouter(prefix="/api")


@api_router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", service="cashgpt")


app.include_router(api_router)