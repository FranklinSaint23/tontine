from datetime import datetime

from pydantic import BaseModel

from app.models.enums import NotificationType


class NotificationRead(BaseModel):
    id: int
    type: NotificationType
    titre: str
    message: str
    lu: bool
    date_creation: datetime
    lien: str | None = None
    reference_id: int | None = None

    model_config = {"from_attributes": True}
