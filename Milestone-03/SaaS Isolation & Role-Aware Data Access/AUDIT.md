# Pre-Refactor Audit

## Structural Problems

1. **Missing Tenant Isolation in `users` Table**
   - **Table:** `users`
   - **Column:** Missing `tenant_id`
   - **Consequence:** A query without a tenant filter returns all users across all organizations, exposing user data across tenants.

2. **Missing Tenant Isolation in `projects` Table**
   - **Table:** `projects`
   - **Column:** Missing `tenant_id`
   - **Consequence:** Any user can view all projects from all organizations, exposing confidential project details across tenants.

3. **Missing Tenant Isolation in `billing_details` Table**
   - **Table:** `billing_details`
   - **Column:** Missing `tenant_id`
   - **Consequence:** Billing details can be accessed across different organizations.

4. **Missing Tenant Boundaries in Relationships**
   - **Table:** `billing_details`
   - **Column:** `user_id`
   - **Consequence:** No constraints exist to ensure that `user_id` belongs to the same tenant as the billing details. A user from Tenant A could theoretically be linked to billing details from Tenant B. (Though adding `tenant_id` to both and ensuring it matches is needed).

5. **Sensitive Fields Exposed**
   - **Table:** `users`
   - **Column:** `salary`, `password_hash`
   - **Table:** `billing_details`
   - **Columns:** `card_last4`, `expiry_date`, `billing_address`
   - **Consequence:** These fields are currently returned by API routes (`/users`) without any role-based filtering, exposing sensitive financial and security data to all users.

6. **Missing Indexes for Tenant Scoped Queries**
   - **Tables:** `users`, `projects`, `billing_details`
   - **Consequence:** Queries filtering by `tenant_id` will require full-table scans, causing severe performance degradation at scale.

## Role-Based Access Rules to Implement

- **Admin:** Sees all users, all sensitive fields, all projects within the tenant.
- **Manager:** Sees team members and team projects, no sensitive financial fields (`salary`, `billing_details`).
- **User (Employee):** Sees own profile and assigned projects only, no other user data.
