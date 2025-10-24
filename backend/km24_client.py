"""
KM24 API Client

Wrapper for KM24 API til at hente moduler, oprette steps og hente hits.
"""

import httpx
import logging
from typing import Dict, List, Any, Optional
from pydantic import BaseModel

logger = logging.getLogger("km24_client")

KM24_BASE_URL = "https://km24.dk/api"


class KM24Module(BaseModel):
    """KM24 Module information."""
    id: int
    title: str
    emoji: str
    description: Optional[str] = None
    parts: List[Dict[str, Any]] = []


class KM24Part(BaseModel):
    """KM24 Module Part (filter)."""
    id: int
    name: str
    slug: str
    type: str


class KM24Client:
    """Client for interacting with KM24 API."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {"X-API-Key": api_key}
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers=self.headers
        )
        self._modules_cache: Optional[List[KM24Module]] = None

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

    async def get_modules(self, force_refresh: bool = False) -> List[KM24Module]:
        """
        Get all available KM24 modules.

        Args:
            force_refresh: Force refresh from API instead of using cache

        Returns:
            List of KM24 modules
        """
        if self._modules_cache and not force_refresh:
            return self._modules_cache

        try:
            response = await self.client.get(f"{KM24_BASE_URL}/modules/basic")
            response.raise_for_status()
            data = response.json()

            modules = [
                KM24Module(
                    id=m["id"],
                    title=m["title"],
                    emoji=m.get("emoji", "📊"),
                    description=m.get("description")
                )
                for m in data.get("items", [])
            ]

            self._modules_cache = modules
            logger.info(f"Loaded {len(modules)} modules from KM24")
            return modules

        except Exception as e:
            logger.error(f"Error fetching modules: {e}")
            raise

    async def get_module(self, module_id: int) -> KM24Module:
        """
        Get detailed information about a specific module including its parts (filters).

        Args:
            module_id: The module ID

        Returns:
            Module with parts
        """
        try:
            response = await self.client.get(f"{KM24_BASE_URL}/modules/basic/{module_id}")
            response.raise_for_status()
            data = response.json()

            module = KM24Module(
                id=data["id"],
                title=data["title"],
                emoji=data.get("emoji", "📊"),
                description=data.get("description"),
                parts=data.get("parts", [])
            )

            logger.info(f"Loaded module {module_id}: {module.title} with {len(module.parts)} parts")
            return module

        except Exception as e:
            logger.error(f"Error fetching module {module_id}: {e}")
            raise

    async def create_step(
        self,
        name: str,
        module_id: int,
        parts: List[Dict[str, Any]],
        lookback_days: int = 30
    ) -> Dict[str, Any]:
        """
        Create a new monitoring step.

        Args:
            name: Step name
            module_id: Module ID
            parts: List of filter parts, e.g. [{"modulePartId": 134, "values": ["København"]}]
            lookback_days: How many days back to look (1-90)

        Returns:
            Created step with ID
        """
        try:
            step_data = {
                "name": name,
                "moduleId": module_id,
                "lookbackDays": lookback_days,
                "parts": parts
            }

            response = await self.client.post(
                f"{KM24_BASE_URL}/steps/main",
                json=step_data
            )
            response.raise_for_status()
            step = response.json()

            logger.info(f"Created step {step['id']}: {name}")
            return step

        except Exception as e:
            logger.error(f"Error creating step: {e}")
            raise

    async def get_step_hits(
        self,
        step_id: int,
        page: int = 1,
        page_size: int = 50,
        ordering: str = "-hitDatetime"
    ) -> Dict[str, Any]:
        """
        Get hits from a step.

        Args:
            step_id: Step ID
            page: Page number
            page_size: Number of hits per page
            ordering: Sort order (default: newest first)

        Returns:
            Hits data with count and items
        """
        try:
            response = await self.client.get(
                f"{KM24_BASE_URL}/steps/main/hits/{step_id}",
                params={
                    "page": page,
                    "pageSize": page_size,
                    "ordering": ordering
                }
            )
            response.raise_for_status()
            hits = response.json()

            logger.info(f"Fetched {len(hits.get('items', []))} hits from step {step_id}")
            return hits

        except Exception as e:
            logger.error(f"Error fetching hits from step {step_id}: {e}")
            raise

    async def delete_step(self, step_id: int) -> None:
        """
        Delete a step.

        Args:
            step_id: Step ID to delete
        """
        try:
            response = await self.client.delete(f"{KM24_BASE_URL}/steps/main/{step_id}")
            response.raise_for_status()
            logger.info(f"Deleted step {step_id}")

        except Exception as e:
            logger.error(f"Error deleting step {step_id}: {e}")
            raise

    async def search_company(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for companies by name.

        Args:
            query: Company name search query

        Returns:
            List of company search results with CVR numbers
        """
        try:
            response = await self.client.get(
                f"{KM24_BASE_URL}/companies/add/search",
                params={"q": query}
            )
            response.raise_for_status()
            data = response.json()

            logger.info(f"Found {len(data.get('results', []))} companies for query: {query}")
            return data.get("results", [])

        except Exception as e:
            logger.error(f"Error searching companies: {e}")
            raise
