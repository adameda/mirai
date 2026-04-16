#!/usr/bin/env python3
"""
Crée toutes les tables en base (équivalent d'une migration initiale).
À lancer une seule fois avant de démarrer l'app.

Usage (depuis le dossier back/) :
    python -m scripts.init_db
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import engine
from app.models.base import Base

# Importe tous les modèles pour que SQLAlchemy les connaisse
import app.models.onisep  # noqa
import app.models.user    # noqa
import app.models.classe  # noqa
import app.models.favori  # noqa

if __name__ == "__main__":
    print("Création des tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables créées avec succès.")
    print("\nTables présentes :")
    from sqlalchemy import inspect
    inspector = inspect(engine)
    for table in inspector.get_table_names():
        print(f"  - {table}")
