"""Addiction and engagement maximization modules."""

from lib.addiction.addiction_engine import (
    VariableRewardScheduler,
    ObsessionLoopDetector,
    SessionContinuationMaximizer,
    EngagementMaximizer
)

__all__ = [
    "VariableRewardScheduler",
    "ObsessionLoopDetector",
    "SessionContinuationMaximizer",
    "EngagementMaximizer",
]


