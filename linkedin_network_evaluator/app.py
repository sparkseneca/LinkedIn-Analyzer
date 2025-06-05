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
)

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
        st.subheader("Overall Summary")
        st.write(f"Total connections: **{len(df)}**")

        # Company frequencies
        st.subheader("Top Companies")
        comp_freq = company_frequency(df)
        top_comp = comp_freq.head(20)
        fig_comp = px.bar(top_comp[::-1], orientation="h", labels={'value': 'Connections', 'index': 'Company'})
        st.plotly_chart(fig_comp, use_container_width=True)

        st.subheader("Position Title Frequency")
        pos_freq = position_frequency(df)
        st.dataframe(pos_freq.reset_index().rename(columns={'index': 'Position', 'Position': 'Count'}))

        st.subheader("Seniority Distribution")
        seniority_dist = seniority_distribution(df)
        fig_sen = px.bar(seniority_dist[::-1], orientation="h", labels={'value': 'Connections', 'index': 'Seniority'})
        st.plotly_chart(fig_sen, use_container_width=True)

        st.subheader("Connection Trends Over Time")
        if df["Connected On"].notna().any():
            trend = df.dropna(subset=["Connected On"]).copy()
            trend['Month'] = trend['Connected On'].dt.to_period('M').dt.to_timestamp()
            by_month = trend.groupby('Month').size()
            fig_time = px.bar(by_month, labels={'value': 'Connections', 'index': 'Month'})
            st.plotly_chart(fig_time, use_container_width=True)
        else:
            st.info("No valid connection dates available to display trends.")
else:
    st.info("Please upload your Connections.csv file to begin analysis.")
