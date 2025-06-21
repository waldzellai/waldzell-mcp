from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel

from ..core.base_tool import BaseTool


class ValueOfInformation(BaseTool):
    slug = "value_of_information"
    endpoint_path = "/value-of-information"

    class InputSchema(BaseModel):
        decision_options: List[str]
        uncertainties: List[str]
        payoffs: List[float]

    class OutputSchema(BaseModel):
        voi_score: float
        high_impact_questions: List[str]

    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        voi_score = sum(payload["payoffs"]) / (len(payload["uncertainties"]) or 1)
        questions = [f"Resolve {u}?" for u in payload["uncertainties"]]
        return {
            "voi_score": round(voi_score, 2),
            "high_impact_questions": questions,
        }
