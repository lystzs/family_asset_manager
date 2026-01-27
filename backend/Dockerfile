# /backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 8000

# Command to run the application
# Assumes the app is launched from /app/backend/app/main.py or similar structure
# Adjusting pythonpath to include current directory
ENV PYTHONPATH=/app

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
