FROM python:3.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PORT=5000

CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5000"]