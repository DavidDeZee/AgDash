#!/usr/bin/env python3
"""
Robust Agricultural Data Fetcher for USDA NASS QuickStats API
Features:
- Retry logic for failed API calls
- Detailed logging of all operations
- Data validation and completeness checks
- Intermediate caching to prevent data loss
- Progress tracking
"""

import requests
import pandas as pd
from functools import reduce
import time
import os
import json
import logging
from datetime import datetime
from typing import Dict, Optional, List, Tuple

# --- Setup Logging -----------------------------------------------------------

LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "logs")
os.makedirs(LOG_DIR, exist_ok=True)

log_filename = os.path.join(LOG_DIR, f"fetch_ag_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_filename),
        logging.StreamHandler()  # Also print to console
    ]
)
logger = logging.getLogger(__name__)

# --- Constants ---------------------------------------------------------------

API_KEY = "E8A03C0D-5253-3598-B95D-C8B0D7F6F8B2"
BASE_URL = "https://quickstats.nass.usda.gov/api/api_GET/"

COMMON_PARAMS = {
    "key": API_KEY,
    "source_desc": "CENSUS",
    "year": "2022",
    "agg_level_desc": "COUNTY",
    "domain_desc": "TOTAL",
    "format": "JSON",
}

TARGET_STATES = ["OR", "WA", "CA", "NV", "ID", "MT"]

# API Configuration
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds
API_DELAY = 2    # seconds between requests

# --- Metrics Dictionary ------------------------------------------------------

METRICS = {
    # --- CORE LAND & OPERATIONS ---
    "farms": ("FARM OPERATIONS - NUMBER OF OPERATIONS", None),
    "cropland_acres": ("AG LAND, CROPLAND - ACRES", None),
    "harvested_cropland_acres": ("AG LAND, CROPLAND, HARVESTED - ACRES", None),
    "irrigated_acres": ("AG LAND, IRRIGATED - ACRES", {"prodn_practice_desc": "IRRIGATED"}),

    # --- FINANCIALS ---
    "market_value_total_dollars": ("COMMODITY TOTALS - SALES, MEASURED IN $", None),
    "crops_sales_dollars": ("CROP TOTALS - SALES, MEASURED IN $", None),
    "livestock_sales_dollars": ("ANIMAL TOTALS, INCL PRODUCTS - SALES, MEASURED IN $", None),
    "gov_payments_dollars": ("GOVT PROGRAMS, FEDERAL - RECEIPTS, MEASURED IN $", None),

    # --- CROP SPECIFICS ---
    "apples_acres": ("APPLES - ACRES BEARING & NON-BEARING", None),
    "wheat_acres": ("WHEAT - ACRES HARVESTED", None),
    "rice_acres": ("RICE - ACRES HARVESTED", None),
    "hazelnuts_acres": ("HAZELNUTS - ACRES BEARING & NON-BEARING", None),

    # Grass Seeds
    "grass_seed_bentgrass_acres": ("GRASSES, BENTGRASS, SEED - ACRES HARVESTED", None),
    "grass_seed_bermudagrass_acres": ("GRASSES, BERMUDA GRASS, SEED - ACRES HARVESTED", None),
    "grass_seed_bluegrass_acres": ("GRASSES, BLUEGRASS, KENTUCKY, SEED - ACRES HARVESTED", None),
    "grass_seed_bromegrass_acres": ("GRASSES, BROMEGRASS, SEED - ACRES HARVESTED", None),
    "grass_seed_fescue_acres": ("GRASSES, FESCUE, SEED - ACRES HARVESTED", None),
    "grass_seed_orchardgrass_acres": ("GRASSES, ORCHARDGRASS, SEED - ACRES HARVESTED", None),
    "grass_seed_ryegrass_acres": ("GRASSES, RYEGRASS, SEED - ACRES HARVESTED", None),
    "grass_seed_sudangrass_acres": ("GRASSES, SUDANGRASS, SEED - ACRES HARVESTED", None),
    "grass_seed_timothy_acres": ("GRASSES, TIMOTHY, SEED - ACRES HARVESTED", None),
    "grass_seed_wheatgrass_acres": ("GRASSES, WHEATGRASS, SEED - ACRES HARVESTED", None),

    # CORN
    "corn_acres": ("CORN, GRAIN - ACRES HARVESTED", None),
    "corn_silage_acres": ("CORN, SILAGE - ACRES HARVESTED", None),

    # HAY
    "hay_acres": ("HAY - ACRES HARVESTED", None),
    "haylage_acres": ("HAYLAGE - ACRES HARVESTED", None),

    # LIVESTOCK
    "beef_cattle_head": ("CATTLE, COWS, BEEF - INVENTORY", None),
    "dairy_cattle_head": ("CATTLE, COWS, MILK - INVENTORY", None),
}

# --- Cache Directory ---------------------------------------------------------

CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "cache")
os.makedirs(CACHE_DIR, exist_ok=True)

# --- Helper Functions --------------------------------------------------------

def fetch_with_retry(url: str, params: dict, max_retries: int = MAX_RETRIES) -> Optional[dict]:
    """
    Fetch data from API with retry logic.
    Returns the JSON response or None if all retries failed.
    """
    for attempt in range(max_retries):
        try:
            logger.debug(f"API Request (attempt {attempt + 1}/{max_retries}): {params.get('short_desc', 'Unknown')} - {params.get('state_alpha', 'Unknown')}")

            r = requests.get(url, params=params, timeout=30)

            if r.status_code == 200:
                data = r.json()
                return data
            elif r.status_code == 429:  # Rate limit
                logger.warning(f"Rate limited. Waiting {RETRY_DELAY * 2} seconds...")
                time.sleep(RETRY_DELAY * 2)
            else:
                logger.warning(f"HTTP {r.status_code}: {r.text[:200]}")

        except requests.exceptions.Timeout:
            logger.warning(f"Timeout on attempt {attempt + 1}")
        except requests.exceptions.RequestException as e:
            logger.warning(f"Request error: {e}")
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")

        if attempt < max_retries - 1:
            time.sleep(RETRY_DELAY)

    logger.error(f"All {max_retries} attempts failed for {params.get('short_desc', 'Unknown')}")
    return None


def fetch_metric_multistate(short_desc: str, metric_name: str, extra_params: dict = None) -> pd.DataFrame:
    """
    Fetches data for a specific metric across all TARGET_STATES with caching.
    """
    # Check cache first
    cache_file = os.path.join(CACHE_DIR, f"{metric_name}.csv")
    if os.path.exists(cache_file):
        logger.info(f"Loading {metric_name} from cache")
        return pd.read_csv(cache_file)

    all_states_data = []
    states_fetched = []
    states_failed = []

    for state in TARGET_STATES:
        params = COMMON_PARAMS.copy()
        params["short_desc"] = short_desc
        params["state_alpha"] = state

        if extra_params:
            params.update(extra_params)

        logger.info(f"Fetching {metric_name} for {state}...")

        data = fetch_with_retry(BASE_URL, params)

        if data and "data" in data and len(data["data"]) > 0:
            df = pd.DataFrame(data["data"])
            df = df[["state_name", "county_name", "year", "Value"]]
            all_states_data.append(df)
            states_fetched.append(state)
            logger.info(f"✓ {state}: {len(df)} records")
        elif data and "data" in data:
            logger.warning(f"✗ {state}: No data available")
            states_failed.append(f"{state} (no data)")
        else:
            logger.error(f"✗ {state}: API request failed")
            states_failed.append(f"{state} (failed)")

        time.sleep(API_DELAY)

    # Summary
    logger.info(f"Summary for {metric_name}:")
    logger.info(f"  ✓ Successfully fetched: {len(states_fetched)} states {states_fetched}")
    if states_failed:
        logger.warning(f"  ✗ Failed/No data: {len(states_failed)} states {states_failed}")

    if not all_states_data:
        logger.warning(f"No data collected for {metric_name}")
        return pd.DataFrame()

    combined_df = pd.concat(all_states_data, ignore_index=True)

    # Cache the result
    combined_df.to_csv(cache_file, index=False)
    logger.info(f"Cached {metric_name} ({len(combined_df)} total records)")

    return combined_df


def validate_data(df: pd.DataFrame, metric_name: str) -> Dict[str, any]:
    """
    Validate fetched data and return statistics.
    """
    stats = {
        'metric': metric_name,
        'total_rows': len(df),
        'unique_states': df['state_name'].nunique() if 'state_name' in df.columns else 0,
        'unique_counties': df['county_name'].nunique() if 'county_name' in df.columns else 0,
        'non_null_values': 0,
        'null_values': 0,
        'withheld_d_values': 0
    }

    if metric_name in df.columns:
        stats['non_null_values'] = df[metric_name].notna().sum()
        stats['null_values'] = df[metric_name].isna().sum()

        # Count (D) values before they were converted to NaN
        # This is an estimate based on nulls

    return stats


# --- Main Script Logic -------------------------------------------------------

def main():
    logger.info("=" * 80)
    logger.info("USDA NASS QuickStats Data Fetch - ROBUST VERSION")
    logger.info(f"Target States: {', '.join(TARGET_STATES)}")
    logger.info(f"Total Metrics: {len(METRICS)}")
    logger.info(f"Log file: {log_filename}")
    logger.info("=" * 80)

    frames = []
    fetch_stats = []

    total_metrics = len(METRICS)

    for idx, (col_name, (desc, extras)) in enumerate(METRICS.items(), 1):
        logger.info(f"\n[{idx}/{total_metrics}] Fetching: {col_name}")
        logger.info(f"API Query: {desc}")

        try:
            df = fetch_metric_multistate(desc, col_name, extra_params=extras)

            if not df.empty:
                df.rename(columns={"Value": col_name}, inplace=True)
                frames.append(df)

                stats = validate_data(df, col_name)
                fetch_stats.append(stats)

                logger.info(f"✓ {col_name} fetched successfully: {stats['total_rows']} rows")
            else:
                logger.warning(f"✗ {col_name} returned no data")
                fetch_stats.append({'metric': col_name, 'total_rows': 0, 'error': 'No data'})

        except Exception as e:
            logger.error(f"✗ CRITICAL ERROR processing {col_name}: {e}", exc_info=True)
            fetch_stats.append({'metric': col_name, 'error': str(e)})

        logger.info("-" * 80)

    # --- Summary Report ---
    logger.info("\n" + "=" * 80)
    logger.info("FETCH SUMMARY")
    logger.info("=" * 80)

    successful = [s for s in fetch_stats if s.get('total_rows', 0) > 0]
    failed = [s for s in fetch_stats if s.get('total_rows', 0) == 0]

    logger.info(f"✓ Successfully fetched: {len(successful)}/{total_metrics} metrics")
    logger.info(f"✗ Failed/No data: {len(failed)}/{total_metrics} metrics")

    if failed:
        logger.warning("\nMetrics with issues:")
        for stat in failed:
            logger.warning(f"  - {stat['metric']}: {stat.get('error', 'No data available')}")

    if not frames:
        logger.error("\n❌ CRITICAL: No data was successfully fetched. Exiting.")
        return

    # --- Merge Data ---
    logger.info("\n" + "=" * 80)
    logger.info("MERGING DATA")
    logger.info("=" * 80)

    logger.info(f"Merging {len(frames)} dataframes...")

    merged = reduce(
        lambda left, right: pd.merge(
            left, right, on=["state_name", "county_name", "year"], how="outer"
        ),
        frames,
    )

    logger.info(f"✓ Merged successfully: {len(merged)} rows")

    # --- Data Cleaning ---
    logger.info("\n" + "=" * 80)
    logger.info("CLEANING DATA")
    logger.info("=" * 80)

    cols_to_clean = [col for col in METRICS.keys() if col in merged.columns]

    logger.info(f"Cleaning {len(cols_to_clean)} columns...")

    for col in cols_to_clean:
        original_nulls = merged[col].isna().sum()

        # Convert to string, strip, remove commas, convert to numeric
        clean_series = merged[col].astype(str).str.strip().str.replace(",", "", regex=False)
        merged[col] = pd.to_numeric(clean_series, errors='coerce')

        new_nulls = merged[col].isna().sum()
        withheld = new_nulls - original_nulls

        if withheld > 0:
            logger.info(f"  {col}: {withheld} values withheld/invalid (converted to NaN)")

    # --- Calculated Fields ---
    logger.info("\n" + "=" * 80)
    logger.info("CALCULATING DERIVED FIELDS")
    logger.info("=" * 80)

    # Calculate total grass seed acres
    grass_seed_cols = [
        "grass_seed_bentgrass_acres", "grass_seed_bermudagrass_acres",
        "grass_seed_bluegrass_acres", "grass_seed_bromegrass_acres",
        "grass_seed_fescue_acres", "grass_seed_orchardgrass_acres",
        "grass_seed_ryegrass_acres", "grass_seed_sudangrass_acres",
        "grass_seed_timothy_acres", "grass_seed_wheatgrass_acres"
    ]

    existing_grass_cols = [col for col in grass_seed_cols if col in merged.columns]
    if existing_grass_cols:
        logger.info(f"Calculating grass_seed_acres from {len(existing_grass_cols)} columns...")
        merged["grass_seed_acres"] = merged[existing_grass_cols].fillna(0).sum(axis=1)
        merged.loc[merged[existing_grass_cols].isna().all(axis=1), "grass_seed_acres"] = None
        logger.info(f"✓ grass_seed_acres calculated")

    # --- Save Output ---
    logger.info("\n" + "=" * 80)
    logger.info("SAVING OUTPUT")
    logger.info("=" * 80)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "..", "public", "data")
    os.makedirs(output_dir, exist_ok=True)
    output_filename = os.path.join(output_dir, "ag_data.csv")

    merged.to_csv(output_filename, index=False)
    logger.info(f"✓ Saved to: {output_filename}")
    logger.info(f"✓ Total Rows: {len(merged)}")
    logger.info(f"✓ Total Columns: {len(merged.columns)}")

    # --- Data Completeness Report ---
    logger.info("\n" + "=" * 80)
    logger.info("DATA COMPLETENESS REPORT")
    logger.info("=" * 80)

    for col in cols_to_clean:
        non_null = merged[col].notna().sum()
        null = merged[col].isna().sum()
        pct_complete = (non_null / len(merged)) * 100 if len(merged) > 0 else 0

        status = "✓" if pct_complete > 50 else "⚠" if pct_complete > 10 else "✗"
        logger.info(f"{status} {col:40s}: {non_null:5d}/{len(merged):5d} ({pct_complete:5.1f}%)")

    logger.info("\n" + "=" * 80)
    logger.info("✓ SUCCESS! Data fetch completed.")
    logger.info(f"✓ Log saved to: {log_filename}")
    logger.info("=" * 80)

    # Print sample
    print("\n" + "=" * 80)
    print("SAMPLE DATA (First 5 rows):")
    print("=" * 80)
    print(merged.head())


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.warning("\n\n⚠ Script interrupted by user")
    except Exception as e:
        logger.error(f"\n\n❌ FATAL ERROR: {e}", exc_info=True)
        raise
