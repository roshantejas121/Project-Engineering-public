-- CorpFlow v1.0 Database Schema
-- Standard tables for users, projects, and billing.

DROP TABLE IF EXISTS billing_details;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tenants;

-- ✅ Move 02: Add Tenant Identification
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id), -- ✅ Isolation key
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
    salary DECIMAL(10,2), -- 🔒 Sensitive — admin only
    UNIQUE(email, tenant_id), -- ✅ Unique per tenant, not globally
    UNIQUE(tenant_id, id) -- ✅ Target for same-tenant composite foreign keys
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id), -- ✅ Isolation key
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    budget DECIMAL(12,2),
    owner_id INTEGER NOT NULL,
    CONSTRAINT fk_projects_owner_same_tenant
      FOREIGN KEY (tenant_id, owner_id) REFERENCES users(tenant_id, id)
);

CREATE TABLE billing_details (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id), -- ✅ Isolation key
    user_id INTEGER NOT NULL REFERENCES users(id),
    card_holder_name VARCHAR(100),
    card_last4 VARCHAR(4),
    expiry_date VARCHAR(5),
    billing_address TEXT,
    CONSTRAINT fk_billing_user_same_tenant
      FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id)
);

-- ✅ Move 07: Add Indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX idx_billing_details_tenant_id ON billing_details(tenant_id);
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);

-- Seed Initial Data
INSERT INTO tenants (name) VALUES ('Pouch.io'), ('Velocity');

INSERT INTO users (tenant_id, full_name, email, password_hash, role, salary) VALUES
(1, 'Alice Johnson', 'alice@pouch.io', 'pbkdf2:sha256:600000$hasher$81726a', 'admin', 125000.00),
(1, 'Bob Smith', 'bob@pouch.io', 'pbkdf2:sha256:600000$hasher$81726b', 'manager', 95000.00),
(2, 'Charlie Davis', 'charlie@velocity.com', 'pbkdf2:sha256:600000$hasher$81726c', 'admin', 140000.00),
(2, 'David Miller', 'david@velocity.com', 'pbkdf2:sha256:600000$hasher$81726d', 'employee', 75000.00);

INSERT INTO projects (tenant_id, name, description, status, budget, owner_id) VALUES
(1, 'Pouch Portal', 'Customer portal for Pouch.io', 'active', 50000.00, 1),
(2, 'Velocity Engine', 'Back-end engine for Velocity', 'active', 120000.00, 3),
(2, 'Secret R&D', null, 'inactive', 250000.00, 3);

INSERT INTO billing_details (tenant_id, user_id, card_holder_name, card_last4, expiry_date, billing_address) VALUES
(1, 1, 'Alice Johnson', '4242', '12/28', '123 Tech Lane, SF'),
(2, 3, 'Charlie Davis', '9182', '08/26', '789 Velocity Rd, NY');
