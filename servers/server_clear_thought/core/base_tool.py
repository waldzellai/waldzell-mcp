from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, Type

from fastapi import APIRouter
from pydantic import BaseModel


class BaseTool(ABC):
    slug: str
    endpoint_path: str

    class InputSchema(BaseModel):
        pass

    class OutputSchema(BaseModel):
        pass

    @classmethod
    def get_router(cls) -> APIRouter:
        router = APIRouter()
        OutputModel = cls.OutputSchema

        @router.post("/execute", response_model=OutputModel)
        def execute_endpoint(payload: Dict[str, Any]) -> Any:
            input_obj = cls.InputSchema(**payload)
            instance = cls()
            result = instance.execute(input_obj.dict())
            return OutputModel(**result)

        return router

    @abstractmethod
    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError
