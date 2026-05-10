from pydantic import BaseModel
from .user import UserOut


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    user: UserOut


class RefreshIn(BaseModel):
    refresh_token: str


class RefreshOut(BaseModel):
    access_token: str
    refresh_token: str

