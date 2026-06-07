# Jane Tool Security Features

This version keeps the Obama-style campaign mechanism but adds a live security architecture.

## 1. Application security
- HTTPS only in production.
- OWASP-aligned controls: input validation, output escaping, secure headers, rate limiting, authentication, role access, and audit logs.
- Strong admin login with bcrypt password hashing.
- HTTP-only, signed, SameSite cookies for admin sessions.
- Role-based access: super admin, finance, coordinator, viewer.
- No public display of supporter phone numbers.

## 2. M-Pesa security
- Daraja credentials are stored in environment variables, not in public code.
- STK Push creates a pending contribution record first.
- Callback updates the same transaction using CheckoutRequestID.
- Duplicate receipt numbers are blocked.
- Callback endpoint should be HTTPS and protected at infrastructure level.
- Admin dashboard should show paid, pending, failed, cancelled, and reversed statuses separately.

## 3. Data protection
- Consent checkbox before collecting supporter or contribution data.
- Collect only needed details: name, phone, constituency, ward, amount, message, role, and consent.
- Give admins only the access they need.
- Store audit logs for sensitive actions.
- Provide procedures for correcting or deleting personal data.
- Use encrypted database backups.

## 4. Political supporter data safeguards
- Treat phone numbers, locations, contribution records, and political support as sensitive data.
- Avoid public supporter names unless explicit permission is given.
- Use aggregate public counters such as total supporters and total amount only.
- Keep message analysis focused on general community themes, not manipulation of individuals.

## 5. Before going live
- Replace demo storage with PostgreSQL.
- Create real admin accounts and change demo password.
- Connect real Safaricom Daraja credentials.
- Run penetration/security testing.
- Add privacy policy and campaign finance record-keeping process.
