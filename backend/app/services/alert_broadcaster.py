import json
import logging
from typing import List, Dict, Set, Optional, Iterable, Union
from fastapi import WebSocket

logger = logging.getLogger("satark_saathi.websocket")

class AlertBroadcaster:
    """
    Channel-isolated WebSocket broadcaster for Family Shield alerts.

    DEMO IDENTITY BOUNDARY:
    Channels are partitioned by demo persona user_id (e.g. 1 for Rajesh, 2 for Aarav).
    Alerts are strictly delivered only to the target demo user's active connections,
    preventing private alerts of one user from leaking to other connected browser tabs.
    This is a demo-only identity boundary and not production authentication.
    """
    def __init__(self):
        # Maps user_id -> set of active WebSockets for that user
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int = 1):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(
            f"WebSocket connected for user {user_id}. "
            f"Active users: {len(self.active_connections)}, "
            f"user {user_id} connections: {len(self.active_connections[user_id])}"
        )

    def disconnect(self, websocket: WebSocket, user_id: Optional[int] = None):
        """
        Removes a WebSocket from active connections without leaving stale subscriptions.
        """
        if user_id is not None and user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        else:
            # Fallback cleanup across all user channels if user_id is omitted or mismatched
            for uid in list(self.active_connections.keys()):
                self.active_connections[uid].discard(websocket)
                if not self.active_connections[uid]:
                    del self.active_connections[uid]
        logger.info(f"WebSocket disconnected for user {user_id}. Remaining active users: {len(self.active_connections)}")

    def get_user_connections(self, user_id: int) -> Set[WebSocket]:
        return self.active_connections.get(user_id, set())

    def get_active_users(self) -> List[int]:
        return list(self.active_connections.keys())

    async def broadcast_alert(
        self,
        alert_payload: dict,
        target_user_ids: Optional[Union[int, Iterable[int]]] = None
    ):
        """
        Broadcasts an alert payload ONLY to the authorized target user(s).

        If target_user_ids is an integer, broadcasts to that user.
        If target_user_ids is an iterable, broadcasts to all specified users.
        If target_user_ids is None, attempts to extract 'target_user_ids' or 'user_id'
        from the payload. If no target can be determined, the alert is NOT broadcast
        to any client to prevent cross-user data leakage.
        """
        resolved_targets: Set[int] = set()
        if target_user_ids is not None:
            if isinstance(target_user_ids, int):
                resolved_targets.add(target_user_ids)
            else:
                resolved_targets.update(target_user_ids)
        elif "target_user_ids" in alert_payload:
            payload_targets = alert_payload["target_user_ids"]
            if isinstance(payload_targets, int):
                resolved_targets.add(payload_targets)
            else:
                resolved_targets.update(payload_targets)
        elif "user_id" in alert_payload and alert_payload["user_id"] is not None:
            resolved_targets.add(int(alert_payload["user_id"]))

        if not resolved_targets:
            logger.warning(
                "broadcast_alert invoked without specific target_user_ids; "
                "suppressing broadcast to prevent cross-user leak."
            )
            return

        message_str = json.dumps(alert_payload)

        for uid in resolved_targets:
            conns = list(self.active_connections.get(uid, set()))
            dead_connections = []
            for connection in conns:
                try:
                    await connection.send_text(message_str)
                except Exception as e:
                    logger.warning(f"Failed to send alert to WebSocket client for user {uid}: {e}")
                    dead_connections.append(connection)

            for dead in dead_connections:
                self.disconnect(dead, user_id=uid)

alert_broadcaster = AlertBroadcaster()
