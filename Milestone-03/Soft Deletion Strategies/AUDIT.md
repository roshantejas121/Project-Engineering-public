# Pre-Refactor Audit

1. **File:** `routes/accounts.js`
   **Line:** 43
   **Table:** `accounts`
   **Consequence:** When this query runs, the user's account record is permanently destroyed, making it impossible to audit past financial accounts or trace historical transactions linked to this account.

2. **File:** `routes/transactions.js`
   **Line:** 43
   **Table:** `transactions`
   **Consequence:** When this query runs, a financial transaction record is permanently deleted, breaking the audit trail required for compliance, disputes, and tax reporting.

3. **File:** `routes/users.js`
   **Line:** 44
   **Table:** `users`
   **Consequence:** When this query runs, the user's profile is permanently erased, removing all historical context about who performed actions or owned accounts in the system.
