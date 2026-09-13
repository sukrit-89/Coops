"""
Generate synthetic booking history for cold-start ML training.

Reads cooperative-provided estimates when available,
otherwise falls back to fully synthetic data.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "bookings_history.csv"


def generate_synthetic(days: int = 90, zones: list[str] | None = None) -> pd.DataFrame:
 if zones is None:
 zones = ["central", "north", "south", "east", "west"]

 np.random.seed(42)
 service_ids = [f"svc_{i:03d}" for i in range(1, 9)]
 records = []
 base = pd.Timestamp.utcnow().tz_localize(None) - pd.Timedelta(days=days)

 for day_idx in range(days):
 current = base + pd.Timedelta(days=day_idx)
 weekday = current.weekday()
 month = current.month

 for zone in zones:
 for service_id in service_ids:
 base_jobs = np.random.poisson(lam=8)
 if weekday >= 5:
 base_jobs += np.random.poisson(lam=3)
 if month in [4, 5, 6, 7, 8, 9]:
 base_jobs += np.random.poisson(lam=2)

 records.append(
 {
 "date": current.date().isoformat(),
 "service_id": service_id,
 "zone": zone,
 "jobs": max(0, base_jobs),
 }
 )

 return pd.DataFrame(records)


def main() -> None:
 df = generate_synthetic()
 DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
 df.to_csv(DATA_PATH, index=False)
 print(f"Wrote {len(df)} rows to {DATA_PATH}")


if __name__ == "__main__":
 main()
