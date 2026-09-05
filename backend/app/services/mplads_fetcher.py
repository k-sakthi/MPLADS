import httpx
import json
import logging
from typing import Dict, Any, List
from app.config import settings
import asyncio

logger = logging.getLogger(__name__)

REPORTS = {
    "allocated_limit": "Allocated Limit for Hon'ble MPs",
    "works_recommended": "Works Recommended",
    "works_sanctioned": "Works Sanctioned",
    "works_completed": "Works Completed",
    "expenditure": "Expenditure on Completed and On-going Works as on Date",
    "calamity": "Amount consented for Calamity"
}

COMMON_COMBO = "0,0,0,2"

class MPLADSFetcher:
    def __init__(self):
        self.url = settings.MPLADS_API_URL
        self.headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

    async def fetch_report(self, report_key: str) -> List[Dict[str, Any]]:
        if report_key not in REPORTS:
            raise ValueError(f"Unknown report key: {report_key}")

        report_name = REPORTS[report_key]
        payload = {
            "combo": COMMON_COMBO,
            "key": report_name
        }

        # Setup retry logic with backoff
        max_retries = 3
        all_data = []
        combos = ["0,0,0,1", "0,0,0,2"] # 1: Rajya Sabha, 2: Lok Sabha

        for combo in combos:
            payload = {
                "combo": combo,
                "key": report_name
            }
            combo_data = []
            
            for attempt in range(max_retries):
                try:
                    # Disable SSL verify as the site might have cert issues, per earlier testing
                    async with httpx.AsyncClient(verify=False, timeout=settings.API_TIMEOUT_SECONDS) as client:
                        response = await client.post(self.url, json=payload, headers=self.headers)
                        response.raise_for_status()
                        
                        text_content = response.content.decode('utf-8', errors='replace')
                        data = json.loads(text_content)
                        if not data:
                            logger.warning(f"Empty JSON response for {report_name} combo {combo}")
                            break
                            
                        first_key = list(data.keys())[0]
                        inner_data_str = data.get(first_key)
                        
                        if not inner_data_str:
                            break
                            
                        if isinstance(inner_data_str, str):
                            try:
                                parsed_data = json.loads(inner_data_str)
                                if isinstance(parsed_data, list):
                                    combo_data = parsed_data
                                    break # success, exit retry loop
                                else:
                                    logger.error(f"Data for {report_name} combo {combo} is not a list after parsing.")
                                    break
                            except json.JSONDecodeError as e:
                                logger.error(f"Failed to parse inner JSON string for {report_name} combo {combo}: {e}")
                                break
                        else:
                            logger.error(f"Expected string for inner data in {report_name} combo {combo}, got {type(inner_data_str)}")
                            break
                            
                except httpx.HTTPError as e:
                    logger.error(f"HTTP error fetching {report_name} combo {combo} (attempt {attempt+1}/{max_retries}): {e}")
                    if attempt == max_retries - 1:
                        # Log and continue to next combo even if this one completely fails
                        pass
                    await asyncio.sleep(2 ** attempt) # Exponential backoff
                except Exception as e:
                    logger.error(f"Unexpected error fetching {report_name} combo {combo}: {e}")
                    # Keep trying other combos even if this fails
                    break
            
            all_data.extend(combo_data)
            
        return all_data

