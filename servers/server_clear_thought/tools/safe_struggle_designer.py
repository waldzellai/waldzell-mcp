from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel

from ..core.base_tool import BaseTool


class SafeStruggleDesigner(BaseTool):
    slug = "safe_struggle_designer"
    endpoint_path = "/safe-struggle-designer"

    class InputSchema(BaseModel):
        skill: str
        current_level: int
        target_level: int
        constraints: Dict[str, Any] | None = None

    class OutputSchema(BaseModel):
        scaffold_steps: List[str]
        safety_measures: List[str]
        review_intervals: str

    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        steps = [
            f"Practice {payload['skill']} at level {lvl}"
            for lvl in range(payload["current_level"], payload["target_level"] + 1)
        ]
        measures = ["Take breaks", "Monitor progress"]
        return {
            "scaffold_steps": steps,
            "safety_measures": measures,
            "review_intervals": "weekly",
        }
