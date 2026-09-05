"""SQLAlchemy database engine and session management for QWANTA."""
from pathlib import Path
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# SQLite database stored at project root — easy to migrate to Postgres later
# by swapping DATABASE_URL to postgresql+psycopg2://...
DB_PATH = Path(__file__).resolve().parents[3] / "qwanta.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite multi-thread
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


def get_db():
    """FastAPI dependency that yields a DB session and closes it after request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables. Called once at application startup."""
    # Import ORM models so Base.metadata knows about them
    from backend.app.db import vessel_orm, prediction_orm, route_orm  # noqa: F401
    Base.metadata.create_all(bind=engine)
