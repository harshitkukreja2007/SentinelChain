"""
SentinelChain ChromaDB Vector Database Manager
Provides lightweight, local, zero-network embedding and vector similarity search
for supply chain intelligence documents and MSME order disruption matching.
"""
import re
import math
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional
from collections import Counter
import chromadb
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings

from data.mock_documents import MOCK_DOCUMENTS

DB_STORAGE_DIR = Path(__file__).resolve().parent / "chroma_db_store"
COLLECTION_NAME = "supply_chain_intelligence"

# Core vocabulary of key domain tokens mapped to dedicated prime dimensions
DOMAIN_ANCHORS = [
    "gst", "tariff", "cbic", "fiber", "textile", "surat", "ahmedabad", "viscose", "yarn", "fabric",
    "strike", "drayage", "port", "jnpt", "nhava", "sheva", "truck", "pune", "mumbai", "chassis", "dwell",
    "cyclone", "weather", "imd", "storm", "rain", "chennai", "ennore", "kattupalli", "coromandel", "flood",
    "customs", "qco", "bis", "fastener", "bolt", "dgft", "ludhiana", "delhi", "standard", "marking", "inspection",
    "foundry", "supplier", "furnace", "blast", "iron", "rajkot", "casting", "deferral", "delay", "machinery",
    "automotive", "engineering", "hydraulics", "motor", "pump", "coimbatore", "gujarat", "punjab", "tamil"
]
ANCHOR_MAP = {word: i for i, word in enumerate(DOMAIN_ANCHORS)}


class SupplyChainEmbeddingFunction(EmbeddingFunction[Documents]):
    """
    Lightweight, deterministic, high-dimensional semantic embedding function
    tailored for enterprise supply chain terms, locations, and disruption categories.
    Operates 100% locally with zero external network dependencies.
    """
    def __init__(self, dim: int = 256):
        self.dim = dim
        self.anchor_dim = len(DOMAIN_ANCHORS)

    def _embed_text(self, text: str) -> List[float]:
        vec = [0.0] * self.dim
        if not text:
            return vec

        text_lower = text.lower()
        tokens = re.findall(r"\w+", text_lower)
        if not tokens:
            return vec

        counts = Counter(tokens)
        
        # 1. Direct Domain Anchors (Primary Semantic Weights)
        for word, count in counts.items():
            if word in ANCHOR_MAP:
                idx = ANCHOR_MAP[word]
                # High domain significance
                vec[idx] += (1.0 + math.log(count)) * 6.0

        # 2. Hashed Subwords and Bigrams across the remaining dimensions
        for i in range(len(tokens) - 1):
            bigram = f"{tokens[i]}_{tokens[i+1]}"
            h_int = int(hashlib.md5(bigram.encode("utf-8")).hexdigest(), 16)
            idx = self.anchor_dim + (h_int % (self.dim - self.anchor_dim))
            vec[idx] += 1.5

        for word, count in counts.items():
            h_int = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16)
            idx = self.anchor_dim + (h_int % (self.dim - self.anchor_dim))
            vec[idx] += (1.0 + math.log(count)) * 1.0

        # 3. L2 Normalization
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [float(x / norm) for x in vec]
        return vec

    def __call__(self, input: Documents) -> Embeddings:
        return [self._embed_text(doc) for doc in input]


# Global singleton client & embedding function
_embedding_fn = SupplyChainEmbeddingFunction(dim=256)
_client: Optional[chromadb.ClientAPI] = None


def get_chroma_client() -> chromadb.ClientAPI:
    """Returns persistent ChromaDB client."""
    global _client
    if _client is None:
        DB_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        _client = chromadb.PersistentClient(path=str(DB_STORAGE_DIR))
    return _client


def get_intelligence_collection(force_recreate: bool = False):
    """Retrieves or creates the supply chain intelligence collection."""
    client = get_chroma_client()
    if force_recreate:
        try:
            client.delete_collection(COLLECTION_NAME)
        except Exception:
            pass

    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=_embedding_fn,
        metadata={"description": "Supply chain regulatory, weather, logistics, and supplier intelligence documents"}
    )


def initialize_and_load_vector_db(force_reload: bool = False) -> Dict[str, Any]:
    """
    Loads all mock documents into the vector database with metadata and embeddings.
    """
    collection = get_intelligence_collection(force_recreate=force_reload)
    existing_count = collection.count()

    if existing_count > 0 and not force_reload:
        return {
            "status": "ready",
            "document_count": existing_count,
            "reloaded": False,
            "collection": COLLECTION_NAME,
        }

    # Prepare document records
    doc_ids = []
    documents = []
    metadatas = []

    for doc in MOCK_DOCUMENTS:
        doc_ids.append(doc["id"])
        composite_text = (
            f"Title: {doc['title']}\n"
            f"Category: {doc['category']}\n"
            f"Locations: {', '.join(doc.get('affected_locations', []))}\n"
            f"Sectors: {', '.join(doc.get('affected_sectors', []))}\n"
            f"Summary: {doc.get('summary', '')}\n"
            f"Content: {doc['content']}"
        )
        documents.append(composite_text)
        metadatas.append({
            "id": doc["id"],
            "title": doc["title"],
            "category": doc["category"],
            "date": doc["date"],
            "severity": doc.get("severity", "medium"),
            "affected_locations": ", ".join(doc.get("affected_locations", [])),
            "affected_sectors": ", ".join(doc.get("affected_sectors", [])),
        })

    # Upsert documents into ChromaDB
    collection.upsert(
        ids=doc_ids,
        documents=documents,
        metadatas=metadatas
    )

    return {
        "status": "loaded",
        "document_count": collection.count(),
        "reloaded": True,
        "collection": COLLECTION_NAME,
    }


def search_similar_documents(query_text: str, n_results: int = 3, category_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Performs vector similarity search against the loaded intelligence documents.
    """
    collection = get_intelligence_collection()
    where_clause = {"category": category_filter} if category_filter else None

    query_kwargs: Dict[str, Any] = {
        "query_texts": [query_text],
        "n_results": min(n_results, max(1, collection.count())),
    }
    if where_clause:
        query_kwargs["where"] = where_clause

    results = collection.query(**query_kwargs)

    formatted_results = []
    if results and results["ids"] and len(results["ids"][0]) > 0:
        for i in range(len(results["ids"][0])):
            doc_id = results["ids"][0][i]
            meta = results["metadatas"][0][i] if results["metadatas"] else {}
            doc_text = results["documents"][0][i] if results["documents"] else ""
            distance = results["distances"][0][i] if results["distances"] else 0.0
            similarity_score = max(0.0, 1.0 - (distance / 2.0))

            formatted_results.append({
                "doc_id": doc_id,
                "title": meta.get("title", ""),
                "category": meta.get("category", ""),
                "severity": meta.get("severity", "medium"),
                "date": meta.get("date", ""),
                "affected_locations": meta.get("affected_locations", "").split(", ") if meta.get("affected_locations") else [],
                "affected_sectors": meta.get("affected_sectors", "").split(", ") if meta.get("affected_sectors") else [],
                "content_snippet": doc_text[:220] + "..." if len(doc_text) > 220 else doc_text,
                "similarity_score": round(similarity_score, 4),
                "distance": round(distance, 4),
            })

    return formatted_results


def query_disruptions_for_order(order: Dict[str, Any], n_results: int = 2) -> List[Dict[str, Any]]:
    """
    Constructs a contextual semantic query from an MSME order and retrieves relevant disruption alerts.
    """
    supplier_loc = order.get("supplier_location", "")
    item = order.get("item", "")
    supplier_name = order.get("supplier_name", "")
    sector = order.get("sector", "")
    query = f"{supplier_loc} {sector} {item} {supplier_name} port transport delay customs weather strike GST tariff alert"
    return search_similar_documents(query_text=query, n_results=n_results)
