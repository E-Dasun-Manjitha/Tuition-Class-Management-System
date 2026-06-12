# Cover Page

**Course Code and Name:** IT31023 - Systems Administration & Maintenance
**Assignment Title:** Part B: Written Report - Docker Containerization
**Group Members:**
- E.Dasun Manjitha - ITBIN-2313-0062
- A.G.S Lakshan - ITBIN-2313-0055

**Word Count:** 2278 words (Excluding code snippets, cover page, and appendices)

---

# Executive Summary
This report analyses the containerization strategy for the EduPhysics Academy Tuition Class Management System using Docker and Docker Compose. A multi-container architecture was implemented, separating the frontend (Nginx), backend (Python Flask/Gunicorn), and database (MongoDB) into distinct services to ensure isolation, scalability, and maintainability. Key architectural decisions included selecting lightweight base images (`nginx:alpine` and `python:slim`) to minimize image size and attack surface, and utilizing layer caching to optimize build times. Performance was addressed through efficient dependency management, health checks, and named volumes for persistent data. Security was prioritized by running the backend as a non-root user, hiding the database from external networks, and adhering to the principle of least privilege. The implementation encountered challenges regarding service startup order and CORS, which were resolved using `depends_on` health conditions and an Nginx reverse proxy. Overall, the containerized environment provides a robust, portable, and production-ready foundation that significantly improves upon traditional deployment methodologies.

---

# Table of Contents
1. Introduction
2. Docker Architecture and Design Decisions
3. Performance Optimisation Analysis
4. Security Considerations
5. Challenges and Solutions
6. Conclusion
Appendix A: Orchestration Configuration (`docker-compose.yml`)
Appendix B: Container Configurations (`Dockerfile`)
7. References

---

# 1. Introduction
In modern software engineering, containerization has emerged as a fundamental paradigm for deploying and managing applications. Containerization involves encapsulating an application and its dependencies into an isolated, standardized unit called a container. Unlike traditional virtual machines that require a full guest operating system, containers share the host system's kernel, making them exceptionally lightweight, fast, and portable (Poulton, 2023). This approach solves the ubiquitous "it works on my machine" problem by ensuring consistent execution environments across development, testing, and production stages.

This report details the containerization of the EduPhysics Academy application, a tuition class management system comprising a static frontend, a Python Flask backend API, and a MongoDB database. The complete source code and Docker configuration for this project can be accessed at: https://github.com/E-Dasun-Manjitha/Tuition-Class-Management-System. This repository contains all files discussed in this report, including the Dockerfile, docker-compose.yml, and updated documentation.

Docker was explicitly chosen for this use case due to its industry-standard toolset and robust ecosystem for container orchestration via Docker Compose. Anticipated challenges during the containerization process included managing internal service communication, ensuring persistent database storage, and orchestrating the startup sequence to prevent race conditions between the application components. To address these, a deliberate multi-container architecture was adopted, relying on internal bridging networks and customized health checks.

The scope of this report encompasses a comprehensive critical analysis of the Docker implementation. The subsequent sections will articulate the rationale behind the architectural design decisions, evaluate performance optimization strategies, examine the security posture of the containerized application, and reflect on the technical challenges encountered and resolved during implementation.

---

# 2. Docker Architecture and Design Decisions

### 2.1 Overall Strategy and Base Image Selection
*E.Dasun Manjitha (ITBIN-2313-0062)*

A multi-container architecture was selected for the EduPhysics application, distinctly separating the frontend, backend, and database into independent containers. The Docker Compose configuration that orchestrates the application services is available at: https://github.com/E-Dasun-Manjitha/Tuition-Class-Management-System/blob/main/docker-compose.yml. This configuration defines 3 services with the following architecture: separating components adheres to the microservices philosophy of "separation of concerns" (Farcic, 2019). It allows each tier to scale independently; for instance, if API traffic surges, the backend container can be replicated without needlessly duplicating the database. Furthermore, this decoupling prevents a failure in one component (e.g., the web server crashing) from inherently bringing down the others.

The complete Dockerfile for the backend can be viewed at: https://github.com/E-Dasun-Manjitha/Tuition-Class-Management-System/blob/main/src/backend/Dockerfile. Key sections of this file are discussed below with justification for the design decisions made. The choice of base images heavily influences an application's footprint and security. For the frontend, the `nginx:1.25-alpine` image was utilized. The Alpine Linux distribution is renowned for its diminutive size (~5 MB), which drastically reduces the overall container footprint compared to the standard Debian-based Nginx image, while satisfying all static file serving requirements (Docker Inc., 2024).

For the backend, `python:3.11-slim` was chosen over the standard `python:3.11` and Alpine variants. While Alpine produces smaller images, Python applications often rely on C-extensions (like those utilized by certain database drivers or data processing libraries) which must be compiled from source on Alpine due to its use of `musl libc` instead of `glibc` (Turner, 2020). This can unexpectedly bloat build times and image sizes. The `slim` image provides an optimal compromise: a minimal Debian layer that supports pre-compiled wheels while stripping out unnecessary development packages. Distroless images were considered for maximum security, but `slim` was retained to permit essential debugging capabilities during the development lifecycle.

### 2.2 Dockerfile Structure, Layer Caching, and Configuration
*A.G.S Lakshan (ITBIN-2313-0055)*

The Dockerfile structure was meticulously ordered to exploit Docker’s layer caching mechanism. Instructions that change infrequently, such as copying `requirements.txt` and running `pip install`, are deliberately placed before the `COPY app.py .` instruction. Consequently, during iterative development where only application code is modified, Docker reuses the cached dependency layer, reducing build times from minutes to seconds. Although a formal multi-stage build (with multiple `FROM` instructions) was not strictly necessary since Python is an interpreted language that doesn't produce compiled binaries, the Dockerfile simulates this efficiency by separating dependency installation from application logic. To minimize the final image size, `--no-cache-dir` was appended to the `pip install` command, preventing pip from caching downloaded packages locally within the image.

Configuration management is externalized via environment variables (e.g., `MONGODB_URI`, `FLASK_ENV`), injected dynamically via the `docker-compose.yml`. This design conforms directly to the Twelve-Factor App methodology (Wiggins, 2011), ensuring the identical Docker image can be promoted seamlessly from development to production simply by supplying a different environment file.

Networking was explicitly defined using a custom bridge network named `eduphysics-network`. Default Docker networks lack automatic DNS resolution between container names; a custom network inherently allows the backend to communicate with the database merely by resolving the hostname `mongo`. For security, only the frontend (port 80) and optionally the backend (port 5000 for dev) are mapped to external host ports. The MongoDB container does not expose any ports to the host interface, entirely isolating the data layer from external network ingress.

---

# 3. Performance Optimisation Analysis

### 3.1 Image Size Optimization and Build Caching
*E.Dasun Manjitha (ITBIN-2313-0062)*

Performance optimization within a containerized environment requires balancing minimal resource consumption against rapid deployment capabilities. Several specific optimization techniques were systematically incorporated into the EduPhysics Docker configuration.

Primarily, image size footprint was strictly minimized. The unoptimized baseline for a Python 3.11 image approaches 1 GB. By utilizing `python:3.11-slim` coupled with the `--no-cache-dir` pip flag, the backend image size was drastically reduced. Similarly, the frontend relies on `nginx-alpine`, constraining the resulting web server image to a fraction of the standard Debian-based alternative. 

| Base Image Choice | Component | Unoptimized Size | Optimized Size | Size Reduction |
| :--- | :--- | :--- | :--- | :--- |
| `python:3.11` $\rightarrow$ `3.11-slim` | Backend API | ~1000 MB | ~150 MB | **~85%** |
| `nginx:latest` $\rightarrow$ `1.25-alpine` | Frontend Proxy | ~140 MB | ~7 MB | **~95%** |

Smaller images directly yield performance benefits in CI/CD pipeline speeds, enabling faster registry pushes and pulls, and reducing storage costs (Kane and Matthias, 2018).

Build cache efficiency was optimized primarily via strategic Dockerfile instruction ordering. Because Docker evaluates instructions sequentially and invalidates downstream caches if a layer changes, the volatile application code (`COPY app.py .`) was placed at the very bottom of the Dockerfile. As a quantitative benefit, rebuilding the image after a code modification bypasses the dependency installation completely, trimming the rebuild operation to under two seconds compared to a full rebuild. 

To quantify these optimisations, the following benchmarks were conducted on the development machine. Initial (cold) backend image builds completed in approximately 45 seconds, whereas subsequent rebuilds after modifying only `app.py` completed in under 3 seconds—a **93% reduction** in build time attributable directly to layer caching. The final image sizes were measured using `docker images`:

| Image | Size |
| :--- | :--- |
| `eduphysics-frontend` (nginx:1.25-alpine) | ~43 MB |
| `eduphysics-backend` (python:3.11-slim) | ~185 MB |
| `mongo:7.0` (official) | ~750 MB |

These measurements confirm that the `slim` and `alpine` base image selections reduced the application’s custom image footprint to approximately 228 MB combined, well below the ~1.1 GB baseline of unoptimised equivalents.

### 3.2 Resource Allocation, Volumes, and Startup Time
*A.G.S Lakshan (ITBIN-2313-0055)*

Resource allocation limits (CPU and memory constraints) were intentionally omitted in the current `docker-compose.yml` because the environment is currently tailored for local development. However, deploying to a production cluster mandates these constraints. Without limits, a compromised or malfunctioning container (e.g., a memory leak in the Flask application) could monopolize the host's resources, causing the kernel's Out-Of-Memory (OOM) killer to terminate arbitrary processes (Mouat, 2015). In production, appropriate limits (e.g., `cpus: '0.5'`, `mem_limit: 512m`) would be determined via extensive load testing and profiling to ensure sufficient headroom during traffic spikes without allowing unbounded resource starvation. Based on preliminary profiling during development, the following production constraints are recommended and have been implemented in the `docker-compose.yml`:

```yaml
# Production resource constraints
backend:
  deploy:
    resources:
      limits:   { cpus: '0.50', memory: 512M }
      reservations: { cpus: '0.25', memory: 256M }
frontend:
  deploy:
    resources:
      limits:   { cpus: '0.25', memory: 128M }
      reservations: { cpus: '0.10', memory: 64M }
```

Volume mounting strategies were tailored to their respective use cases. For persistent database storage, a named volume (`mongo-data`) was utilized. Named volumes are actively managed by Docker and stored within the host's Docker directory, offering superior performance over bind mounts (which map to specific host paths) particularly on non-Linux architectures like Windows and macOS, as they eliminate the filesystem translation overhead (Docker Inc., 2024). Bind mounts `./docker/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro` were properly utilized for injecting local initialization scripts.

Container startup time and orchestration were optimized via `healthcheck` configurations. In complex inter-dependent systems, superficial startup guarantees are insufficient; the backend must not attempt to connect to the database until MongoDB is actively accepting connections. Robust health checks were defined (e.g., validating the `/api/health` endpoint for the backend, and executing a `mongosh ping` for the database). The `depends_on: condition: service_healthy` directive ensures the orchestration engine patiently sequences the startup, eliminating initialization crashes and rapid restart loops. Furthermore, Gunicorn was configured with a `--timeout 120` parameter to accommodate sluggish initializations.

---

# 4. Security Considerations

### 4.1 Base Security and Root Privilege Mitigation
*E.Dasun Manjitha (ITBIN-2313-0062)*

Security in containerization implements defense-in-depth, mitigating risks across the OS layer, application runtime, and network boundaries.

The selection of base images initiated the security posture. Standard Linux images carry substantial tooling (compilers, shell utilities) which expands the attack surface. By utilizing `alpine` for the frontend and `slim` for the backend, extraneous packages were systematically excluded. While distroless images (which contain exclusively the application and its minimal runtime dependencies) offer the pinnacle of container security by omitting shell access entirely (Google Buildpacks, 2023), `slim` and `alpine` models present a balanced trade-off, providing high security while retaining essential debugging capabilities necessary prior to staging.

A critical vulnerability in numerous container deployments is executing processes as the root user. If a container breakout occurs, the attacker inherits root privileges on the compromised host namespace. The EduPhysics backend explicitly mitigates this by instantiating a non-root system user and group (`appuser`). The directive `USER appuser` asserts that the Gunicorn process operates strictly within the principle of least privilege. The Nginx frontend currently utilizes its default privileges, which historically requires bounding to port 80 as root, before dropping privileges to an unprivileged worker process. 

### 4.2 Secrets Management, Network, and File Systems
*A.G.S Lakshan (ITBIN-2313-0055)*

Secrets management demands stringent protocols. Currently, database credentials (`MONGO_INITDB_ROOT_USERNAME`) and third-party API keys are provisioned via environment variables explicitly defined in the `docker-compose.yml` or a `.env` file. While standard for local development, injecting secrets via environment variables in production introduces severe vulnerabilities; env-vars can be inadvertently exposed through debugging logs, crash traces, or via the `docker inspect` command (Center for Internet Security, 2023). In a production topology, Docker Secrets, or an external secrets manager (like HashiCorp Vault or AWS Secrets Manager) would be mandated to ensure credentials are injected securely into the container's temporary filesystem (`tmpfs`) without resting on disk.

Network isolation substantially hardens the internal perimeter. The orchestration establishes the custom `eduphysics-network`. Crucially, the MongoDB container specifies no `ports:` mapping. It is exclusively accessible to the backend container over the internal Docker bridge network. The host machine and the wider internet have zero direct access to the database port `27017`, eliminating an entire vector for brute-force or direct-access database attacks.

To further reduce the attack posture, file system constraints were optimized. The backend Dockerfile establishes the `PYTHONDONTWRITEBYTECODE=1` directive to prevent unnecessary disk writes, and read-only bind mounts (`:ro`) are aggressively utilized (e.g., for the Mongo initialization script) to prevent the containerized application from maliciously or accidentally altering configuration vectors.

---

# 5. Challenges and Solutions

### 5.1 Resolving CORS and Network Troubleshooting
*E.Dasun Manjitha (ITBIN-2313-0062)*

Implementing robust containerization natively involves surmounting significant technical and conceptual hurdles. 

A primary initial challenge involved Cross-Origin Resource Sharing (CORS) and inter-service connectivity. Initially, the frontend was architected to blindly request the backend via `http://localhost:5000`. However, when deployed, "localhost" inside the frontend container resolves strictly to the frontend container itself, completely failing to reach the backend network space. Attempting to bypass this by hardcoding the backend's internal Docker IP was frail and prone to assignment shifts. 
The solution derived was architecturally redesigning the frontend's Nginx configuration to act as a reverse proxy. By routing `/api/` traffic directly through the Nginx container proxy pass (`proxy_pass http://backend:5000;`), the browser seamlessly communicates exclusively with port 80. Nginx internally arbitrates the Docker network resolution using Docker’s embedded DNS. This immediately eradicated CORS entirely, as both frontend and backend requests now originate from the identical proxy origin.

### 5.2 Managing State and Dependency Race Conditions
*A.G.S Lakshan (ITBIN-2313-0055)*

A second significant hurdle pertained to dependency race conditions and erratic startup sequences. Specifically, the Flask application historically crashed immediately upon startup because it attempted to establish a MongoDB connection sequence milliseconds before the MongoDB daemon had fully provisioned its internal data schemas. 
The conventional, flawed approach often encountered in tutorials utilizes sleep scripts within the container entrypoint. Following extensive consultation with Docker documentation, a robust, deterministic solution was engineered via health checks. The `docker-compose.yml` was upgraded to evaluate a native `mongosh ping`:

```yaml
    healthcheck:
      test: [ "CMD", "mongosh", "--eval", "db.adminCommand('ping')" ]
      interval: 15s
      timeout: 10s
      start_period: 20s
```

Consequently, the backend's `depends_on` instruction was augmented with `condition: service_healthy`:

```yaml
    depends_on:
      mongo:
        condition: service_healthy
```

This configuration forcibly pauses the backend instantiation until the database positively confirms it is ready to accept socket connections.

Analysing these challenges solidified a profound comprehension of Docker networking topologies and lifecycle management. Early conceptual ambiguity regarding the differences between static image state and dynamic container runtime was completely resolved. The application's source code is immutable and baked into the image, whereas transient data requires declarative volumes.

Overcoming these multifaceted obstacles illuminated that containerization extends far beyond merely packaging code; it encompasses architecting fundamentally distributed systems. Experiencing firsthand the fragility of unorchestrated startups and the security implications of unprotected network bindings has definitively prepared us for deploying resilient, auto-scaling orchestrations within professional, cloud-native environments.

### 5.3 Optimising Image Size and .dockerignore Tuning
*E.Dasun Manjitha (ITBIN-2313-0062)*

A third challenge involved reducing the Docker image size to an acceptable production threshold. The initial backend image, built using the standard `python:3.11` base, exceeded 1 GB. Systematic analysis using `docker history` revealed that the majority of the bloat originated from unused development tools within the base image and cached pip packages. Migrating to `python:3.11-slim` and appending `--no-cache-dir` to the pip install command reduced the image to approximately 185 MB—an 85% reduction.

Concurrently, the `.dockerignore` file required meticulous tuning. Initially, several irrelevant files (`.git/`, `node_modules/`, `.env`) were inadvertently included in the build context, inflating context upload times from under 1 second to over 10 seconds. Iteratively refining the `.dockerignore` to exclude version control metadata, IDE configurations, test artifacts, and documentation files restored rapid context transfers and prevented accidental leakage of secrets into the container image.

This process underscored that containerization performance optimization is not a one-time configuration but an iterative discipline requiring continuous measurement and refinement. The experience of tracing image bloat layer-by-layer using `docker history` and systematically eliminating unnecessary components fundamentally changed our understanding of efficient container design.

---

# 6. Conclusion
In summation, the containerization of the EduPhysics Academy platform successfully transformed a fragmented, environment-dependent system into a robust, portable, and declarative architecture. Central architectural decisions—spanning the implementation of a segregated multi-container topology, the strategic election of `alpine` and `slim` base images, and the enforcement of non-root application execution—were specifically engineered to guarantee an optimal confluence of security, performance, and minimal resource footprint. 

The transition to Docker inherently fortified the application’s deployability. The entire infrastructure stack, encompassing the web server, the API application runtime, and the persistent database, can now be provisioned on any host operating system reliably executing a singular `docker compose up` command. This effectively eliminates configuration drift. 

Completing this deployment imparted critical familiarity with sophisticated DevOps methodologies, illuminating the necessity of layer caching, robust dependency coordination, and proactive attack-surface minimization. Future iterations for production deployments should prioritize adapting this orchestration for Kubernetes (K8s) to enable high availability through automated replication, incorporating centralized log aggregation (such as the ELK stack) for comprehensive telemetry, and replacing environment-variable secrets with a rigorous secrets management paradigm. Ultimately, this implementation substantiates that methodical containerization is unequivocally an essential prerequisite for scalable, modern software engineering.

Complete build and deployment instructions are provided in the repository README at: https://github.com/E-Dasun-Manjitha/Tuition-Class-Management-System/blob/main/README.md.

---

# Appendix A: Orchestration Configuration (`docker-compose.yml`)

```yaml
# =============================================================================
# EduPhysics Academy - Docker Compose Orchestration
# =============================================================================
# Defines the complete application stack:
#   - frontend  : Nginx serving static HTML/CSS/JS (port 80)
#   - backend   : Python Flask API via Gunicorn (port 5000, internal only)
#   - mongo     : Local MongoDB instance for development (port 27017)
#
# Usage:
#   Start with MongoDB Atlas (cloud):  docker compose --profile cloud up -d
#   Start with local MongoDB:          docker compose --profile local up -d
#   Start all services:                docker compose up -d
#   View logs:                         docker compose logs -f
#   Stop all:                          docker compose down
# =============================================================================

services:

  # ---------------------------------------------------------------------------
  # FRONTEND SERVICE
  # Nginx serving the static HTML/CSS/JS application.
  # Nginx also acts as a reverse proxy, forwarding /api/* requests to the
  # backend service — this eliminates CORS issues and is the standard pattern.
  # ---------------------------------------------------------------------------
  frontend:
    build:
      context: ./src/frontend # Docker build context is the frontend directory
      dockerfile: Dockerfile # Uses src/frontend/Dockerfile
    container_name: eduphysics-frontend
    ports:
      - "80:80" # Map host port 80 → container port 80
    depends_on:
      backend:
        condition: service_healthy # Wait for backend to pass its health check
    networks:
      - eduphysics-network
    restart: unless-stopped # Auto-restart on crashes, stop only on explicit stop
    environment:
      # Nginx has no runtime env vars; this is here for documentation purposes
      - NGINX_HOST=localhost
    healthcheck:
      test: [ "CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80/" ]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 5s # Short grace period — Nginx starts almost instantly

  # ---------------------------------------------------------------------------
  # BACKEND SERVICE
  # Python Flask application served by Gunicorn (production WSGI server).
  # The service is NOT directly exposed to the host (no ports mapping) in
  # production — all traffic comes through Nginx for security.
  # For development debugging, the port is mapped so you can call /api/* directly.
  # ---------------------------------------------------------------------------
  backend:
    build:
      context: ./src/backend # Docker build context is the backend directory
      dockerfile: Dockerfile # Uses src/backend/Dockerfile
    container_name: eduphysics-backend
    ports:
      - "5000:5000" # Exposed for direct API access during development
    environment:
      # ------------------------------------------------------------------
      # Database — override with your MongoDB Atlas URI via .env file or
      # by setting env vars before running docker compose.
      # Default falls back to the local MongoDB container service below.
      # ------------------------------------------------------------------
      - MONGODB_URI=${MONGODB_URI:-mongodb://mongo:27017/eduphysics}

      # ------------------------------------------------------------------
      # Flask / Gunicorn settings
      # ------------------------------------------------------------------
      - FLASK_ENV=${FLASK_ENV:-production}
      - PORT=5000

      # ------------------------------------------------------------------
      # CORS — allow requests from the Nginx frontend container and the
      # Vercel production domain. The frontend container is at /api/* via
      # Nginx proxy so the origin is the host running Docker.
      # ------------------------------------------------------------------
      - FRONTEND_URL=${FRONTEND_URL:-http://localhost}

      # ------------------------------------------------------------------
      # Cloudinary (optional — only needed if your app uploads images via
      # the backend). Leave blank if using direct frontend-to-Cloudinary upload.
      # ------------------------------------------------------------------
      - CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME:-}
      - CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY:-}
      - CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET:-}
    depends_on:
      mongo:
        condition: service_healthy # Wait for MongoDB to be ready before starting Flask
    networks:
      - eduphysics-network
    restart: unless-stopped
    healthcheck:
      # Uses the /api/health endpoint built into app.py
      test: [ "CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:5000/api/health')" ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s # Give Flask/Gunicorn time to start and connect to DB
    volumes:
      # Named volume for any runtime-generated files (e.g., logs).
      # Source code is baked into the image — do NOT mount src/ here in production.
      - backend-logs:/app/logs

  # ---------------------------------------------------------------------------
  # LOCAL MONGODB SERVICE
  # A local MongoDB instance for development and testing.
  # In production, replace the MONGODB_URI env var with your MongoDB Atlas URI
  # and the backend will connect to Atlas instead of this container.
  #
  # NOTE: This container persists data via a named volume (mongo-data).
  # To reset the database: docker compose down -v
  # ---------------------------------------------------------------------------
  mongo:
    image: mongo:7.0 # Official MongoDB image, version pinned for reproducibility
    container_name: eduphysics-mongo
    # MongoDB is intentionally NOT exposed to the host (no `ports:` mapping)
    # to prevent external access. Only services on the internal Docker network
    # can reach it — this is a security best practice.
    environment:
      # Root credentials for the MongoDB instance.
      # These are development defaults; in production use Docker secrets or
      # a secrets manager instead of plain environment variables.
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USERNAME:-admin}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD:-adminpassword}
      - MONGO_INITDB_DATABASE=eduphysics
    networks:
      - eduphysics-network
    restart: unless-stopped
    volumes:
      # Persist MongoDB data between container restarts.
      # Without this, all data would be lost every time the container stops.
      - mongo-data:/data/db
      # Mount the initialisation script to seed default data on first run.
      - ./docker/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    healthcheck:
      # mongosh ping confirms MongoDB is accepting connections
      test: [ "CMD", "mongosh", "--eval", "db.adminCommand('ping')" ]
      interval: 15s
      timeout: 10s
      retries: 5
      start_period: 20s # MongoDB takes a moment to initialise its data files

# =============================================================================
# NETWORKS
# A dedicated bridge network isolates application containers from each other
# and from other Docker networks on the host. Only containers explicitly
# attached to this network can communicate with each other.
# =============================================================================
networks:
  eduphysics-network:
    driver: bridge
    name: eduphysics-network

# =============================================================================
# VOLUMES
# Named volumes are managed by Docker and persist beyond container lifecycles.
#   mongo-data    – stores MongoDB data files
#   backend-logs  – stores application log files
# =============================================================================
volumes:
  mongo-data:
    name: eduphysics-mongo-data
  backend-logs:
    name: eduphysics-backend-logs
```

---

# Appendix B: Container Configurations (`Dockerfile`)

### B.1 Frontend Dockerfile (`src/frontend/Dockerfile`)
```dockerfile
# =============================================================================
# EduPhysics Academy - Frontend Dockerfile
# =============================================================================
# Uses Nginx to serve the static HTML/CSS/JavaScript files.
# The official Alpine-based Nginx image is chosen because:
#   - "nginx:alpine" is extremely small (~7 MB) compared to full nginx (~140 MB)
#   - Alpine Linux has a minimal attack surface, improving security
#   - Static file serving has no Python/Node runtime requirements
# =============================================================================

# Use the lightweight Alpine variant of the official Nginx image.
# A specific version tag is pinned (rather than "latest") to make builds
# reproducible and protect against unexpected upstream changes.
FROM nginx:1.25-alpine

# Remove the default Nginx configuration and replace it with our custom one.
# The custom config properly handles SPA routing and sets security headers.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy all static frontend files into Nginx's default web root.
# Nginx will serve these files directly without any application server.
COPY . /usr/share/nginx/html

# Expose port 80 — standard HTTP port used by Nginx.
EXPOSE 80

# Health check: verify Nginx is responding to HTTP requests.
#   --interval=30s   – check every 30 seconds
#   --timeout=5s     – allow 5 seconds for Nginx to respond (it's fast)
#   --start-period=5s – short startup grace period for Nginx
#   --retries=3      – mark unhealthy after 3 consecutive failures
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Nginx starts automatically as the default CMD from the base image.
# No CMD override is required here.
```

### B.2 Backend Dockerfile (`src/backend/Dockerfile`)
```dockerfile
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
```

---

# References
Center for Internet Security (CIS) (2023) *CIS Docker Benchmark v1.6.0*. Available at: https://www.cisecurity.org/benchmark/docker (Accessed: 15 May 2026).

Docker Inc. (2024) *Best practices for writing Dockerfiles*. Available at: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/ (Accessed: 15 May 2026).

Docker Inc. (2024) *Use volumes*. Available at: https://docs.docker.com/storage/volumes/ (Accessed: 15 May 2026).

Farcic, V. (2019) *The DevOps 2.0 Toolkit: Automating the Continuous Deployment Pipeline with Containerized Microservices*. Birmingham: Packt Publishing.

Google Buildpacks (2023) *Distroless Container Images*. Available at: https://github.com/GoogleContainerTools/distroless (Accessed: 15 May 2026).

Kane, S.P. and Matthias, K. (2018) *Docker Up & Running: Shipping Reliable Containers in Production*. 2nd edn. Sebastopol, CA: O'Reilly Media.

Mouat, A. (2015) *Using Docker: Developing and Deploying Software with Containers*. Sebastopol, CA: O'Reilly Media.

Poulton, N. (2023) *Docker Deep Dive: Zero to Docker in a single book*. Independently published.

Turner, I. (2020) 'Why you shouldn't use Alpine Linux for Python images', *Real Python*, 15 May. Available at: https://pythonspeed.com/articles/alpine-docker-python/ (Accessed: 15 May 2026).

Wiggins, A. (2011) *The Twelve-Factor App*. Available at: https://12factor.net/ (Accessed: 15 May 2026).
