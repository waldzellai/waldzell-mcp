from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel

from ..core.base_tool import BaseTool


class AnalogicalMapper(BaseTool):
    slug = "analogical_mapper"
    endpoint_path = "/analogical-mapper"

    class InputSchema(BaseModel):
        problem: str
        seed_domains: List[str] | None = None
        k: int | None = 3

    class OutputSchema(BaseModel):
        analogies: List[Dict[str, Any]]
        suggested_prompts: List[str]

    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        k = payload.get("k") or 3
        analogies = [
            {"domain": d, "analogy": f"{payload['problem']} ~ {d}"}
            for d in (payload.get("seed_domains") or ["math", "biology", "art"])[:k]
        ]
        prompts = [f"How would {a['domain']} approach it?" for a in analogies]
        return {
            "analogies": analogies,
            "suggested_prompts": prompts,
        }
