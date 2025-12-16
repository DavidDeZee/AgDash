#!/usr/bin/env python3
"""
Quick test of the enhanced data fetcher on Lane County and Yakima County
to verify it correctly handles (D) values.
"""

import sys
import os

# Add the scripts directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fetch_ag_data_enhanced import process_county_records, fetch_with_retry, COMMON_PARAMS, BASE_URL

def test_lane_county_beef():
    """Test Lane County, OR beef cattle (known to have (D) total but disclosed subcategories)"""
    print("=" * 80)
    print("TEST 1: Lane County, OR - Beef Cattle")
    print("=" * 80)

    params = COMMON_PARAMS.copy()
    params["short_desc"] = "CATTLE, COWS, BEEF - INVENTORY"
    params["state_alpha"] = "OR"
    params["county_name"] = "LANE"
    # Don't filter by domain_desc - get ALL records

    data = fetch_with_retry(BASE_URL, params)

    if data and "data" in data:
        records = data["data"]
        print(f"Retrieved {len(records)} records from API")

        print("\nAll records:")
        for i, rec in enumerate(records, 1):
            print(f"  {i}. {rec.get('domaincat_desc')}: {rec.get('Value')}")

        value, is_estimated = process_county_records(records)

        print(f"\nResult:")
        print(f"  Value: {value}")
        print(f"  Is Estimated: {is_estimated}")
        print(f"  Expected: ~7,500 (estimated from subcategories)")

        if value and value > 7000:
            print("✓ TEST PASSED!")
        else:
            print("✗ TEST FAILED - expected value around 7,500")
    else:
        print("✗ Failed to fetch data")

    print()


def test_yakima_harvested():
    """Test Yakima County, WA harvested cropland (known to have (D) total)"""
    print("=" * 80)
    print("TEST 2: Yakima County, WA - Harvested Cropland")
    print("=" * 80)

    params = COMMON_PARAMS.copy()
    params["short_desc"] = "AG LAND, CROPLAND, HARVESTED - ACRES"
    params["state_alpha"] = "WA"
    params["county_name"] = "YAKIMA"
    # Don't filter by domain_desc - get ALL records

    data = fetch_with_retry(BASE_URL, params)

    if data and "data" in data:
        records = data["data"]
        print(f"Retrieved {len(records)} records from API")

        print(f"\nShowing first 10 records:")
        for i, rec in enumerate(records[:10], 1):
            print(f"  {i}. {rec.get('domaincat_desc')}: {rec.get('Value')}")
        print(f"  ... and {len(records) - 10} more records")

        value, is_estimated = process_county_records(records)

        print(f"\nResult:")
        print(f"  Value: {value}")
        print(f"  Is Estimated: {is_estimated}")
        print(f"  Expected: ~239,000+ acres (estimated from subcategories)")

        if value and value > 200000:
            print("✓ TEST PASSED!")
        else:
            print("✗ TEST FAILED - expected value around 239,000")
    else:
        print("✗ Failed to fetch data")

    print()


def test_fresno_beef():
    """Test Fresno County, CA beef cattle (should have actual total, not (D))"""
    print("=" * 80)
    print("TEST 3: Fresno County, CA - Beef Cattle (should have actual total)")
    print("=" * 80)

    params = COMMON_PARAMS.copy()
    params["short_desc"] = "CATTLE, COWS, BEEF - INVENTORY"
    params["state_alpha"] = "CA"
    params["county_name"] = "FRESNO"

    data = fetch_with_retry(BASE_URL, params)

    if data and "data" in data:
        records = data["data"]
        print(f"Retrieved {len(records)} records from API")

        # Find the NOT SPECIFIED record
        for rec in records:
            if rec.get('domaincat_desc') == 'NOT SPECIFIED':
                print(f"\nNOT SPECIFIED (total) value: {rec.get('Value')}")

        value, is_estimated = process_county_records(records)

        print(f"\nResult:")
        print(f"  Value: {value}")
        print(f"  Is Estimated: {is_estimated}")
        print(f"  Expected: Should NOT be estimated (actual total available)")

        if value and not is_estimated:
            print("✓ TEST PASSED!")
        else:
            print("✗ TEST FAILED - expected actual total, not estimated")
    else:
        print("✗ Failed to fetch data")

    print()


if __name__ == "__main__":
    test_lane_county_beef()
    test_yakima_harvested()
    test_fresno_beef()

    print("=" * 80)
    print("All tests complete!")
    print("=" * 80)
