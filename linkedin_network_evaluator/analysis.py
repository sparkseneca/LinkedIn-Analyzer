import pandas as pd
from collections import Counter
from typing import List, Dict


SENIORITY_LEVELS = {
    "Entry-Level / Intern": ["intern", "trainee", "apprentice"],
    "Junior / Associate": ["junior", "jr", "associate", "analyst"],
    "Mid-Level / Specialist": ["specialist", "engineer", "developer", "consultant"],
    "Senior / Lead / Principal": ["senior", "sr", "lead", "staff", "principal"],
    "Manager": ["manager", "mgr"],
    "Senior Manager": ["senior manager", "sr. manager"],
    "Director": ["director", "dir."],
    "Senior Director": ["senior director", "sr. director"],
    "VP / SVP / EVP": ["vp", "vice president", "svp", "evp", "executive vice president"],
    "Executive": ["chief", "ceo", "cto", "cfo", "coo", "cio", "president", "founder", "partner"],
}

# Simple seniority buckets used for quick charts
SIMPLE_BUCKETS = [
    ("Executive", ["chief", "ceo", "coo", "cfo", "president"]),
    ("VP", ["vp", "vice president"]),
    ("Director", ["director"]),
    ("Manager", ["manager"]),
    ("Individual / Other", []),
]


def bucket_position(title: str) -> str:
    """Return a simplified seniority bucket for the given title."""
    if not isinstance(title, str):
        return "Individual / Other"

    t = title.lower()
    for label, keywords in SIMPLE_BUCKETS:
        for kw in keywords:
            if kw in t:
                return label
    return "Individual / Other"


def classify_seniority(title: str) -> str:
    """Return the seniority level for a given job title."""
    if not isinstance(title, str):
        return "Other / Uncategorized"

    t = title.lower()
    for level, keywords in SENIORITY_LEVELS.items():
        for kw in keywords:
            if kw in t:
                # Special cases to avoid false positives
                if kw == "manager" and "product manager" in t and level == "Manager":
                    # treat product manager as mid-level unless otherwise specified
                    continue
                return level
    return "Other / Uncategorized"


def company_frequency(df: pd.DataFrame) -> pd.Series:
    return df["Company"].value_counts()


def position_frequency(df: pd.DataFrame) -> pd.Series:
    return df["Position"].value_counts()


def add_seniority_column(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["Seniority"] = df["Position"].apply(classify_seniority)
    return df


def seniority_distribution(df: pd.DataFrame) -> pd.Series:
    if "Seniority" not in df.columns:
        df = add_seniority_column(df)
    return df["Seniority"].value_counts()


def kpi_metrics(df: pd.DataFrame) -> Dict[str, float]:
    """Return key metrics for dashboard display."""
    metrics = {
        "total": len(df),
        "added_30": 0,
        "with_email": 0.0,
        "median_per_month": 0.0,
    }

    if "Connected On" in df.columns:
        recent = df[df["Connected On"] >= (pd.Timestamp.today() - pd.Timedelta(days=30))]
        metrics["added_30"] = len(recent)

        by_month = df.dropna(subset=["Connected On"]).copy()
        if not by_month.empty:
            by_month = by_month.groupby(by_month["Connected On"].dt.to_period("M")).size()
            metrics["median_per_month"] = float(by_month.median())

    if "Email Address" in df.columns:
        non_empty = df["Email Address"].astype(str).str.strip().ne("")
        metrics["with_email"] = float(non_empty.mean() * 100)

    return metrics


def connections_heatmap(df: pd.DataFrame) -> pd.DataFrame:
    """Return a pivot table of connections per year and month."""
    if df["Connected On"].isna().all():
        return pd.DataFrame()
    d = df.dropna(subset=["Connected On"]).copy()
    d["Year"] = d["Connected On"].dt.year
    d["Month"] = d["Connected On"].dt.month
    return d.pivot_table(index="Year", columns="Month", values="First Name", aggfunc="count", fill_value=0).sort_index()


def company_position_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """Return a heatmap matrix of company by position category."""
    if "Position_category" not in df.columns:
        df = df.assign(Position_category=df["Position"].fillna("").apply(bucket_position))
    return pd.crosstab(df["Company"], df["Position_category"])


def connection_anniversary(df: pd.DataFrame) -> pd.DataFrame:
    """Return connections made on this day in past years."""
    today = pd.Timestamp.today()
    mask = (df["Connected On"].dt.month == today.month) & (df["Connected On"].dt.day == today.day)
    return df.loc[mask, ["First Name", "Last Name", "Company", "Connected On"]].sort_values("Connected On")


def latest_connections(df: pd.DataFrame, n: int = 25) -> pd.DataFrame:
    """Return the latest N connections."""
    return df.sort_values("Connected On", ascending=False).head(n)


def longest_connection_streak(df: pd.DataFrame) -> int:
    """Return the longest streak of consecutive days with at least one connection."""
    if df["Connected On"].isna().all():
        return 0
    dates = sorted(df.dropna(subset=["Connected On"])["Connected On"].dt.date.unique())
    if not dates:
        return 0
    streak = longest = 1
    for i in range(1, len(dates)):
        if (dates[i] - dates[i - 1]).days == 1:
            streak += 1
        else:
            longest = max(longest, streak)
            streak = 1
    longest = max(longest, streak)
    return longest
