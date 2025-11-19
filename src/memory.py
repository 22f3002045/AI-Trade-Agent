import chromadb
from openai import OpenAI
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import os

class FinancialSituationMemory:
    def __init__(self, name):
        self.embedding_model = "text-embedding-3-small"
        self.client = None
        self.gemini_embeddings = None
        
        # Use a persistent client for real applications, but in-memory is fine for this demo/recreation.
        # For a production app, you'd want a persistent path.
        self.chroma_client = chromadb.Client(chromadb.config.Settings(allow_reset=True))
        self.situation_collection = self.chroma_client.create_collection(name=name)

    def _get_client(self):
        if os.getenv("OPENAI_API_KEY"):
            if self.client is None:
                self.client = OpenAI()
            return self.client
        return None

    def _get_gemini_embeddings(self):
        if os.getenv("GEMINI_API_KEY"):
            if self.gemini_embeddings is None:
                self.gemini_embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
            return self.gemini_embeddings
        return None

    def get_embedding(self, text):
        # Try OpenAI first
        client = self._get_client()
        if client:
            response = client.embeddings.create(model=self.embedding_model, input=text)
            return response.data[0].embedding
            
        # Try Gemini
        gemini = self._get_gemini_embeddings()
        if gemini:
            return gemini.embed_query(text)
            
        # Fallback or dummy for now if no embedding provider
        print("Warning: No embedding provider available. Returning dummy embedding.")
        return [0.0] * 1536 # Return dummy vector to prevent crash

    def add_situations(self, situations_and_advice):
        if not situations_and_advice:
            return
        offset = self.situation_collection.count()
        ids = [str(offset + i) for i, _ in enumerate(situations_and_advice)]
        situations = [s for s, r in situations_and_advice]
        recommendations = [r for s, r in situations_and_advice]
        embeddings = [self.get_embedding(s) for s in situations]
        self.situation_collection.add(
            documents=situations,
            metadatas=[{"recommendation": rec} for rec in recommendations],
            embeddings=embeddings,
            ids=ids,
        )

    def get_memories(self, current_situation, n_matches=1):
        if self.situation_collection.count() == 0:
            return []
        query_embedding = self.get_embedding(current_situation)
        results = self.situation_collection.query(
            query_embeddings=[query_embedding],
            n_results=min(n_matches, self.situation_collection.count()),
            include=["metadatas"],
        )
        return [{'recommendation': meta['recommendation']} for meta in results['metadatas'][0]]
