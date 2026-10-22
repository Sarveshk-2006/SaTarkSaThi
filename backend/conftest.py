import sys
from pathlib import Path
import pytest

# Add project root to sys.path
root_path = Path(__file__).resolve().parent.parent
if str(root_path) not in sys.path:
    sys.path.insert(0, str(root_path))

from backend.app.database import init_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db(seed_if_empty=True)
    yield
