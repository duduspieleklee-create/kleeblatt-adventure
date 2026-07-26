from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class WalletLoginRequest(BaseModel):
    wallet_address: str = Field(..., min_length=42, max_length=42, pattern=r"^0x[a-fA-F0-9]{40}$")
    username: Optional[str] = Field(None, min_length=3, max_length=24, pattern=r"^[a-zA-Z0-9_-]+$")


class GuestLoginRequest(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=24, pattern=r"^[a-zA-Z0-9_-]+$")


class LinkWalletRequest(BaseModel):
    wallet_address: str = Field(..., min_length=42, max_length=42, pattern=r"^0x[a-fA-F0-9]{40}$")
    username: Optional[str] = Field(None, min_length=3, max_length=24, pattern=r"^[a-zA-Z0-9_-]+$")


class UpdateUsernameRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=24, pattern=r"^[a-zA-Z0-9_-]+$")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    wallet_address: Optional[str] = None
    is_guest: bool


class ProfileResponse(BaseModel):
    user_id: int
    username: str
    wallet_address: Optional[str]
    is_guest: bool
    total_points: int
    high_score: int
    total_treasures: int
    games_played: int


class DailyLeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    points_today: int


class DailyAwardResponse(BaseModel):
    rank: int
    username: str
    coins_awarded: int
    tx_hash: Optional[str]
    date: str


class ScoreSubmitRequest(BaseModel):
    score: int = Field(..., ge=0)
    treasures_collected: int = Field(..., ge=0)


class ScoreResponse(BaseModel):
    id: int
    score: int
    treasures_collected: int
    username: str
    created_at: datetime

    class Config:
        from_attributes = True
