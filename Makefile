PYTHON := .venv/bin/python
NB     := .venv/bin/jupyter nbconvert --to notebook --execute
NB_OPT := --ExecutePreprocessor.timeout=600

.PHONY: data train hybrid report dashboard server clean

data:
	$(PYTHON) src/data_fetcher.py

train:
	$(PYTHON) src/train_ratan_ce.py
	$(PYTHON) src/retrain_weak_tickers.py

hybrid:
	$(NB) $(NB_OPT) notebooks/16_ratan_retraining.ipynb   --output 16_ratan_retraining.ipynb   --output-dir notebooks/
	$(NB) $(NB_OPT) notebooks/17_lgbm_augmented.ipynb     --output 17_lgbm_augmented.ipynb     --output-dir notebooks/
	$(NB) $(NB_OPT) notebooks/18_hybrid_ablation.ipynb    --output 18_hybrid_ablation.ipynb    --output-dir notebooks/

report:
	$(NB) $(NB_OPT) notebooks/19_publication_artifacts.ipynb --output 19_publication_artifacts.ipynb --output-dir notebooks/

dashboard:
	.venv/bin/streamlit run src/dashboard.py

server:
	$(PYTHON) src/server.py

clean:
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
