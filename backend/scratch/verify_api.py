import asyncio
import os
import sys
import httpx
import json

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
from app.config import settings
from app.services.mplads_fetcher import REPORTS, COMMON_COMBO

async def verify_pipeline():
    print("="*50)
    print("LIVE DATA VERIFICATION")
    print("="*50)
    
    url = settings.MPLADS_API_URL
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
    }

    async with httpx.AsyncClient(verify=False, timeout=300) as client:
        for key, report_name in REPORTS.items():
            print(f"\nREPORT: {report_name}")
            payload = {"combo": COMMON_COMBO, "key": report_name}
            
            try:
                response = await client.post(url, json=payload, headers=headers)
                print(f"HTTP STATUS: {response.status_code}")
                response.raise_for_status()
                
                text_content = response.content.decode('utf-8', errors='replace')
                data = json.loads(text_content)
                
                if not data:
                    print("FETCH STATUS: FAILED (Empty JSON)")
                    continue
                    
                first_key = list(data.keys())[0]
                print(f"RESPONSE KEY: {first_key}")
                
                inner_data_str = data.get(first_key)
                if not inner_data_str:
                    print("FETCH STATUS: FAILED (Empty inner data)")
                    continue
                    
                if isinstance(inner_data_str, str):
                    parsed_data = json.loads(inner_data_str)
                    if isinstance(parsed_data, list):
                        print(f"RECORD COUNT: {len(parsed_data)}")
                        if len(parsed_data) > 0:
                            first_record = parsed_data[0]
                            columns = list(first_record.keys())
                            print(f"IMPORTANT COLUMNS: {', '.join(columns[:12])}{' ...' if len(columns) > 12 else ''}")
                        print("FETCH STATUS: SUCCESS")
                    else:
                        print("FETCH STATUS: FAILED (Not a list)")
                else:
                    print(f"FETCH STATUS: FAILED (Expected string, got {type(inner_data_str)})")
                    
            except Exception as e:
                print(f"FETCH STATUS: FAILED ({repr(e)})")

if __name__ == "__main__":
    asyncio.run(verify_pipeline())
