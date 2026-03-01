# =============================================================================
# EduPhysics Academy - Backend Dockerfile
# =============================================================================
# Uses a multi-stage-friendly slim Python image to keep the final image small.
# The application is run as a non-root user for security (principle of least privilege).
# Gunicorn is used as the production WSGI server instead of Flask's dev server.
# =============================================================================

# ---- Stage: Base ----
# python:3.11-slim is a minimal Debian-based image containing only the
# Python runtime. It is significantly smaller than the full python:3.11 image
# while still providing a well-maintained OS layer with security patches.
FROM python:3.11-slim AS base

# Set the working directory inside the container.
# All subsequent COPY/RUN commands will be relative to this path.
WORKDIR /app

# Set Python environment variables:
#   PYTHONDONTWRITEBYTECODE=1  – prevents Python from writing .pyc files to disk
#   PYTHONUNBUFFERED=1         – forces stdout/stderr to be unbuffered so logs
#                                appear immediately in Docker's log stream
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# ---- Stage: Dependencies ----
# Copy only the requirements file first so Docker can cache this layer.
# If requirements.txt hasn't changed, Docker reuses the cached layer and
# skips reinstalling packages — significantly speeding up subsequent builds.
COPY requirements.txt .

# Upgrade pip to the latest version, then install dependencies.
#   --no-cache-dir   – avoids storing package caches, keeping image size down
#   --upgrade pip    – ensures we use the most recent pip version
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ---- Stage: Application ----
# Copy the application source code into the container.
# This is done AFTER installing dependencies so that code changes do not
# invalidate the (expensive) dependency installation cache layer.
COPY app.py .

# Create a non-root system user and group called "appuser".
# Running as a non-root user follows the principle of least privilege:
# if the container is compromised, the attacker has limited OS-level access.
RUN addgroup --system appuser && adduser --system --ingroup appuser appuser

# Transfer ownership of the /app directory to appuser so the application
# process can read its own files without requiring root permissions.
RUN chown -R appuser:appuser /app

# Switch to the non-root user for all subsequent commands and the container runtime.
USER appuser

# Expose port 5000 so Docker knows which port the container listens on.
# This is documentation only — the actual port mapping is done in docker-compose.yml.
EXPOSE 5000

# Health check: Docker will periodically call GET /api/health.
#   --interval=30s   – check every 30 seconds
#   --timeout=10s    – wait up to 10 seconds for a response
#   --start-period=15s – give the app 15 seconds to start before failing
#   --retries=3      – mark unhealthy only after 3 consecutive failures
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/api/health')" || exit 1

# Production command: run the Flask app with Gunicorn WSGI server.
#   --bind 0.0.0.0:5000  – listen on all interfaces inside the container
#   --workers 2          – 2 worker processes (good for low-traffic containers)
#   --timeout 120        – allow 120s for slow MongoDB cold-starts
#   --access-logfile -   – send access logs to stdout for Docker to capture
#   app:app              – "app" module, "app" Flask instance
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "--access-logfile", "-", "app:app"]
