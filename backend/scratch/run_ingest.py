import asyncio
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
from app.database import SessionLocal, engine, Base
from app.api.data import fetch_and_store_data

async def main():
    print("Starting manual sync...")
    Base.metadata.create_all(bind=engine)
    await fetch_and_store_data()
    print("Sync complete.")

if __name__ == "__main__":
    asyncio.run(main())
