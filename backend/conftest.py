import os
import sys
import tempfile
from pathlib import Path
import pytest

# Use an isolated, throwaway SQLite database for every test session so tests never modify the
# developer's demo database (satark_saathi.db). Must be set before any backend.app import.
_TEST_DB_DIR = tempfile.mkdtemp(prefix="satark_test_db_")
os.environ["DATABASE_URL"] = "sqlite:///" + str(Path(_TEST_DB_DIR) / "satark_test.db").replace("\\", "/")

# Add project root to sys.path
root_path = Path(__file__).resolve().parent.parent
if str(root_path) not in sys.path:
    sys.path.insert(0, str(root_path))

from backend.app.database import init_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db(seed_if_empty=True)
    yield
