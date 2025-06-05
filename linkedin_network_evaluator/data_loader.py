import pandas as pd
from typing import Optional


def load_connections(csv_path: str, skiprows: int = 3) -> pd.DataFrame:
    """Load LinkedIn connections from a CSV file.

    Parameters
    ----------
    csv_path: str
        Path to the LinkedIn Connections.csv file.
    skiprows: int, optional
        Number of initial rows to skip (LinkedIn exports often include
        a few informational lines before the header). Defaults to 3.

    Returns
    -------
    pd.DataFrame
        Preprocessed dataframe with datetime parsing and cleaned columns.
    """
    try:
        df = pd.read_csv(csv_path, skiprows=skiprows)
    except FileNotFoundError as exc:
        raise FileNotFoundError(f"File not found: {csv_path}") from exc
    except Exception as exc:
        raise RuntimeError(f"Failed to read {csv_path}: {exc}") from exc

    # Normalize column names by stripping whitespace
    df.columns = [c.strip() for c in df.columns]

    expected_columns = ["First Name", "Last Name", "Company", "Position", "Connected On"]
    missing = [c for c in expected_columns if c not in df.columns]
    if missing:
        raise ValueError(f"Missing expected columns: {', '.join(missing)}")

    # Handle missing values
    df["Company"] = df["Company"].fillna("Unknown")
    df["Position"] = df["Position"].fillna("Unknown")

    # Parse dates
    df["Connected On"] = pd.to_datetime(df["Connected On"], errors="coerce", infer_datetime_format=True)
    return df
