"""
Service de chat — streaming Gemini 2.0 Flash via SSE.
"""
import json
from typing import AsyncGenerator

import google.generativeai as genai
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.onisep import Formation, Metier

genai.configure(api_key=settings.GEMINI_API_KEY)

_SYSTEM_BASE = (
    "Tu es MIRAI, un assistant bienveillant et expert en orientation post-bac française. "
    "Tu aides des lycéens (16-18 ans) à choisir leur parcours après le baccalauréat. "
    "Tu réponds en français. Tes réponses sont claires, concises et concrètes. "
    "Tu te limites aux sujets liés aux études, aux formations et aux métiers en France."
)


def _system_prompt(context_type: str | None, context_id: str | None, db: Session) -> str:
    if context_type == "formation" and context_id:
        f = db.query(Formation).filter(Formation.id == context_id).first()
        if f:
            return (
                _SYSTEM_BASE
                + "\n\nLe lycéen explore la formation suivante :"
                f"\n- Intitulé : {f.libelle_complet}"
                f"\n- Type : {f.type_sigle or ''} ({f.type_libelle or ''})"
                f"\n- Durée : {f.duree or 'non précisée'}"
                f"\n- Niveau : {f.niveau_etudes or 'non précisé'}"
                f"\n- Description : {f.description_courte or 'non disponible'}"
                "\n\nAide-le à comprendre cette formation, son accès, ses débouchés et si elle lui convient."
            )

    if context_type == "metier" and context_id:
        m = db.query(Metier).filter(Metier.id == context_id).first()
        if m:
            secteurs = ", ".join(s["libelle"] for s in (m.secteurs_activite or []))
            return (
                _SYSTEM_BASE
                + "\n\nLe lycéen explore le métier suivant :"
                f"\n- Nom : {m.nom}"
                f"\n- Secteur(s) : {secteurs or 'non précisés'}"
                f"\n- Niveau d'accès minimum : {m.niveau_acces_min or 'non précisé'}"
                f"\n- Salaire débutant : {m.salaire_debutant or 'non précisé'}"
                f"\n- Description : {m.accroche or 'non disponible'}"
                "\n\nAide-le à comprendre ce métier, les formations qui y mènent et s'il correspond à son profil."
            )

    return _SYSTEM_BASE


async def stream_chat(
    messages: list[dict],
    context_type: str | None,
    context_id: str | None,
    db: Session,
) -> AsyncGenerator[str, None]:
    system = _system_prompt(context_type, context_id, db)

    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=system,
    )

    contents = [
        {"role": "user" if m["role"] == "user" else "model", "parts": [{"text": m["text"]}]}
        for m in messages
    ]

    try:
        response = await model.generate_content_async(contents, stream=True)
        async for chunk in response:
            if chunk.text:
                yield f"data: {json.dumps({'text': chunk.text})}\n\n"
    except Exception as exc:
        yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    yield "data: [DONE]\n\n"
