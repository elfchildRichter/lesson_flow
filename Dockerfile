# Use official lightweight Python image
FROM python:3.11-slim

# Prevent Python from writing bytecode files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    git \
    python3-dev \
    && rm -rf /var/lib/apt-lists/*

# Copy requirements file and vendor dependencies
COPY requirements.txt /app/requirements.txt
COPY vendor/fastapi-auth-core /app/vendor/fastapi-auth-core

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . /app

# Ensure data and output directories exist
RUN mkdir -p /app/data /app/output

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

