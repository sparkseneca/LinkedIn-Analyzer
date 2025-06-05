# LinkedIn Network Evaluation Tool

This repository contains a simple Python application for analyzing your exported LinkedIn connections. Upload the `Connections.csv` file generated from LinkedIn to get insights about companies, job titles, and seniority levels within your network.

## Features

- **KPI tiles** – total connections, recent adds, email coverage and monthly cadence.
- **Connections heatmap** – year/month grid showing networking streaks.
- **Company vs Position matrix** – where you hold relationships across seniority levels.
- **Seniority breakdown** – executives, directors, managers, ICs.
- **Connection anniversaries** – people you connected with on this day in previous years.
- **Latest connections list** – quick follow-up view.
- **Longest streak** – maximum days with a new connection.

The app is implemented with [Streamlit](https://streamlit.io/) for a lightweight web interface.

## Prerequisites

- Python 3.8 or higher

## Installation

1. Clone this repository.
2. (Optional) create and activate a virtual environment.
3. Install dependencies:

```bash
pip install -r requirements.txt
```

## Running the App

From the repository root you can either launch the interactive Streamlit UI or
run a simple command-line analysis.

### Streamlit Web App

```bash
streamlit run streamlit_app.py
```

A browser window will open where you can upload your `Connections.csv` file.
LinkedIn usually includes three informational lines at the top of this export –
the application automatically skips these rows.

### Command Line Usage

```bash
python -m linkedin_network_evaluator.cli /path/to/Connections.csv
```

This prints summary tables directly in the terminal.

## CSV Format

The tool expects the following columns after skipping the initial rows:

- `First Name`
- `Last Name`
- `Company`
- `Position`
- `Connected On` (various common date formats are supported)

Missing company or position values are treated as `Unknown`.

## Future Improvements

- Additional visualisations
- Customisable seniority mapping
- Export of processed data
