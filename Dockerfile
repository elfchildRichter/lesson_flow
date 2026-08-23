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
    python3-dev \
    && rm -rf /var/lib/apt-lists/*

# Copy editable sibling dependency and requirements file
# Note: Expected build context is parent directory (..) or managed via docker-compose.yml
COPY fastapi-auth-core /fastapi-auth-core
COPY lesson_flow/requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY lesson_flow /app

# Ensure data and output directories exist
RUN mkdir -p /app/data /app/output

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
