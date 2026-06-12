# =============================================================================
# EduPhysics Academy — Root Dockerfile (Multi-Stage Build)
# =============================================================================
# This Dockerfile builds the backend (Flask/Gunicorn) image from the project
# root, demonstrating a proper multi-stage build to separate dependency
# installation from the final production image.
#
# For full-stack deployment with all services, use docker-compose.yml instead.
#
# Build:   docker build -t eduphysics-backend .
# Run:     docker run -d -p 5000:5000 -e MONGODB_URI=<uri> eduphysics-backend
# =============================================================================

# ---- Stage 1: Dependencies ----
# Install Python dependencies in a separate stage so the final image
# does not contain pip caches or build artifacts.
FROM python:3.11-slim AS dependencies

WORKDIR /app

# Prevent Python from writing .pyc files and ensure logs appear immediately
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Copy only requirements first to maximise Docker layer caching.
# If requirements.txt hasn't changed, this entire stage is cached.
COPY src/backend/requirements.txt .

# Upgrade pip and install dependencies without caching to keep image small
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ---- Stage 2: Production ----
# Start from a clean slim image — only the runtime and installed packages
# are carried over, leaving behind pip caches and build tools.
FROM python:3.11-slim AS production

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Copy installed Python packages from the dependencies stage
COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# Copy only the application source code
COPY src/backend/app.py .

# Create a non-root system user and group called "appuser".
# Running as non-root follows the principle of least privilege:
# if the container is compromised, the attacker has limited OS-level access.
RUN addgroup --system appuser && adduser --system --ingroup appuser appuser

# Transfer ownership of /app to appuser
RUN chown -R appuser:appuser /app

# Switch to non-root user for all subsequent commands and runtime
USER appuser

# Document the port the container listens on
EXPOSE 5000

# Health check: Docker periodically calls GET /api/health
#   --interval=30s    – check every 30 seconds
#   --timeout=10s     – wait up to 10 seconds for a response
#   --start-period=15s – grace period before first check
#   --retries=3       – mark unhealthy after 3 consecutive failures
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/api/health')" || exit 1

# Production command: run Flask with Gunicorn WSGI server
#   --bind 0.0.0.0:5000  – listen on all interfaces
#   --workers 2          – 2 worker processes (suitable for low-traffic)
#   --timeout 120        – allow 120s for slow MongoDB cold-starts
#   --access-logfile -   – send access logs to stdout for Docker log capture
#   app:app              – "app" module, "app" Flask instance
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "--access-logfile", "-", "app:app"]
