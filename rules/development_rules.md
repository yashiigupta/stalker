# Development Rules for Hybrid Temporal Forecaster

## Notebook-First Development

All development work must be done in Jupyter Notebooks. Every notebook must follow the "novel format" -- the code should read like a narrative, with each code cell accompanied by a corresponding markdown cell above it that explains the reasoning, the mathematical intuition, or the interpretation of results in plain, descriptive prose. The reader should be able to understand the entire workflow by reading only the markdown cells.

## Reproducibility

Every notebook and script must set a global random seed at the very top of execution. All libraries that use randomness (NumPy, Pandas sampling, scikit-learn, LightGBM, etc.) must be seeded explicitly. The default seed for this project is `25`. Any deviation from this seed must be documented and justified in the accompanying markdown cell.

```python
import numpy as np
import random

SEED = 25
np.random.seed(SEED)
random.seed(SEED)
```

## Code Style

- No emojis anywhere in the codebase: not in comments, not in markdown cells, not in commit messages, not in documentation.
- All variable and function names must be descriptive and use `snake_case`.
- Every function must have a docstring explaining its purpose, parameters, and return values.
- Magic numbers are forbidden. All thresholds, hyperparameters, and constants must be defined as named variables at the top of the notebook or in a configuration file.

## Notebook Structure

Each notebook must follow this structure:

1. **Title and Description** (markdown) -- A clear title and a 2-3 sentence summary of what this notebook accomplishes.
2. **Imports and Configuration** (code) -- All imports, seed setting, and configuration in a single cell.
3. **Data Loading** (code + markdown) -- Load data with an explanation of the source and any assumptions.
4. **Body** (alternating markdown and code cells) -- The core analysis or modeling work, written in novel format.
5. **Summary and Conclusions** (markdown) -- Key findings, next steps, and any open questions.

## Data Management

- Raw data must never be modified in place. All transformations produce new files or DataFrames.
- Raw data is stored in `data/raw/`.
- Processed/cleaned data is stored in `data/processed/`.
- Feature-engineered data is stored in `data/features/`.
- All data files must be excluded from version control via `.gitignore`.

## Documentation

- All notebooks must be self-documenting through the novel format described above.
- The `docs/` folder contains research documents, architecture notes, and formal write-ups.
- The `rules/` folder contains this file and any additional project conventions.
