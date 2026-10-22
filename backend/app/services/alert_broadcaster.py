import json
import logging
from typing import List, Dict, Set
from fastapi import WebSocket

logger = logging.getLogger("satark_saathi.websocket")

class AlertBroadcaster:
    def __init__(self):
        # Maps user_id -> set of active WebSockets
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        self.all_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, user_id: int = 1):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        self.all_connections.add(websocket)
        logger.info(f"WebSocket connected for user {user_id}. Total active: {len(self.all_connections)}")

    def disconnect(self, websocket: WebSocket, user_id: int = 1):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        self.all_connections.discard(websocket)
        logger.info(f"WebSocket disconnected for user {user_id}. Total active: {len(self.all_connections)}")

    async def broadcast_alert(self, alert_payload: dict):
        """
        Broadcasts an alert payload to all connected clients (e.g. Guardian devices/tabs).
        Includes actual incident ID, risk level, reason, and recommended actions.
        """
        message_str = json.dumps(alert_payload)
        dead_connections = []
        for connection in list(self.all_connections):
            try:
                await connection.send_text(message_str)
            except Exception as e:
                logger.warning(f"Failed to send to WebSocket client: {e}")
                dead_connections.append(connection)

        for dead in dead_connections:
            self.all_connections.discard(dead)
            for uid, conns in list(self.active_connections.items()):
                conns.discard(dead)

alert_broadcaster = AlertBroadcaster()
