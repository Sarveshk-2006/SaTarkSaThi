from fastapi import Header, HTTPException, status
from typing import Optional

def get_current_user_id(x_user_id: Optional[str] = Header(default="1")) -> int:
    """
    Extracts authenticated user ID from X-User-Id header for demo profile switching.
    Defaults to User 1 (Rajesh Sharma) if not provided.
    Guardian profile is User 2 (Aarav Sharma).
    """
    try:
        user_id = int(x_user_id)
        if user_id <= 0:
            raise ValueError
        return user_id
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing authentication credentials (X-User-Id)."
        )
