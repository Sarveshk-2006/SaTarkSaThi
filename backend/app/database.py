from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

# SQLite requires check_same_thread=False for multithreading
connect_args = {"check_same_thread": False} if "sqlite" in settings.database_url else {}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def migrate_db():
    """
    Lightweight, automatic schema migration for SQLite and PostgreSQL.
    Ensures newly added columns and tables are created without data loss.
    """
    from backend.app import models  # Ensure all models are registered
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.connect() as conn:
        for table_name, table in Base.metadata.tables.items():
            if table_name in existing_tables:
                existing_columns = {col["name"] for col in inspector.get_columns(table_name)}
                for column in table.columns:
                    if column.name not in existing_columns:
                        col_type = column.type.compile(engine.dialect)
                        # Determine default if any
                        default_val = ""
                        if column.default is not None and column.default.arg is not None:
                            arg = column.default.arg
                            if isinstance(arg, str):
                                default_val = f" DEFAULT '{arg}'"
                            elif isinstance(arg, (int, float)):
                                default_val = f" DEFAULT {arg}"
                            elif isinstance(arg, bool):
                                default_val = f" DEFAULT {1 if arg else 0}"
                        try:
                            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column.name} {col_type}{default_val}"))
                            conn.commit()
                        except Exception:
                            pass

def init_db(seed_if_empty: bool = True):
    from backend.app import models
    migrate_db()
    if seed_if_empty and settings.enable_demo_seed:
        from backend.app.seed_data import seed_default_data
        db = SessionLocal()
        try:
            seed_default_data(db)
        finally:
            db.close()
