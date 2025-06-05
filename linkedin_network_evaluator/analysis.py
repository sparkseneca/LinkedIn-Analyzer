import pandas as pd
from collections import Counter
from typing import List


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
