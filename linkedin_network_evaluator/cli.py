import argparse

from .data_loader import load_connections
from .analysis import (
    add_seniority_column,
    company_frequency,
    position_frequency,
    seniority_distribution,
)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Analyze your LinkedIn Connections.csv file"
    )
    parser.add_argument("csv", help="Path to Connections.csv")
    args = parser.parse_args()

    df = load_connections(args.csv)
    df = add_seniority_column(df)

    print(f"Total connections: {len(df)}\n")

    print("Top Companies:\n")
    print(company_frequency(df).head(20).to_string())

    print("\nPosition Frequency:\n")
    print(position_frequency(df).head(20).to_string())

    print("\nSeniority Distribution:\n")
    print(seniority_distribution(df).to_string())


if __name__ == "__main__":
    main()
