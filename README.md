# TRIPMATE — Smart Group Trip Manager

Professional Supabase-powered group-trip operations platform.

## Live capabilities
- Secure Supabase Authentication
- Role-based Admin / Read-only user access
- Dashboard financial KPIs
- Member directory and contribution tracking
- Payment recording and finance export
- Expense management
- Day-wise itinerary
- Google Maps links
- Resort/booking management
- Room allocation
- Transport and driver management
- Gallery moderation
- Admin create/edit/delete workflows
- Trip settings administration
- Supabase Row Level Security
- Responsive desktop/mobile interface

## Technology
Vanilla HTML, CSS and JavaScript + Supabase Auth/Postgres/Data API.

## Supabase
Project: TRIPMATE
Project ID: mzmxjlyqmpmdwfdcidby
Region: ap-south-1 (Mumbai)

Only the Supabase publishable key is used in the browser. Never expose a service-role or secret key.

## Admin
The registered account used for this project is promoted to administrator in the database. Sign in normally; the Admin tab and CRUD controls appear automatically.

## Run locally
Open the repository in VS Code and use Live Server, or serve the folder with any static HTTP server. Do not open the HTML with an unsupported file:// setup if your browser blocks module/CDN requests.

## Security
All application tables have RLS enabled. Authenticated users can read trip data; only accounts present in `admin_users` can create, update or delete operational records.
