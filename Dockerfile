FROM python:3.11.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p data/raw data/processed data/features/ratan_tensors \
             data/features/attention_weights data/predictions data/results \
             models docs/diagrams

EXPOSE 5001 8501

CMD ["python", "src/server.py"]
