"""
KM24 Agent Backend

FastAPI backend der integrerer med Anthropic Claude og KM24 API
til at generere monitoring strategier.
"""

import os
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import logging
from contextlib import asynccontextmanager
import json
import re

from anthropic import Anthropic
from km24_client import KM24Client

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("km24_agent")

# Initialize clients
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
KM24_API_KEY = os.getenv("KM24_API_KEY")

if not ANTHROPIC_API_KEY or "your-key-here" in ANTHROPIC_API_KEY:
    logger.warning("ANTHROPIC_API_KEY not configured in .env")
    anthropic_client = None
else:
    anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)

if not KM24_API_KEY:
    logger.error("KM24_API_KEY not configured in .env")
    km24_client = None
else:
    km24_client = KM24Client(api_key=KM24_API_KEY)


# --- Lifespan context manager ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Setup and teardown for the application."""
    logger.info("Starting KM24 Agent backend...")
    # Load modules cache on startup
    if km24_client:
        try:
            await km24_client.get_modules()
            logger.info("KM24 modules cached successfully")
        except Exception as e:
            logger.error(f"Failed to cache modules: {e}")
    yield
    # Shutdown: cleanup
    if km24_client:
        await km24_client.close()
    logger.info("Shutting down KM24 Agent backend...")


# Initialize FastAPI app
app = FastAPI(
    title="KM24 Agent API",
    description="Backend for KM24 monitoring wizard",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)


# --- Request/Response Models ---
class GenerateRecipeRequest(BaseModel):
    goal: str = Field(..., description="Journalistisk mål for overvågning")


class Module(BaseModel):
    """Monitoring module configuration."""
    module_id: int = Field(..., description="KM24 module ID")
    module_name: str = Field(..., description="Module display name")
    filters: Dict[str, Any] = Field(default_factory=dict, description="Filter values")
    pedagogical_tip: Optional[str] = Field(None, description="Helpful tip for this module")


class Strategy(BaseModel):
    """Monitoring strategy."""
    name: str = Field(..., description="Strategy name")
    description: str = Field(..., description="Strategy explanation")
    estimated_hits_per_day: int = Field(..., description="Expected daily hits")
    modules: List[Module] = Field(..., description="Modules in this strategy")
    recommended: bool = Field(default=False, description="Whether this is the recommended strategy")


class MonitoringRecipe(BaseModel):
    """Complete monitoring recipe."""
    goal: str = Field(..., description="Original goal")
    strategies: List[Strategy] = Field(..., description="Available strategies")
    assessment: str = Field(..., description="AI assessment of the monitoring plan")


class ValidateFiltersRequest(BaseModel):
    module_id: int = Field(..., description="KM24 module ID")
    filters: Dict[str, Any] = Field(..., description="Filter configuration to validate")


class Hit(BaseModel):
    """Search result hit."""
    title: str = Field(..., description="Hit title")
    date: Optional[str] = Field(None, description="Publication date")
    summary: Optional[str] = Field(None, description="Hit summary")
    url: Optional[str] = Field(None, description="Hit URL")


class ValidationResult(BaseModel):
    """Result of filter validation."""
    is_valid: bool = Field(..., description="Whether filters are valid")
    sample_hits: List[Hit] = Field(default_factory=list, description="Sample hits")
    hit_count: int = Field(..., description="Estimated total hits")
    warnings: List[str] = Field(default_factory=list, description="Validation warnings")
    suggestions: List[str] = Field(default_factory=list, description="Suggestions for improvement")


class SearchHitsRequest(BaseModel):
    module_id: int = Field(..., description="KM24 module ID")
    filters: Dict[str, Any] = Field(..., description="Filter configuration")
    limit: int = Field(default=10, description="Maximum hits to return")


# --- Helper Functions ---
async def generate_recipe_with_ai(goal: str) -> MonitoringRecipe:
    """
    Generate monitoring recipe using Anthropic Claude.
    """
    if not anthropic_client:
        raise HTTPException(status_code=500, detail="Anthropic API not configured")

    if not km24_client:
        raise HTTPException(status_code=500, detail="KM24 API not configured")

    # Get available modules
    modules = await km24_client.get_modules()

    # Create module reference for prompt
    module_list = "\n".join([
        f"{m.id}. {m.title} {m.emoji}"
        for m in modules[:20]  # Include top 20 modules
    ])

    prompt = f"""Du er en ekspert i at hjælpe danske journalister med at opsætte overvågningsstrategier i KM24-platformen.

Journalistens mål: {goal}

Tilgængelige KM24 moduler (top 20):
{module_list}

Almindelige moduler inkluderer:
- Arbejdstilsyn (110) - overvåg påbud, forbud og afgørelser
- Udbud (280) - offentlige udbud og kontrakter
- Danske Medier (510) - medieovervågning
- Domme (250) - domme fra danske domstole
- Boligsiden (1400) - ejendomshandler

Generer 3 forskellige overvågningsstrategier baseret på målet. Hver strategi skal:
1. Have et klart, beskrivende navn (dansk)
2. Forklare tilgangen i 1-2 sætninger
3. Estimere antal hits per dag realistisk (10-100)
4. Liste 1-3 specifikke KM24-moduler
5. For hvert modul: angiv simple filtre (kommune, branche, søgeord)
6. Inkludere et pædagogisk tip
7. Én strategi skal markeres som anbefalet

VIGTIGT:
- Brug kun module_id fra listen ovenfor
- Hold filtre simple (brug kun: kommune, branche, søgeord)
- Giv konkrete værdier, ikke placeholders
- Vær realistisk med hit estimates

Returnér JSON i dette format:
{{
  "goal": "{goal}",
  "strategies": [
    {{
      "name": "Strateginavn",
      "description": "Forklaring af strategien",
      "estimated_hits_per_day": 25,
      "modules": [
        {{
          "module_id": 110,
          "module_name": "Arbejdstilsyn",
          "filters": {{
            "kommune": "København",
            "branche": "Byggeri"
          }},
          "pedagogical_tip": "Start bredt og indsnævr baseret på resultater"
        }}
      ],
      "recommended": true
    }}
  ],
  "assessment": "En kort vurdering af de foreslåede strategier og hvordan de adresserer målet"
}}
"""

    try:
        message = anthropic_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )

        # Extract JSON from response
        response_text = message.content[0].text

        # Try to extract JSON from markdown code block
        json_match = re.search(r'```json\n(.*?)\n```', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Try to find raw JSON
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                raise ValueError("Could not find JSON in response")

        recipe_data = json.loads(json_str)
        return MonitoringRecipe(**recipe_data)

    except Exception as e:
        logger.error(f"Error generating recipe with AI: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recipe: {str(e)}")


async def validate_filters_with_km24(module_id: int, filters: Dict[str, Any]) -> ValidationResult:
    """
    Validate filters by creating a temporary step and checking hits.
    """
    if not km24_client:
        raise HTTPException(status_code=500, detail="KM24 API not configured")

    try:
        # Get module details to build parts
        module = await km24_client.get_module(module_id)

        # Build part map
        part_map = {p["slug"]: p["id"] for p in module.parts}

        # Convert filters to parts
        parts = []
        for filter_name, filter_value in filters.items():
            if filter_value and filter_name in part_map:
                # Ensure value is a list
                values = [filter_value] if not isinstance(filter_value, list) else filter_value
                parts.append({
                    "modulePartId": part_map[filter_name],
                    "values": values
                })

        if not parts:
            return ValidationResult(
                is_valid=False,
                sample_hits=[],
                hit_count=0,
                warnings=["Ingen filtre valgt"],
                suggestions=["Tilføj mindst ét filter for at indsnævre søgningen"]
            )

        # Create temporary step
        step_name = f"__temp_validation_{module_id}"
        step = await km24_client.create_step(
            name=step_name,
            module_id=module_id,
            parts=parts,
            lookback_days=30
        )

        step_id = step["id"]

        # Get hits
        hits_data = await km24_client.get_step_hits(step_id, page_size=10)

        # Convert to our format
        sample_hits = [
            Hit(
                title=hit.get("title", "Untitled"),
                date=hit.get("hitDatetime"),
                summary=hit.get("summary", hit.get("description", "")),
                url=hit.get("url")
            )
            for hit in hits_data.get("items", [])[:3]
        ]

        hit_count = hits_data.get("count", 0)

        # Delete temporary step
        await km24_client.delete_step(step_id)

        # Generate warnings and suggestions
        warnings = []
        suggestions = []

        if hit_count == 0:
            warnings.append("Ingen hits fundet med disse filtre")
            suggestions.append("Prøv at udvide søgningen ved at fjerne nogle filtre")
        elif hit_count > 100:
            warnings.append(f"Meget høj hitrate ({hit_count} hits)")
            suggestions.append("Overvej at indsnævre med flere specifikke filtre")

        return ValidationResult(
            is_valid=hit_count > 0,
            sample_hits=sample_hits,
            hit_count=hit_count,
            warnings=warnings,
            suggestions=suggestions
        )

    except Exception as e:
        logger.error(f"Error validating filters: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to validate filters: {str(e)}")


# --- API Endpoints ---
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    km24_status = "ok" if km24_client else "not configured"
    anthropic_status = "ok" if anthropic_client else "not configured"

    # Try to ping KM24
    if km24_client:
        try:
            modules = await km24_client.get_modules()
            km24_modules_count = len(modules)
        except:
            km24_status = "error"
            km24_modules_count = 0
    else:
        km24_modules_count = 0

    return {
        "status": "ok",
        "anthropic_status": anthropic_status,
        "km24_status": km24_status,
        "km24_modules_count": km24_modules_count
    }


@app.post("/api/monitoring/generate-recipe", response_model=MonitoringRecipe)
async def generate_recipe(request: GenerateRecipeRequest):
    """
    Generate monitoring strategies based on a journalistic goal.
    """
    try:
        logger.info(f"Generating recipe for goal: {request.goal}")
        recipe = await generate_recipe_with_ai(request.goal)
        return recipe
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in generate_recipe: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/monitoring/validate-filters", response_model=ValidationResult)
async def validate_filters(request: ValidateFiltersRequest):
    """
    Validate filter configuration and return sample hits.
    """
    try:
        logger.info(f"Validating filters for module {request.module_id}: {request.filters}")
        result = await validate_filters_with_km24(request.module_id, request.filters)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in validate_filters: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/monitoring/search-hits", response_model=List[Hit])
async def search_hits(request: SearchHitsRequest):
    """
    Search for hits with given filter configuration.
    """
    try:
        logger.info(f"Searching hits for module {request.module_id} with limit {request.limit}")

        # Reuse validation logic to get hits
        validation = await validate_filters_with_km24(request.module_id, request.filters)

        # Return more hits if requested
        return validation.sample_hits[:request.limit]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in search_hits: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/modules")
async def get_modules():
    """
    Get available KM24 modules.
    """
    if not km24_client:
        raise HTTPException(status_code=500, detail="KM24 API not configured")

    try:
        modules = await km24_client.get_modules()
        return {
            "modules": [
                {
                    "id": m.id,
                    "title": m.title,
                    "emoji": m.emoji,
                    "description": m.description
                }
                for m in modules
            ]
        }
    except Exception as e:
        logger.error(f"Error getting modules: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8001"))

    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
