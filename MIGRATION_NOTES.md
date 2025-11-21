# Database Migration Notes

## Pending Migrations

### Support Ticket System (Added: 2025-11-21)

The support ticket system has been added to the schema but requires a database migration.

**Run this command to apply the migration:**

```bash
npx prisma migrate dev --name add_support_ticket_system
```

**Or in production:**

```bash
npx prisma migrate deploy
```

**What this adds:**
- `support_tickets` table - Stores user support tickets
- `support_messages` table - Stores messages/replies in tickets

**New Features:**
- Users can create support tickets via `/dashboard/support`
- Admins can manage all tickets via `/dashboard/admin/tickets`
- Ticket categories: bug, feature_request, question, billing, other
- Ticket statuses: open, in_progress, waiting_response, resolved, closed
- Priority levels: low, medium, high, urgent
