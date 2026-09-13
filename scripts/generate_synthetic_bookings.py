"""
Generate synthetic booking history for cold-start ML training.

Creates realistic demand patterns with:
- Weekly seasonality (weekend peaks)
- Monthly seasonality (summer boost)
- Zone-specific base demand
- Service-specific demand levels
- Controlled noise for realistic variation
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "bookings_history.csv"


def generate_synthetic(days: int = 90, zones: list[str] | None = None) -> pd.DataFrame:
    if zones is None:
        zones = ["central", "north", "south", "east", "west"]

    np.random.seed(42)
    
    # Service definitions with base demand levels
    services = {
        "svc_001": {"name": "plumbing", "base": 15},
        "svc_002": {"name": "electrical", "base": 12},
        "svc_003": {"name": "cleaning", "base": 20},
        "svc_004": {"name": "ac_repair", "base": 10},
        "svc_005": {"name": "carpentry", "base": 8},
        "svc_006": {"name": "painting", "base": 6},
        "svc_007": {"name": "pest_control", "base": 5},
        "svc_008": {"name": "gardening", "base": 4},
    }
    
    # Zone multipliers (simulating different population densities)
    zone_multipliers = {
        "central": 1.4,
        "north": 1.0,
        "south": 1.2,
        "east": 0.8,
        "west": 0.9
    }
    
    records = []
    base_date = datetime.now(timezone.utc).replace(tzinfo=None) - pd.Timedelta(days=days)

    for day_idx in range(days):
        current = base_date + pd.Timedelta(days=day_idx)
        weekday = current.weekday()
        month = current.month
        day_of_month = current.day

        # Weekly pattern: weekend boost
        weekend_mult = 1.4 if weekday >= 5 else 1.0
        
        # Slight variation for Monday (more emergency repairs)
        monday_mult = 1.15 if weekday == 0 else 1.0
        
        # Monthly pattern: summer (AC repair up, others slightly up)
        summer_mult = 1.2 if month in [4, 5, 6, 7, 8, 9] else 1.0
        
        # Month-end effect (more maintenance scheduled)
        month_end_mult = 1.1 if day_of_month >= 25 else 1.0

        for zone in zones:
            zone_mult = zone_multipliers.get(zone, 1.0)
            
            for service_id, service_info in services.items():
                base_demand = service_info["base"]
                
                # Service-specific seasonality
                if service_id == "svc_004":  # AC repair peaks in summer
                    service_season = 2.0 if month in [5, 6, 7, 8] else 0.7
                elif service_id == "svc_008":  # Gardening peaks in monsoon
                    service_season = 1.5 if month in [6, 7, 8, 9] else 0.8
                elif service_id == "svc_003":  # Cleaning steady year-round
                    service_season = 1.0
                else:
                    service_season = summer_mult
                
                # Calculate demand with controlled noise
                demand = (
                    base_demand 
                    * zone_mult 
                    * weekend_mult 
                    * monday_mult
                    * service_season 
                    * month_end_mult
                )
                
                # Add small Gaussian noise (±15%)
                noise = np.random.normal(1.0, 0.15)
                demand = max(0, int(round(demand * noise)))
                
                records.append({
                    "date": current.date().isoformat(),
                    "service_id": service_id,
                    "zone": zone,
                    "jobs": demand,
                })

    return pd.DataFrame(records)


def main() -> None:
    df = generate_synthetic()
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(DATA_PATH, index=False)
    print(f"Wrote {len(df)} rows to {DATA_PATH}")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"Zones: {df['zone'].unique().tolist()}")
    print(f"Services: {df['service_id'].nunique()}")
    print(f"Average jobs per record: {df['jobs'].mean():.2f}")
    print(f"Total jobs: {df['jobs'].sum():,}")


if __name__ == "__main__":
    main()
