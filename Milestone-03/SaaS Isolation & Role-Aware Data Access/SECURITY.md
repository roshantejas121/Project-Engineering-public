# Security Decisions & Threat Model

## 1. Sensitive Fields and Justification

- **`users.salary`**: Highly sensitive financial data. Restricted exclusively to the `admin` role. Managers and employees are explicitly blocked from accessing this field in API responses.
- **`users.password_hash`**: Critical security data. Never returned in any API response under any circumstances, regardless of the requesting user's role.
- **`billing_details.card_last4`, `expiry_date`, `billing_address`**: Sensitive payment data. While not currently exposed via an API endpoint, these are structurally restricted and must be treated with the same strict access controls (Admin only) if endpoints are added.

## 2. Tenant Boundaries and Query Isolation

- **Tenant Identification (`tenant_id`)**: Added to all tenant-specific tables (`users`, `projects`, `billing_details`). It acts as the primary partition key.
- **Query Isolation**: Every database query in the API now includes a mandatory `WHERE tenant_id = $1` clause. This ensures that no data can leak across organizational boundaries.
- **Relationship Boundaries**: Foreign keys (`owner_id` in `projects`, `user_id` in `billing_details`) reference the `users` table. The application logic ensures that relationships are only created or queried within the same `tenant_id`.

## 3. Cross-Tenant Risks and Schema Mitigations

- **Risk:** A user from Tenant A accesses a project ID belonging to Tenant B via direct object reference (IDOR).
  - **Mitigation:** The `GET /projects/:id` query explicitly includes `AND tenant_id = $1`. Even if a valid project ID is provided, the query returns 0 rows if the tenant IDs do not match.
- **Risk:** A user from Tenant A creates a project and assigns it to a user in Tenant B.
  - **Mitigation:** While the schema relies on application-level enforcement for inserts (e.g., verifying the `owner_id` belongs to the same `tenant_id`), the read queries will inherently isolate the data. (In a fully robust PostgreSQL setup, Row-Level Security (RLS) could enforce this at the database level, but here it is handled by the strict API queries).
- **Risk:** Full table scans degrade performance and increase the risk of query timeouts during a DDoS attack.
  - **Mitigation:** Composite indexes (e.g., `idx_users_tenant_id`, `idx_projects_tenant_id`) have been added to ensure tenant-scoped queries are highly performant.

## 4. Role-Based Access Control (RBAC)

- **Admin**: Full access to all users and projects within their tenant. Can view sensitive fields like `salary`.
- **Manager**: Access to team members and projects within the tenant, but cannot view sensitive financial fields.
- **Employee (User)**: Can only view their own profile and projects they explicitly own. Attempting to access another user's profile returns a 403 Forbidden error.
