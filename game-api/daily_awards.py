"""
Daily Awards Job — runs at midnight UTC.
Queries top 10 users by points collected in the past 24 hours,
calls the Node.js chaincode service to mint Kleeblatt Coins,
and stores award records in the daily_awards table.

Run manually: python3 /opt/game-api/daily_awards.py
Run via cron: systemctl start game-api-daily-awards
"""

import os
import sys
import json
from datetime import date, datetime, timedelta
from urllib.request import Request, urlopen
from urllib.error import URLError

sys.path.insert(0, "/opt/game-api")

from database import SessionLocal
from models import User, GameScore, DailyAward
from sqlalchemy import func

MINT_SERVICE_URL = os.getenv("MINT_SERVICE_URL", "http://127.0.0.1:8002")
DRY_RUN = os.getenv("DRY_RUN", "false").lower() == "true"
TOP_N = int(os.getenv("TOP_N", "10"))


def mint_coins(wallet_address: str, rank: int) -> dict | None:
    if not wallet_address:
        print(f"  [rank {rank}] Skipped — no wallet address")
        return None

    url = f"{MINT_SERVICE_URL}/mint-coins"
    body = json.dumps({"walletAddress": wallet_address, "rank": rank}).encode()

    try:
        req = Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
        with urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except URLError as e:
        print(f"  [rank {rank}] Mint failed: {e}")
        return None
    except Exception as e:
        print(f"  [rank {rank}] Unexpected error: {e}")
        return None


def run():
    today = date.today()
    yesterday = today - timedelta(days=1)

    db = SessionLocal()

    print(f"\n=== Daily Awards: {yesterday} ===\n")

    # Already awarded?
    existing = db.query(DailyAward).filter(DailyAward.date == yesterday).count()
    if existing > 0:
        print(f"Already awarded {existing} winners for {yesterday}. Skipping.")
        db.close()
        return

    # Top 10 by score for yesterday
    top = (
        db.query(
            GameScore.user_id,
            func.sum(GameScore.score).label("points_today"),
            User.username,
            User.wallet_address,
        )
        .join(User, GameScore.user_id == User.id)
        .filter(GameScore.created_at >= yesterday, GameScore.created_at < today)
        .group_by(GameScore.user_id, User.username, User.wallet_address)
        .order_by(func.sum(GameScore.score).desc())
        .limit(TOP_N)
        .all()
    )

    if not top:
        print(f"No scores recorded on {yesterday}.")
        db.close()
        return

    print(f"Top {len(top)} players for {yesterday}:\n")

    for rank, row in enumerate(top, 1):
        print(f"  #{rank}  {row.username}  ({row.points_today} pts)  wallet: {row.wallet_address or 'none'}")

    if DRY_RUN:
        print("\n[DRY RUN] No coins minted. Set DRY_RUN=false to mint.")
        db.close()
        return

    print("\nMinting Kleeblatt Coins...\n")
    minted = 0

    for rank, row in enumerate(top, 1):
        if not row.wallet_address:
            print(f"  #{rank} {row.username} — skipped (no wallet)")
            continue

        result = mint_coins(row.wallet_address, rank)

        award = DailyAward(
            user_id=row.user_id,
            date=yesterday,
            rank=rank,
            coins_awarded=0,
            tx_hash=None,
        )

        if result and result.get("success"):
            award.coins_awarded = result.get("amount", 0)
            award.tx_hash = result.get("txId")
            db.add(award)
            db.commit()
            minted += 1
            print(f"  #{rank} {row.username} — {award.coins_awarded} KLB minted (tx: {award.tx_hash})")
        else:
            award.coins_awarded = 0
            db.add(award)
            db.commit()
            print(f"  #{rank} {row.username} — mint failed, recorded for retry")

    db.close()
    print(f"\nDone. {minted}/{TOP_N} awards processed.")


if __name__ == "__main__":
    run()
