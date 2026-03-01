/**
 * MongoDB Initialisation Script
 * ==============================
 * This script runs automatically the FIRST TIME the mongo container starts
 * (when no data directory exists). It creates the application database,
 * a dedicated app user, and seeds the default admin account.
 *
 * To re-run this script: docker compose down -v && docker compose up
 */

// Switch to the application database
db = db.getSiblingDB('eduphysics');

// ---- Create a dedicated application user ----
// Using a restricted user (readWrite on eduphysics only) follows the
// principle of least privilege — the app cannot modify other databases.
db.createUser({
    user: 'eduphysics_user',
    pwd: 'eduphysics_password',
    roles: [
        {
            role: 'readWrite',
            db: 'eduphysics'
        }
    ]
});

// ---- Create collections ----
db.createCollection('students');
db.createCollection('admins');

// ---- Seed default admin account ----
// This is the same admin the app creates via init_admin() in app.py,
// but seeding it here ensures it exists before the first API request.
db.admins.insertOne({
    username: 'admin',
    password: 'admin123',   // ⚠️ Change this in any real deployment!
    created_at: new Date()
});

print('✅ MongoDB initialised: eduphysics database, app user, and default admin created.');
