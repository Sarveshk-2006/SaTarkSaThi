import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database import Base
from backend.app.models import (
    UserProfile,
    TrustedContact,
    ScamAnalysis,
    Incident,
    FamilyAlert
)
from backend.app.seed_data import seed_default_data

def test_database_initialization_and_schema():
    # Test on an in-memory SQLite database
    test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=test_engine)

    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestSession()

    try:
        # Initial empty check
        assert db.query(UserProfile).count() == 0
        assert db.query(TrustedContact).count() == 0
        assert db.query(ScamAnalysis).count() == 0

        # Seed data
        seed_default_data(db, force=True)

        # Verify seeded entities exist and are properly tagged
        profile = db.query(UserProfile).first()
        assert profile is not None
        assert profile.full_name == "Rajesh Sharma"

        contacts = db.query(TrustedContact).all()
        assert len(contacts) == 2  # Family Shield allows at most two trusted contacts
        assert any(c.is_primary for c in contacts)
        assert all(c.contact_consent_status == "ACCEPTED" for c in contacts)

        analyses = db.query(ScamAnalysis).all()
        assert len(analyses) >= 2
        for a in analyses:
            assert a.is_seed_data is True
            assert a.risk_score >= 0 and a.risk_score <= 100

        incidents = db.query(Incident).all()
        assert len(incidents) >= 1
        assert incidents[0].is_seed_data is True

        alerts = db.query(FamilyAlert).all()
        assert len(alerts) >= 1
    finally:
        db.close()
