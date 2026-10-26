import os
import sys
import shutil

# Ensure workspace root is in sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# When running on Vercel Serverless, copy pre-seeded database to writable /tmp
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    tmp_db = "/tmp/satark_saathi.db"
    src_db = os.path.join(ROOT_DIR, "satark_saathi.db")
    if os.path.exists(src_db) and not os.path.exists(tmp_db):
        try:
            shutil.copy2(src_db, tmp_db)
        except Exception as e:
            print(f"Notice: database copy to /tmp: {e}")
    os.environ["DATABASE_URL"] = f"sqlite:///{tmp_db}"

from backend.app.main import app
