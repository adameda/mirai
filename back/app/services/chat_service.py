"""
Service de chat — streaming Gemini 2.5 Flash via SSE avec fallback multi-clés.
"""
import asyncio
import json
from typing import AsyncGenerator, Optional

import google.generativeai as genai
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.onisep import Formation, Metier

_key_lock = asyncio.Lock()

_ERROR_OVERLOAD = (
    "Le service est momentanément surchargé. "
    "Patiente quelques secondes et réessaie."
)

_SYSTEM_BASE = (
    "Tu es MIRAI, un assistant bienveillant et expert en orientation post-bac française. "
    "Tu aides des lycéens (16-18 ans) à choisir leur parcours après le baccalauréat. "
    "Tu réponds en français. Tes réponses sont claires, concises et concrètes. "
    "Tu te limites aux sujets liés aux études, aux formations et aux métiers en France."
)


def _profile_block(profile: dict) -> str:
    """Construit le bloc profil élève à injecter dans le system prompt."""
    if not profile:
        return ""

    lines = ["\n\nProfil de l'élève qui te parle :"]

    if profile.get("niveau"):
        voie = profile.get("voie")
        filiere = profile.get("filiere")
        niveau_str = profile["niveau"]
        if voie:
            niveau_str += f" — voie {voie}"
        if filiere:
            niveau_str += f" ({filiere})"
        lines.append(f"- Classe : {niveau_str}")

    if profile.get("specialites"):
        lines.append(f"- Spécialités : {', '.join(profile['specialites'])}")

    if profile.get("matieres_fortes"):
        lines.append(f"- Matières où il/elle est fort(e) : {', '.join(profile['matieres_fortes'])}")

    if profile.get("matieres_aimees"):
        lines.append(f"- Matières qu'il/elle aime : {', '.join(profile['matieres_aimees'])}")

    if profile.get("centres_interet"):
        lines.append(f"- Ce qui le/la motive : {', '.join(profile['centres_interet'])}")

    if profile.get("domaines_interets"):
        lines.append(f"- Domaines d'intérêt : {', '.join(profile['domaines_interets'])}")

    if profile.get("duree"):
        lines.append(f"- Durée d'études souhaitée : {profile['duree']}")

    if profile.get("pression_academique"):
        lines.append(f"- Rapport à l'école : {profile['pression_academique']}")

    if profile.get("style"):
        lines.append(f"- Style de travail : {', '.join(profile['style'])}")

    lines.append(
        "\nUtilise ce profil pour personnaliser tes réponses. "
        "Si l'élève te demande si quelque chose lui convient, appuie-toi sur ces informations."
    )

    return "\n".join(lines)


def _system_prompt(
    context_type: str | None,
    context_id: str | None,
    db: Session,
    profile: Optional[dict] = None,
) -> str:
    profile_block = _profile_block(profile or {})

    if context_type == "formation" and context_id:
        f = db.query(Formation).filter(Formation.id == context_id).first()
        if f:
            parts = [
                _SYSTEM_BASE,
                profile_block,
                "\n\nLe lycéen explore la formation suivante :",
                f"- Intitulé : {f.libelle_complet}",
                f"- Type : {f.type_sigle or ''} ({f.type_libelle or ''})",
                f"- Durée : {f.duree or 'non précisée'}",
                f"- Niveau : {f.niveau_etudes or 'non précisé'}",
            ]
            if f.description_courte:
                parts.append(f"- Description : {f.description_courte}")
            if f.acces:
                parts.append(f"- Conditions d'accès : {f.acces[:600]}")
            if f.attendus:
                parts.append(f"- Compétences attendues : {f.attendus[:600]}")
            parts.append(
                "\nAide-le à comprendre cette formation, son accès, ses débouchés "
                "et si elle correspond à son profil."
            )
            return "\n".join(parts)

    if context_type == "metier" and context_id:
        m = db.query(Metier).filter(Metier.id == context_id).first()
        if m:
            secteurs = ", ".join(s["libelle"] for s in (m.secteurs_activite or []))
            centres = ", ".join(ci["libelle"] for ci in (m.centres_interet or []))

            parts = [
                _SYSTEM_BASE,
                profile_block,
                "\n\nLe lycéen explore le métier suivant :",
                f"- Nom : {m.nom}",
                f"- Secteur(s) : {secteurs or 'non précisés'}",
                f"- Niveau d'accès minimum : {m.niveau_acces_min or 'non précisé'}",
                f"- Salaire débutant : {m.salaire_debutant or 'non précisé'}",
            ]
            if m.format_court:
                parts.append(f"- En quoi ça consiste : {m.format_court[:600]}")
            elif m.accroche:
                parts.append(f"- Description : {m.accroche}")
            if centres:
                parts.append(f"- Ce métier correspond à des personnes qui : {centres}")
            if m.nature_travail:
                parts.append(f"- Nature du travail : {m.nature_travail[:400]}")
            if m.condition_travail:
                parts.append(f"- Conditions de travail : {m.condition_travail[:400]}")
            parts.append(
                "\nAide-le à comprendre ce métier, les formations qui y mènent "
                "et s'il correspond à son profil."
            )
            return "\n".join(parts)

    return _SYSTEM_BASE + profile_block


def _is_overload(exc: Exception) -> bool:
    s = str(exc).lower()
    return any(x in s for x in ["503", "high demand", "unavailable", "overloaded", "resource_exhausted"])


async def _make_model(key: str, system: str) -> genai.GenerativeModel:
    """Configure la clé et crée le modèle de façon atomique."""
    async with _key_lock:
        genai.configure(api_key=key)
        return genai.GenerativeModel(model_name="gemini-2.5-flash", system_instruction=system)


async def stream_chat(
    messages: list[dict],
    context_type: str | None,
    context_id: str | None,
    db: Session,
    profile: Optional[dict] = None,
) -> AsyncGenerator[str, None]:
    system = _system_prompt(context_type, context_id, db, profile)

    contents = [
        {"role": "user" if m["role"] == "user" else "model", "parts": [{"text": m["text"]}]}
        for m in messages
    ]

    keys = [k for k in [
        settings.GEMINI_API_KEY,
        settings.GEMINI_API_KEY_2,
        settings.GEMINI_API_KEY_3,
    ] if k]

    for attempt, key in enumerate(keys):
        is_last = attempt == len(keys) - 1
        try:
            model = await _make_model(key, system)
            response = await model.generate_content_async(contents, stream=True)
            async for chunk in response:
                if chunk.text:
                    yield f"data: {json.dumps({'text': chunk.text})}\n\n"
            yield "data: [DONE]\n\n"
            return
        except Exception as exc:
            if _is_overload(exc) and not is_last:
                continue
            error_msg = _ERROR_OVERLOAD if _is_overload(exc) else str(exc)
            yield f"data: {json.dumps({'error': error_msg})}\n\n"
            yield "data: [DONE]\n\n"
            return
