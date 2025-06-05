"""Streamlit application for LinkedIn Network Evaluation."""

import streamlit as st
import pandas as pd
import plotly.express as px

from .data_loader import load_connections
from .analysis import (
    company_frequency,
    position_frequency,
    add_seniority_column,
    seniority_distribution,
    kpi_metrics,
    connections_heatmap,
    company_position_matrix,
    connection_anniversary,
    latest_connections,
    longest_connection_streak,
)


def main() -> None:
    """Run the Streamlit web application."""
    st.set_page_config(page_title="LinkedIn Network Evaluation", layout="wide")
    st.title("LinkedIn Network Evaluation Tool")

    uploaded_file = st.file_uploader("Upload your LinkedIn Connections.csv", type="csv")

    if uploaded_file is not None:
        try:
            df = load_connections(uploaded_file)
        except Exception as exc:
            st.error(f"Failed to load file: {exc}")
        else:
            df = add_seniority_column(df)
            metrics = kpi_metrics(df)
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("Total Connections", int(metrics["total"]))
            col2.metric("Added Last 30 Days", int(metrics["added_30"]))
            col3.metric("% with Email", f"{metrics['with_email']:.0f}%")
            col4.metric("Median Connections/Month", f"{metrics['median_per_month']:.1f}")

            left, right = st.columns(2)

            with left:
                st.subheader("Connections by Year-Month")
                heatmap = connections_heatmap(df)
                if not heatmap.empty:
                    st.plotly_chart(px.imshow(heatmap, text_auto=True), use_container_width=True)

                st.subheader("Company vs Position")
                matrix = company_position_matrix(df)
                if not matrix.empty:
                    st.plotly_chart(px.imshow(matrix, text_auto=True), use_container_width=True)

                st.subheader("Connection Anniversary")
                anniv = connection_anniversary(df)
                if not anniv.empty:
                    st.dataframe(anniv)

                st.subheader("Latest 25 Connections")
                st.dataframe(latest_connections(df))

                st.subheader("Longest Connection Streak")
                st.write(f"{longest_connection_streak(df)} days")

            with right:
                st.subheader("Top Companies")
                comp_freq = company_frequency(df)
                st.dataframe(comp_freq.head(20).reset_index().rename(columns={"index": "Company", "Company": "Count"}))

                st.subheader("Position Title Frequency")
                pos_freq = position_frequency(df)
                st.dataframe(pos_freq.reset_index().rename(columns={"index": "Position", "Position": "Count"}))

                st.subheader("Seniority Distribution")
                seniority_dist = seniority_distribution(df)
                st.plotly_chart(px.bar(seniority_dist), use_container_width=True)

            st.download_button(
                "Email me this PDF",
                data="PDF export is not implemented in this demo.",
                file_name="report.txt",
            )
    else:
        st.info("Please upload your Connections.csv file to begin analysis.")


if __name__ == "__main__":
    main()
