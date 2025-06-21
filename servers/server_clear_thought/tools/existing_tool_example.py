from __future__ import annotations

from typing import Any, Dict

from pydantic import BaseModel

from ..core.base_tool import BaseTool


class ExistingToolExample(BaseTool):
    slug = "existing_tool_example"
    endpoint_path = "/existing-tool-example"

    class InputSchema(BaseModel):
        text: str

    class OutputSchema(BaseModel):
        echoed: str

    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return {"echoed": payload["text"]}
