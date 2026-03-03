# RL Pipeline & Methodology Documentation

## 1. The Fitted Q-Iteration (FQI) Framework
We treat financial forecasting as a **Markov Decision Process (MDP)** where the objective is to maximize the Sharpe Ratio.

### 1.1 State Space ($S$)
- Fractionally Differentiated Prices (Memory Preservation).
- Rolling Volatility (Context).
- Temporal Features (Seasonality).

### 1.2 Action Space ($A$)
- `Buy (Long)`: +1 unit of exposure.
- `Sell (Short)`: -1 unit of exposure.
- `Hold (Neutral)`: 0 exposure.

### 1.3 Reward Function ($R$)
Using the **Triple Barrier Method**:
- +1 if the upper barrier is hit first.
- -1 if the lower barrier is hit first.
- 0 if the time barrier is hit.

## 2. Non-Neural Implementation
- **Regressor**: `XGBoost` or `LightGBM`.
- **Reasoning**: Superior to Deep Learning for structured tabular data with low signal-to-noise ratios.
- **Robustness**: **Huber Loss** ($\delta=1.35$) to ensure outliers don't bias the Q-value estimation.

## 3. Meta-Labeling (Corrective AI)
The M2 model is a binary classifier that predicts $P(\text{M1 signal is profitable})$. This allows for dynamic position sizing:
$$\text{Size} = \text{M1\_Signal} \times P(\text{M2 Success})$$

## 4. Methodology for Residual Diagnostics
Every training cycle performs:
- **Ljung-Box**: Testing for remaining autocorrelation (failed models have predictable residuals).
- **Engle's ARCH Test**: Testing for volatility clustering not captured by the agent.
