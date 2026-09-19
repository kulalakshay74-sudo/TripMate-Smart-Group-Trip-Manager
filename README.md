# TRIPMATE — Smart Group Trip Manager

A Supabase-backed group trip management application.

## Features
- Dashboard with expected, collected, pending, expenses and balance
- Trip itinerary
- Members and contributions
- Expenses
- Resort booking and rooms
- Transport
- Shared gallery
- Supabase authentication
- Admin and read-only user access

## Supabase
Project: TRIPMATE
Project ID: mzmxjlyqmpmdwfdcidby
Region: ap-south-1 (Mumbai)
URL: https://mzmxjlyqmpmdwfdcidby.supabase.co

## Run locally
Open the project with VS Code and use Live Server to run index.html.

Register or sign in using Supabase Auth. To make a registered account an administrator, run:
insert into public.admin_users (user_id)
select id from auth.users where email = 'YOUR_EMAIL@example.com';

Never expose a Supabase service-role key in frontend code.
