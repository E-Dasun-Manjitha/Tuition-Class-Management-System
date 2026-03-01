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
