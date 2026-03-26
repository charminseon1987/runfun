"""Seed marathons and stamps if tables are empty."""

import asyncio
from datetime import date, timedelta

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.marathon import Marathon
from app.models.stamp import Stamp


async def seed_if_empty() -> None:
    async with AsyncSessionLocal() as session:
        mcount = (await session.execute(select(Marathon))).scalars().first()
        if mcount is None:
            today = date.today()
            session.add_all(
                [
                    Marathon(
                        name="서울 국제 마라톤",
                        region="수도권",
                        race_date=today + timedelta(days=120),
                        location="서울",
                        distances=["full", "10k"],
                        status="soon",
                        apply_url="https://www.seoul-marathon.com",
                        entry_fee=150000,
                    ),
                    Marathon(
                        name="부산 마라톤",
                        region="부산·경남",
                        race_date=today + timedelta(days=90),
                        location="부산",
                        distances=["half", "10k"],
                        status="open",
                        apply_url="https://www.busan-marathon.com",
                        entry_fee=90000,
                    ),
                ]
            )

        scount = (await session.execute(select(Stamp))).scalars().first()
        if scount is None:
            # Rough rectangle near Hangang (for overlap demos)
            polygon = [
                {"lat": 37.52, "lng": 127.05},
                {"lat": 37.54, "lng": 127.05},
                {"lat": 37.54, "lng": 127.08},
                {"lat": 37.52, "lng": 127.08},
            ]
            session.add_all(
                [
                    Stamp(
                        id="hangang-ttukseom",
                        name="한강 뚝섬코스",
                        region="서울",
                        icon="🏃",
                        distance_km=5.2,
                        rarity="bronze",
                        route_polygon=polygon,
                        description="뚝섬 한강공원 러닝",
                    ),
                    Stamp(
                        id="haeundae-beach",
                        name="해운대 비치런",
                        region="부산·경남",
                        icon="🌊",
                        distance_km=5.0,
                        rarity="bronze",
                        route_polygon=[
                            {"lat": 35.158, "lng": 129.16},
                            {"lat": 35.162, "lng": 129.16},
                            {"lat": 35.162, "lng": 129.17},
                            {"lat": 35.158, "lng": 129.17},
                        ],
                        description="해운대 해변 코스",
                    ),
                ]
            )
        await session.commit()


def run_seed_sync() -> None:
    asyncio.get_event_loop().run_until_complete(seed_if_empty())
