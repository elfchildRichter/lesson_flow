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

# Copy requirements file
COPY requirements.txt /app/requirements.txt

# 接受 Railway 或 Docker Build 傳入的 GITHUB_TOKEN (Personal Access Token)
ARG GITHUB_TOKEN

# 優先使用 GITHUB_TOKEN 私下安裝私有庫 fastapi-auth-core，再安裝其餘套件
RUN pip install --no-cache-dir --upgrade pip && \
    if [ -n "$GITHUB_TOKEN" ]; then \
        pip install --no-cache-dir "git+https://${GITHUB_TOKEN}@github.com/elfchildRichter/fastapi-auth-core.git" ; \
    fi && \
    pip install --no-cache-dir -r requirements.txt


# Copy application source code
COPY . /app

# Ensure data and output directories exist
RUN mkdir -p /app/data /app/output

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

