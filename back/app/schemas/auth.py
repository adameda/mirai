from pydantic import BaseModel
from .user import UserOut


class TokenOut(BaseModel):
    access_token: str
    user: UserOut
