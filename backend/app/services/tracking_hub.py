from collections import defaultdict
from collections.abc import Iterable

from fastapi import WebSocket


class TrackingHub:
    def __init__(self) -> None:
        self._connections: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(self, pickup_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[pickup_id].add(websocket)

    def disconnect(self, pickup_id: int, websocket: WebSocket) -> None:
        connections = self._connections.get(pickup_id)
        if not connections:
            return
        connections.discard(websocket)
        if not connections:
            self._connections.pop(pickup_id, None)

    async def broadcast(self, pickup_id: int, payload: dict[str, object]) -> None:
        stale: list[WebSocket] = []
        for websocket in self._connections.get(pickup_id, set()):
            try:
                await websocket.send_json(payload)
            except Exception:
                stale.append(websocket)
        for websocket in stale:
            self.disconnect(pickup_id, websocket)

    async def send_history(self, websocket: WebSocket, events: Iterable[dict[str, object]]) -> None:
        for event in events:
            await websocket.send_json(event)


tracking_hub = TrackingHub()
