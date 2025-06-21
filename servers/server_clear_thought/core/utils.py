from __future__ import annotations

import random
from typing import List


def random_confidences(n: int) -> List[float]:
    return [round(random.uniform(0.5, 1.0), 2) for _ in range(n)]
