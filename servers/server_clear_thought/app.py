from __future__ import annotations

import importlib
import pkgutil
from pathlib import Path
from typing import List, Type

from fastapi import FastAPI

from .core.base_tool import BaseTool


def load_tools() -> List[Type[BaseTool]]:
    tools: List[Type[BaseTool]] = []
    pkg_dir = Path(__file__).parent / "tools"
    for module_info in pkgutil.iter_modules([str(pkg_dir)]):
        module = importlib.import_module(f"{__package__}.tools.{module_info.name}")
        for attr in module.__dict__.values():
            if isinstance(attr, type) and issubclass(attr, BaseTool) and attr is not BaseTool:
                tools.append(attr)
    return tools


def create_app() -> FastAPI:
    app = FastAPI()
    for tool_cls in load_tools():
        router = tool_cls.get_router()
        app.include_router(router, prefix=tool_cls.endpoint_path, tags=[tool_cls.slug])
    return app
