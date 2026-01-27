# /backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy requirements first to leverage cache
# Note: requirements.txt is at the root of the build context
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the build context (which corresponds to local 'backend' folder) into /app/backend
COPY . backend/

# Expose the API port
EXPOSE 8000

# Command to run the application
# Adjusting pythonpath to include /app, so 'backend' package is found in /app/backend
ENV PYTHONPATH=/app

CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
