# Soft Deletion Trade-offs and Analysis

## Storage and Performance Impact

1. **How does table size change over time with soft deletes accumulating?**
   With soft deletes, rows are never physically removed from the database tables. Over time, the table size will grow monotonically. For instance, if an application processes 10,000 new transactions a month and 1,000 are deleted, the table size will reflect all 10,000 records, rather than just the 9,000 active ones. After a year, the table will have 120,000 rows instead of 108,000 active rows, leading to increased disk space usage and larger full table scans if not indexed properly.

2. **What query performance problem does the partial index solve?**
   Without a partial index, any query looking for active records (`WHERE deleted_at IS NULL`) would require scanning the entire table, including all the accumulated soft-deleted rows. A partial index (e.g., `CREATE INDEX idx_transactions_active ON transactions(id) WHERE deleted_at IS NULL;`) only indexes the active rows. This keeps the index size small and ensures that queries for active records remain fast, regardless of how many soft-deleted records accumulate.

3. **At what data volume does soft delete performance become a concern without this index?**
   Performance degradation typically becomes noticeable when the number of soft-deleted rows exceeds the number of active rows, or when the total table size exceeds the database's available RAM for caching (often in the hundreds of thousands to millions of rows, depending on row size). For example, if a table has 1,000,000 rows but only 100,000 are active, a full table scan without a partial index will read 10x more data than necessary, significantly increasing I/O operations and query latency.

## Design Reasoning

### When Soft Delete is the Right Call
1. **Financial Transactions:** LedgerApp handles financial records. Retaining a history of all transactions, even those a user attempts to delete, is crucial for auditing, dispute resolution, and regulatory compliance (e.g., tax reporting).
2. **User Accounts:** If a user accidentally deletes their account, soft deletion allows for easy recovery without data loss. Additionally, retaining the user record ensures that foreign key relationships (e.g., to their accounts and transactions) remain intact for historical reporting.

### When Hard Delete is Still Appropriate
1. **Session Tokens/Authentication Codes:** Temporary data like JWTs, password reset tokens, or OTPs should be hard-deleted once they expire or are used. Retaining them offers no business value and only consumes storage space.
2. **GDPR Right to Erasure:** If a user formally requests their data to be permanently erased under privacy regulations (and no superseding financial regulations require its retention), a hard delete (or data anonymization) must be performed.

### Compliance Scenarios
**Scenario:** A regulatory body audits LedgerApp to verify the transaction history of a specific user over the past three years due to suspected fraudulent activity. The user had previously attempted to delete several suspicious transactions to hide them.

**Resolution:** Because LedgerApp uses soft deletion, the "deleted" transactions are still present in the database with a `deleted_at` timestamp. An auditor can query the database using the admin endpoint or a direct SQL query (`SELECT * FROM transactions WHERE account_id = X`) without the `deleted_at IS NULL` filter. This query will return the complete, unaltered transaction history, satisfying the regulatory requirement and providing clear evidence of the user's activities and deletion attempts.
