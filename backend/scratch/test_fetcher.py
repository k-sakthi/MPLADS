import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

from app.services.mplads_fetcher import MPLADSFetcher

async def main():
    fetcher = MPLADSFetcher()
    print("Fetching Works Recommended...")
    try:
        data = await fetcher.fetch_report("works_recommended")
        print(f"Success! Fetched {len(data)} records.")
        if len(data) > 0:
            print("First record:", data[0])
    except Exception as e:
        print(f"Failed: {repr(e)}")

if __name__ == "__main__":
    asyncio.run(main())
