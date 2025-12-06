import requests
import pandas as pd
from functools import reduce
import time
import os

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

# --- Metrics Dictionary ------------------------------------------------------

METRICS = {
    # --- CORE LAND & OPERATIONS ---
    "farms": ("FARM OPERATIONS - NUMBER OF OPERATIONS", None),
    # "land_owned_acres": ("AG LAND, OWNED, IN FARMS - ACRES", None),
    # "land_rented_acres": ("AG LAND, RENTED FROM OTHERS, IN FARMS - ACRES", None),
    "cropland_acres": ("AG LAND, CROPLAND - ACRES", None),
    "harvested_cropland_acres": ("AG LAND, CROPLAND, HARVESTED - ACRES", None),
    "irrigated_acres": ("AG LAND, IRRIGATED - ACRES", {"prodn_practice_desc": "IRRIGATED"}),

    # --- FINANCIALS (Key for Sales Potential) ---
    "market_value_total_dollars": ("COMMODITY TOTALS - SALES, MEASURED IN $", None),
    "crops_sales_dollars": ("CROP TOTALS - SALES, MEASURED IN $", None),
    "livestock_sales_dollars": ("ANIMAL TOTALS, INCL PRODUCTS - SALES, MEASURED IN $", None),
    "gov_payments_dollars": ("GOVT PROGRAMS, FEDERAL - RECEIPTS, MEASURED IN $", None),
    # "net_cash_income_dollars": ("INCOME, NET CASH FARM, OF OPERATIONS - NET INCOME, MEASURED IN $", None),

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
    # "grass_seed_redtop_acres": ("GRASSES, REDTOP, SEED - ACRES HARVESTED", None),
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

    # COWS
    "beef_cattle_head": ("CATTLE, COWS, BEEF - INVENTORY", None),
    "dairy_cattle_head": ("CATTLE, COWS, MILK - INVENTORY", None),

}

# --- Helper Function ---------------------------------------------------------

def fetch_metric_multistate(short_desc: str, extra_params: dict = None) -> pd.DataFrame:
    """
    Fetches data for a specific metric across all TARGET_STATES.
    """
    all_states_data = []

    for state in TARGET_STATES:
        # Create a fresh params dictionary for this state
        params = COMMON_PARAMS.copy()
        params["short_desc"] = short_desc
        params["state_alpha"] = state
        
        if extra_params:
            params.update(extra_params)
            
        print(f"    Requesting {state}...", end=" ")
        
        try:
            r = requests.get(BASE_URL, params=params)
            
            if r.status_code == 200:
                data = r.json()
                if "data" in data and len(data["data"]) > 0:
                    df = pd.DataFrame(data["data"])
                    # Keep only essential columns to avoid merge conflicts later
                    df = df[["state_name", "county_name", "year", "Value"]]
                    all_states_data.append(df)
                    print(f"Success ({len(df)} rows)")
                else:
                    print("No data found.")
            else:
                print(f"Failed (Status {r.status_code})")
                
        except Exception as e:
            print(f"Error: {e}")
            
        # Be polite to the API to avoid rate limiting
        time.sleep(2)
        # We're going to be mean to the api for now, otherwise this takes forever. 

    if not all_states_data:
        return pd.DataFrame()
        
    return pd.concat(all_states_data, ignore_index=True)

# --- Main Script Logic -------------------------------------------------------

def main():
    frames = []

    print(f"Starting Multi-State Fetch for: {', '.join(TARGET_STATES)}")
    print("-" * 60)

    for col_name, (desc, extras) in METRICS.items():
        print(f"Fetching metric: {col_name}")
        try:
            df = fetch_metric_multistate(desc, extra_params=extras)
            
            if not df.empty:
                # Rename 'Value' to the specific metric name (e.g., 'farms')
                df.rename(columns={"Value": col_name}, inplace=True)
                frames.append(df)
            else:
                print(f"  Warning: No data returned for {col_name} across any state.")
                
        except Exception as e:
            print(f"  CRITICAL FAILURE processing {col_name}: {e}")
        print("-" * 60)

    if not frames:
        print("\nNo data was successfully fetched. Exiting.")
    else:
        print("\nAll data fetched. Merging...")
        
        # Merge all dataframes together on shared keys
        merged = reduce(
            lambda left, right: pd.merge(
                left, right, on=["state_name", "county_name", "year"], how="outer"
            ),
            frames,
        )

        # --- Post-Processing and Cleaning ---
        print("Cleaning data (removing commas, handling (D) values)...")
        
        cols_to_clean = list(METRICS.keys())

        for col in cols_to_clean:
            if col in merged.columns:
                # 1. Convert to string
                clean_series = merged[col].astype(str)
                
                # 2. Strip whitespace (Fixes the " (D)" crash)
                clean_series = clean_series.str.strip()
                
                # 3. Remove commas (e.g. "1,000" -> "1000")
                clean_series = clean_series.str.replace(",", "", regex=False)
                
                # 4. Force to numeric (Coerce errors like "(D)" or "(Z)" into NaN/Empty)
                merged[col] = pd.to_numeric(clean_series, errors='coerce')

        # Create 'land_in_farms_acres'
        if "land_owned_acres" in merged.columns and "land_rented_acres" in merged.columns:
            print("Calculating 'land_in_farms_acres'...")
            merged["land_in_farms_acres"] = merged["land_owned_acres"].fillna(0) + \
                                             merged["land_rented_acres"].fillna(0)

        # Calculate 'grass_seed_acres'
        grass_seed_cols = [
            "grass_seed_bentgrass_acres", "grass_seed_bermudagrass_acres", 
            "grass_seed_bluegrass_acres", "grass_seed_bromegrass_acres", 
            "grass_seed_fescue_acres", "grass_seed_orchardgrass_acres", 
            "grass_seed_redtop_acres", "grass_seed_ryegrass_acres", 
            "grass_seed_sudangrass_acres", "grass_seed_timothy_acres", 
            "grass_seed_wheatgrass_acres"
        ]
        
        # Check if any of the grass seed columns exist
        if any(col in merged.columns for col in grass_seed_cols):
            print("Calculating 'grass_seed_acres'...")
            merged["grass_seed_acres"] = 0
            for col in grass_seed_cols:
                merged["grass_seed_acres"] += merged.get(col, pd.Series(0, index=merged.index)).fillna(0)

        # Save to CSV
        # Determine the output path relative to this script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        # Go up one level to root, then into public/data
        output_dir = os.path.join(script_dir, "..", "public", "data")
        os.makedirs(output_dir, exist_ok=True)
        output_filename = os.path.join(output_dir, "ag_data.csv")
        
        merged.to_csv(output_filename, index=False)
        print(f"\nSUCCESS! Saved to {output_filename}")
        print(f"Total Rows: {len(merged)}")
        print(merged.head())

if __name__ == "__main__":
    main()
