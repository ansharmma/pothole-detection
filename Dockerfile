FROM python:3.11-slim

# --------------------------------------------------
# System dependencies
# --------------------------------------------------

RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# --------------------------------------------------
# Application
# --------------------------------------------------

WORKDIR /app

# Limit CPU thread usage for Render Free
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV NUMEXPR_NUM_THREADS=1

# --------------------------------------------------
# Python dependencies
# --------------------------------------------------

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip

# Install CPU-only PyTorch.
# Render Free has no NVIDIA GPU, so CUDA packages are unnecessary.
RUN pip install --no-cache-dir \
    torch torchvision \
    --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir -r requirements.txt

# --------------------------------------------------
# Copy application
# --------------------------------------------------

COPY . .

# Render normally provides PORT=10000
EXPOSE 10000

# One worker / one thread keeps memory usage lower.
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-10000} --workers 1 --threads 1 --timeout 180 app:app"]