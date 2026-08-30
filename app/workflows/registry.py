from __future__ import annotations

import logging
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)


class DepartmentSkill:
    """Represents a department skill or micro-task module."""

    def __init__(
        self,
        name: str,
        department: str,
        description: str,
        handler: Optional[Callable[..., Any]] = None,
        keywords: Optional[List[str]] = None,
    ):
        self.name = name
        self.department = department
        self.description = description
        self.handler = handler
        self.keywords = keywords or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "department": self.department,
            "description": self.description,
            "keywords": self.keywords,
        }


class SkillRegistry:
    """
    SkillRegistry manages registration and dynamic discovery of department skills.
    Allows modular extension of new sub-skills without modifying core workflow code.
    """

    def __init__(self):
        self._skills: Dict[str, DepartmentSkill] = {}

    def register(
        self,
        name: str,
        department: str,
        description: str,
        handler: Optional[Callable[..., Any]] = None,
        keywords: Optional[List[str]] = None,
    ) -> DepartmentSkill:
        skill = DepartmentSkill(
            name=name,
            department=department,
            description=description,
            handler=handler,
            keywords=keywords,
        )
        self._skills[name] = skill
        logger.info(f"Registered Skill [{name}] for department [{department}]")
        return skill

    def get_skill(self, name: str) -> Optional[DepartmentSkill]:
        return self._skills.get(name)

    def list_skills(self, department: Optional[str] = None) -> List[DepartmentSkill]:
        if department:
            return [s for s in self._skills.values() if s.department == department]
        return list(self._skills.values())

    def match_skill(self, query: str) -> Optional[DepartmentSkill]:
        """Simple keyword-based skill matcher for routing."""
        query_lower = query.lower()
        best_match = None
        highest_score = 0
        for skill in self._skills.values():
            score = sum(1 for kw in skill.keywords if kw.lower() in query_lower)
            if score > highest_score:
                highest_score = score
                best_match = skill
        return best_match


# Singleton instance
skill_registry = SkillRegistry()
