from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel

from ..core.base_tool import BaseTool


class ComparativeAdvantage(BaseTool):
    slug = "comparative_advantage"
    endpoint_path = "/comparative-advantage"

    class InputSchema(BaseModel):
        skills: Dict[str, int]
        tasks: Dict[str, List[str]]

    class OutputSchema(BaseModel):
        advantage_map: List[Dict[str, Any]]

    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        result = []
        skills = payload["skills"]
        for task, _ in payload["tasks"].items():
            best = max(skills, key=lambda k: skills[k])
            result.append({"task": task, "assignee": best})
        return {"advantage_map": result}
