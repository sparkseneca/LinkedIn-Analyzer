# LinkedIn Network Evaluation Tool

This repository contains a simple Python application for analyzing your exported LinkedIn connections. Upload the `Connections.csv` file generated from LinkedIn to get insights about companies, job titles, and seniority levels within your network.

## Features

- **Overall summary** – total number of connections.
- **Company analysis** – see which organisations dominate your network.
- **Position titles** – frequency table of job titles.
- **Seniority classification** – positions grouped into seniority levels (entry level, manager, executive, etc.).
- **Connection trends** – optional chart showing how many connections you made over time.

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

From the repository root run:

```bash
streamlit run linkedin_network_evaluator/app.py
```

A browser window will open where you can upload your `Connections.csv` file. LinkedIn usually includes three informational lines at the top of this export – the application automatically skips these rows.

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
