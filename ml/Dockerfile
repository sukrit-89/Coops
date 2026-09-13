FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy model and application
COPY app.py .
COPY models/ ./models/

# Expose HuggingFace Space port
EXPOSE 7860

# Run the API
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
