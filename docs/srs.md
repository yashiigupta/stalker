# Software Requirements Specification (SRS) - Hybrid Temporal Forecaster

## 1. Introduction
The Hybrid Temporal Forecaster is a high-performance quantitative trading system designed to predict short-horizon asset movements across 5-8 correlated stocks using a combination of non-neural reinforcement learning and advanced statistical feature engineering.

## 2. Overall Description
The system provides multi-scale forecasts (Daily and Hourly) and integrates a secondary "Meta-Labeling" layer for risk management.

## 3. Functional Requirements
- **FR1: Data Ingestion**: Daily (20y) and Hourly (2y) data for core universe.
- **FR2: Memory Preservation**: Implementation of Fractional Differentiation for stationarity.
- **FR3: Multi-Horizon Forecasting**: Simultaneous 1-hour and 1-day ahead predictions.
- **FR4: Reinforcement Learning**: Fitted Q-Iteration with GBT as the Q-engine.
- **FR5: Meta-Labeling**: Binary classification to filter primary directional signals.
- **FR6: Error Profiling**: Identification of "mistakes" using GARCH diagnostics.

## 4. Non-Functional Requirements
- **NFR1: Reproducibility**: Absolute consistency via seed `25`.
- **NFR2: Robustness**: Handling of outliers via Huber Loss.
- **NFR3: Modular Commit History**: Git tracking follows logical increments.

## 5. System Features
- **Live Prediction Dashboard**: Web-based visualization.
- **Backtesting Suite**: Purged K-Fold validation.
