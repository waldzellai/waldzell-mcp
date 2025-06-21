from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel

from ..core.base_tool import BaseTool


class DragPointAudit(BaseTool):
    slug = "drag_point_audit"
    endpoint_path = "/drag-point-audit"

    class InputSchema(BaseModel):
        log: str
        categories: List[str] | None = None

    class OutputSchema(BaseModel):
        drag_points: List[Dict[str, Any]]
        summary_score: float

    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        points = [
            {"category": c or "general", "count": i}
            for i, c in enumerate(payload.get("categories") or ["general"], start=1)
        ]
        score = sum(p["count"] for p in points) / len(points)
        return {
            "drag_points": points,
            "summary_score": round(score, 2),
        }
