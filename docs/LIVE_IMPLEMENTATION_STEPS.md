# Live Implementation Steps

1. Buy domain and hosting with HTTPS.
2. Set up PostgreSQL database.
3. Create admin accounts with strong passwords.
4. Apply the database schema in `docs/database_schema.sql`.
5. Configure `.env` from `backend/.env.example`.
6. Register Safaricom Daraja app and obtain M-Pesa credentials.
7. Connect the STK Push request function inside `/api/contributions`.
8. Configure the Daraja callback URL as `/api/mpesa/callback`.
9. Test sandbox payments.
10. Go live only after successful payment, callback, receipt, and dashboard tests.
11. Later add USSD `*XXX#` through a licensed USSD provider and connect it to the same backend.
