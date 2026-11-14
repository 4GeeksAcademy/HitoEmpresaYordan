FROM python:3.12-slim

WORKDIR /app

# Instalar el paquete compartido del monorepo (nexova-shared)
COPY packages/shared /app/packages/shared
RUN pip install --no-cache-dir /app/packages/shared

# Copiar e instalar dependencias de la API
COPY services/api/requirements.txt /app/services/api/
RUN pip install --no-cache-dir -r /app/services/api/requirements.txt

# Copiar el código de la API y el módulo compartido del monorepo
COPY services/api /app/services/api
COPY shared /app/shared

WORKDIR /app/services/api

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]