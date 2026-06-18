from groq import Groq
from app.core.config import settings

_client: Groq | None = None


def get_client() -> Groq:
    global _client
    if _client is None:
        if not settings.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY non configurée dans .env")
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


def complete(
    messages: list[dict],
    model: str = "llama-3.3-70b-versatile",
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> str:
    client = get_client()
    resp = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return resp.choices[0].message.content or ""
