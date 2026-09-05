"""Abstract Base Solver interface for optimization algorithms."""
from abc import ABC, abstractmethod
from typing import Dict, Any, List
import numpy as np


class BaseOptimizationSolver(ABC):
    """Abstract base class for all classical and quantum-inspired solvers."""

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def solve(
        self,
        Q: np.ndarray,
        qubo_builder: Any,
        **kwargs
    ) -> Dict[str, Any]:
        """Solve the optimization problem and return solution dictionary."""
        pass
