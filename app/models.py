from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field


class ProviderRequest(BaseModel):
    provider: Literal["openai", "gemini", "ollama", "ollama_cloud", "ollama_local"]



@dataclass
class Chunk:
    text: str
    page: int
    index: int


@dataclass
class Document:
    id: str
    name: str
    pages: int
    chunks: list[Chunk]
    size_bytes: int
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    vectors: Optional[list[list[float]]] = None


class Source(BaseModel):
    page: int
    excerpt: str
    score: float = Field(ge=0, le=1)


class AskRequest(BaseModel):
    document_id: str
    question: str = Field(min_length=2, max_length=1000)
    enable_web_search: bool = Field(default=False)


class AskResponse(BaseModel):
    answer: str
    sources: list[Source]
    mode: str


class GenerateRequest(BaseModel):
    document_id: str
    audience: str = Field(default="大學生", max_length=50)
    tone: str = Field(default="清楚易懂", max_length=50)
    language: Literal["zh-TW", "en", "auto"] = Field(default="zh-TW")
    slide_count: int = Field(default=8, ge=4, le=20)
    duration: int = Field(default=30, ge=10, le=180)
    enable_web_search: bool = Field(default=False)


class Slide(BaseModel):
    title: str
    bullets: list[str] = Field(min_length=1, max_length=6)
    speaker_notes: str
    source_pages: list[int] = Field(default_factory=list)
    icon: str = Field(default="💡")
    visual_description: str = Field(default="")


class Deck(BaseModel):
    id: str
    document_id: str
    title: str
    subtitle: str
    slides: list[Slide]
    duration: int
    mode: str

