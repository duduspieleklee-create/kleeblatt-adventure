from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, GameScore, DailyAward
from schemas import (
    WalletLoginRequest, GuestLoginRequest, LinkWalletRequest,
    UpdateUsernameRequest, TokenResponse, ProfileResponse,
    ScoreSubmitRequest, ScoreResponse, DailyLeaderboardEntry,
    DailyAwardResponse,
)
from auth import create_token, decode_token, generate_guest_username

router = APIRouter(prefix="/api/game", tags=["game"])


def get_current_user(token: str, db: Session) -> User | None:
    payload = decode_token(token)
    if payload is None:
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    return db.query(User).filter(User.id == int(user_id)).first()


def _token_response(user: User) -> dict:
    token = create_token(user.id, user.username)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "wallet_address": user.wallet_address,
        "is_guest": user.is_guest,
    }


def _ensure_username_unique(username: str, db: Session) -> bool:
    existing = db.query(User).filter(User.username == username).first()
    return existing is None


#
# Authentication
#

@router.post("/guest", response_model=TokenResponse)
def guest_login(body: GuestLoginRequest = GuestLoginRequest(), db: Session = Depends(get_db)):
    if body.username:
        if not _ensure_username_unique(body.username, db):
            raise HTTPException(409, "Username already taken")
        username = body.username
    else:
        username = generate_guest_username()
        while not _ensure_username_unique(username, db):
            username = generate_guest_username()

    user = User(username=username, is_guest=True)
    db.add(user)
    db.commit()
    db.refresh(user)

    return _token_response(user)


@router.post("/wallet", response_model=TokenResponse)
def wallet_login(body: WalletLoginRequest, db: Session = Depends(get_db)):
    addr = body.wallet_address.lower()
    user = db.query(User).filter(User.wallet_address == addr).first()

    if user is None:
        if body.username:
            if not _ensure_username_unique(body.username, db):
                raise HTTPException(409, "Username already taken")
            username = body.username
        else:
            username = f"wallet-{addr[2:8]}"
            while not _ensure_username_unique(username, db):
                username = f"wallet-{addr[2:8]}-{addr[8:12]}"

        user = User(username=username, wallet_address=addr, is_guest=False)
        db.add(user)
        db.commit()
        db.refresh(user)

    return _token_response(user)


#
# Link wallet to existing account
#

@router.post("/link-wallet", response_model=TokenResponse)
def link_wallet(body: LinkWalletRequest, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if user is None:
        raise HTTPException(401, "Invalid or expired token")

    addr = body.wallet_address.lower()

    existing = db.query(User).filter(User.wallet_address == addr, User.id != user.id).first()
    if existing:
        raise HTTPException(409, "Wallet already linked to another account")

    user.wallet_address = addr
    user.is_guest = False

    if body.username:
        if body.username != user.username:
            if not _ensure_username_unique(body.username, db):
                raise HTTPException(409, "Username already taken")
            user.username = body.username

    db.commit()
    db.refresh(user)

    return _token_response(user)


#
# Update username
#

@router.patch("/username", response_model=TokenResponse)
def update_username(body: UpdateUsernameRequest, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if user is None:
        raise HTTPException(401, "Invalid or expired token")

    if not _ensure_username_unique(body.username, db):
        raise HTTPException(409, "Username already taken")

    user.username = body.username
    db.commit()
    db.refresh(user)

    return _token_response(user)


#
# Username check
#

@router.get("/check-username")
def check_username(username: str, db: Session = Depends(get_db)):
    available = _ensure_username_unique(username, db)
    return {"username": username, "available": available}


#
# Profile
#

@router.get("/profile", response_model=ProfileResponse)
def get_profile(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if user is None:
        raise HTTPException(401, "Invalid or expired token")

    scores = db.query(GameScore).filter(GameScore.user_id == user.id)
    max_score = db.query(func.max(GameScore.score)).filter(GameScore.user_id == user.id).scalar() or 0
    total_treasures = db.query(func.sum(GameScore.treasures_collected)).filter(GameScore.user_id == user.id).scalar() or 0
    games_played = scores.count()

    return {
        "user_id": user.id,
        "username": user.username,
        "wallet_address": user.wallet_address,
        "is_guest": user.is_guest,
        "total_points": user.total_points,
        "high_score": max_score,
        "total_treasures": total_treasures,
        "games_played": games_played,
    }


#
# Score
#

@router.post("/score", response_model=ScoreResponse)
def submit_score(body: ScoreSubmitRequest, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if user is None:
        raise HTTPException(401, "Invalid or expired token")

    score = GameScore(
        user_id=user.id,
        score=body.score,
        treasures_collected=body.treasures_collected,
    )
    db.add(score)

    user.total_points += body.score
    if body.treasures_collected:
        user.total_points += body.treasures_collected

    db.commit()
    db.refresh(score)

    return {
        "id": score.id,
        "score": score.score,
        "treasures_collected": score.treasures_collected,
        "username": user.username,
        "created_at": score.created_at,
    }


#
# Daily Leaderboard
#

@router.get("/daily-leaderboard", response_model=list[DailyLeaderboardEntry])
def get_daily_leaderboard(
    target_date: date = Query(None),
    limit: int = 50,
    db: Session = Depends(get_db),
):
    target = target_date or date.today()
    next_day = target + timedelta(days=1)

    scores = (
        db.query(
            GameScore.user_id,
            func.sum(GameScore.score).label("points_today"),
            User.username,
        )
        .join(User, GameScore.user_id == User.id)
        .filter(GameScore.created_at >= target, GameScore.created_at < next_day)
        .group_by(GameScore.user_id, User.username)
        .order_by(func.sum(GameScore.score).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "rank": i + 1,
            "user_id": row.user_id,
            "username": row.username,
            "points_today": row.points_today,
        }
        for i, row in enumerate(scores)
    ]


#
# Daily Awards
#

@router.get("/daily-awards", response_model=list[DailyAwardResponse])
def get_daily_awards(
    target_date: date = Query(None),
    db: Session = Depends(get_db),
):
    target = target_date or date.today()

    awards = (
        db.query(DailyAward, User.username)
        .join(User, DailyAward.user_id == User.id)
        .filter(DailyAward.date == target)
        .order_by(DailyAward.rank)
        .all()
    )

    return [
        {
            "rank": a.rank,
            "username": uname,
            "coins_awarded": a.coins_awarded,
            "tx_hash": a.tx_hash,
            "date": str(a.date),
        }
        for a, uname in awards
    ]


#
# Leaderboard
#

@router.get("/leaderboard", response_model=list[ScoreResponse])
def get_leaderboard(limit: int = 50, db: Session = Depends(get_db)):
    top = (
        db.query(GameScore, User.username)
        .join(User, GameScore.user_id == User.id)
        .order_by(GameScore.score.desc(), GameScore.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": s.id,
            "score": s.score,
            "treasures_collected": s.treasures_collected,
            "username": uname,
            "created_at": s.created_at,
        }
        for s, uname in top
    ]
