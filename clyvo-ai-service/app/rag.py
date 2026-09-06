"""Camada de recuperação (RAG) sobre a base de conhecimento veterinária.

Dois backends, escolhidos por RAG_BACKEND:

* ``chroma``  — ChromaDB persistente, com embeddings vetoriais. Modo de produção.
* ``simple``  — retriever TF-IDF implementado aqui, sem dependência externa.
  Garante que o serviço sobe e demonstra em qualquer máquina, inclusive offline.

A interface pública é a mesma nos dois casos: ``knowledge_base.search(query)``.
"""

from __future__ import annotations

import math
import re
import unicodedata
from collections import Counter
from dataclasses import dataclass

from .config import settings

STOPWORDS = {
    "a", "as", "o", "os", "de", "da", "do", "das", "dos", "e", "em", "no", "na",
    "nos", "nas", "um", "uma", "para", "por", "com", "que", "se", "ao", "aos",
    "meu", "minha", "seu", "sua", "ele", "ela", "isso", "ser", "esta", "este",
    "essa", "esse", "mais", "muito", "ja", "nao", "sim", "the", "of", "and",
}


# Expansão de sinônimos: aproxima o vocabulário do tutor ("comendo menos") do
# vocabulário técnico da base ("recusa alimentar"). Aplicada só na consulta.
EXPANSOES = {
    "comendo": ["alimentar", "apetite", "recusa"],
    "comer": ["alimentar", "apetite", "recusa"],
    "comeu": ["alimentar", "apetite", "recusa"],
    "apetite": ["alimentar", "recusa"],
    "coco": ["diarreia", "fezes"], "fezes": ["diarreia"],
    "xixi": ["urinar", "urinario"], "urina": ["urinar", "urinario"],
    "vomitou": ["vomito"], "vomitando": ["vomito"],
    "remedio": ["medicamento", "farmaco"], "comprimido": ["medicamento"],
    "gordo": ["obesidade", "peso"], "gorda": ["obesidade", "peso"],
    "velho": ["geriatrico", "idoso"], "velha": ["geriatrico", "idoso"],
    "idoso": ["geriatrico"], "idosa": ["geriatrico"],
    "dente": ["periodontal", "bucal"], "dentes": ["periodontal", "bucal"],
    "cansada": ["prostracao"], "cansado": ["prostracao"],
    "picada": ["ferida"], "carrapato": ["vermifugacao", "antipulgas"],
}


def _expand(tokens: list[str]) -> list[str]:
    expandido = list(tokens)
    for token in tokens:
        expandido.extend(EXPANSOES.get(token, []))
    return expandido


def _normalize(text: str) -> list[str]:
    """Minúsculas, sem acento, sem pontuação e sem stopwords."""
    text = unicodedata.normalize("NFKD", text.lower())
    text = "".join(c for c in text if not unicodedata.combining(c))
    return [t for t in re.findall(r"[a-z0-9]+", text) if len(t) > 2 and t not in STOPWORDS]


@dataclass
class Chunk:
    id: str
    source: str
    title: str
    text: str


def load_chunks() -> list[Chunk]:
    """Carrega os .md da base e quebra por seção (## título)."""
    chunks: list[Chunk] = []
    for path in sorted(settings.knowledge_dir.glob("*.md")):
        raw = path.read_text(encoding="utf-8")
        if not raw.strip():
            continue
        doc_title = raw.splitlines()[0].lstrip("# ").strip()
        for i, block in enumerate(re.split(r"\n(?=## )", raw)):
            body = block.strip()
            if len(body) < 40:
                continue
            section = body.splitlines()[0].lstrip("# ").strip()
            title = doc_title if section == doc_title else f"{doc_title} — {section}"
            chunks.append(Chunk(id=f"{path.stem}-{i}", source=path.name,
                                title=title, text=body))
    return chunks


class SimpleRetriever:
    """TF-IDF + similaridade de cosseno, em Python puro."""

    def __init__(self, chunks: list[Chunk]) -> None:
        self.chunks = chunks
        counters = [Counter(_normalize(c.text)) for c in chunks]
        n = max(len(chunks), 1)
        df: Counter = Counter()
        for counter in counters:
            df.update(counter.keys())
        self.idf = {t: math.log((n + 1) / (f + 1)) + 1 for t, f in df.items()}
        self.vectors = [self._vectorize(c) for c in counters]

    def _vectorize(self, counter: Counter) -> dict[str, float]:
        vec = {t: (1 + math.log(c)) * self.idf.get(t, 1.0) for t, c in counter.items()}
        norm = math.sqrt(sum(v * v for v in vec.values())) or 1.0
        return {t: v / norm for t, v in vec.items()}

    def search(self, query: str, k: int) -> list[tuple[Chunk, float]]:
        q_vec = self._vectorize(Counter(_expand(_normalize(query))))
        scored = [
            (chunk, sum(w * vec.get(t, 0.0) for t, w in q_vec.items()))
            for chunk, vec in zip(self.chunks, self.vectors)
        ]
        scored = [pair for pair in scored if pair[1] > 0]
        scored.sort(key=lambda pair: pair[1], reverse=True)
        return scored[:k]


class ChromaRetriever:
    """Busca vetorial com ChromaDB persistente."""

    def __init__(self, chunks: list[Chunk]) -> None:
        import chromadb  # importado sob demanda: exigido só neste backend

        self.chunks = {c.id: c for c in chunks}
        self.client = chromadb.PersistentClient(path=settings.chroma_dir)
        self.collection = self._get_collection()

        if self.collection.count() != len(chunks):
            if self.collection.count():
                self.client.delete_collection("clyvo_vet_kb")
                self.collection = self._get_collection()
            self.collection.add(
                ids=[c.id for c in chunks],
                documents=[c.text for c in chunks],
                metadatas=[{"source": c.source, "title": c.title} for c in chunks],
            )

    def _get_collection(self):
        return self.client.get_or_create_collection(
            name="clyvo_vet_kb", metadata={"hnsw:space": "cosine"}
        )

    def search(self, query: str, k: int) -> list[tuple[Chunk, float]]:
        result = self.collection.query(query_texts=[query], n_results=k)
        saida: list[tuple[Chunk, float]] = []
        for cid, dist in zip(result["ids"][0], result["distances"][0]):
            chunk = self.chunks.get(cid)
            if chunk:
                saida.append((chunk, 1 - dist))
        return saida


class KnowledgeBase:
    def __init__(self) -> None:
        self.chunks = load_chunks()
        self.backend_name = settings.rag_backend
        try:
            self.retriever = (
                ChromaRetriever(self.chunks)
                if self.backend_name == "chroma"
                else SimpleRetriever(self.chunks)
            )
        except Exception:  # chromadb ausente ou falha de índice
            self.backend_name = "simple (fallback)"
            self.retriever = SimpleRetriever(self.chunks)

    def search(self, query: str, k: int | None = None) -> list[tuple[Chunk, float]]:
        return self.retriever.search(query, k or settings.rag_top_k)


knowledge_base = KnowledgeBase()