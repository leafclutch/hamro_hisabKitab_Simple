# MASTER PROMPT — HAMRO HISABKITAB

You are an expert Senior Full Stack Engineer, Senior Product Architect, Senior UI/UX Engineer, and Financial Dashboard System Designer.

Your task is to build a complete production-grade internal financial management system named:

# Hamro HisabKitab

This system is for a software services + training/internship company.

The purpose of the system is to:

- Track revenue
- Track expenses
- Calculate profits
- Manage project finances
- Manage training finances
- Track internal withdrawals
- Provide financial intelligence dashboards
- Maintain approval workflows
- Maintain audit logs

This is NOT a traditional ERP.
This is NOT a complex accounting system.

This is a:

> Business Profit Tracking & Financial Intelligence Dashboard

The system must prioritize:

- Simplicity
- Financial clarity
- Profit tracking
- Editable calculations
- Auditability
- Scalability
- Fast UI
- Professional dashboard experience

---

# IMPORTANT SECURITY NOTE

DO NOT hardcode any secrets directly in source code.

Use environment variables for:

- project url: https://hmxhyxugyhhtgxnteprk.supabase.co
- anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhteGh5eHVneWhodGd4bnRlcHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzU0NDEsImV4cCI6MjA5NDQ1MTQ0MX0.VZn2oEXzKAI3mM4jxoFjePTbd4yyFHy-NVZaBzr2b_Q
- service_role key = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhteGh5eHVneWhodGd4bnRlcHJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg3NTQ0MSwiZXhwIjoyMDk0NDUxNDQxfQ.9ZMQrkGYkTs5iuFVq_jxgInHDMX1UJbKXAZTmaMrNuI

Never expose service_role key to frontend.
Use it ONLY in server-side actions, API routes, or secure server functions.

---

# TECH STACK (MANDATORY)

Use ONLY the following stack:

## Frontend

- Next.js latest version
- App Router
- TypeScript
- Tailwind CSS
- Server Components where appropriate
- Client Components only when needed

## Backend / Database

- Supabase PostgreSQL
- Supabase Auth
- Supabase Row Level Security (RLS)
- Supabase Realtime

## Hosting

- Cloudflare Pages

## Storage

- Cloudflare R2

DO NOT use:

- Prisma
- Firebase
- Express
- Node backend server
- MongoDB
- Laravel
- Any separate backend

Everything must work using:

- Next.js
- Supabase
- Cloudflare

---

# UI / DESIGN REQUIREMENTS

The UI theme, color palette, typography, spacing, and overall dashboard feel must closely match:

https://lcon.leafclutch.com.np/login

Analyze the design and recreate:

- Font style
- Font weights
- Card styling
- Colors
- Border radius
- Shadows
- Input styling
- Sidebar style
- Button design
- Dashboard feel
- Spacing system
- Professional clean appearance

The system should feel:

- Modern
- Minimal
- Premium
- Professional
- Finance-dashboard oriented

---

# BRANDING ASSETS

Use these assets:

## Logo

/home/sid/leafclutch/hamro_hisabKitab_Simple/logo/onlyLogo.svg

## Favicon

/home/sid/leafclutch/hamro_hisabKitab_Simple/favicon.ico

---

# APPLICATION NAME

# Hamro HisabKitab

---

# CORE BUSINESS PURPOSE

The company has 2 business models:

## 1. Training & Internship Programs

The system should track:

- Student payments amount
- installments leaf and paid
- when to pay with dates
- Training expenses
- Mentor fees
- Udemy course costs
- Referral commissions
- Staff fees
- Ad boosting costs
- Company fund allocation
- Miscellaneous costs
- Final profit

The goal is:

> Know exactly how much profit is earned from students. per head and total amount both

---

## 2. Client Software Projects

The system should track:

- Client payments total amount
- reamining installments, paid, unpaid, cash, bank, esewa, personal account, etc
- Project expenses
- Developer costs
- Staff fees
- Subscription costs
- Referral commissions
- Hosting/server costs
- Company fund allocation
- Miscellaneous costs
- Final profit

The goal is:

> Know exactly how much profit is earned from clients.

---

# CORE MODULES

## 1. Authentication System

- Login
- Logout
- Forgot password with eye icon in password input field
- Protected routes
- Session handling

## 2. Role & Permission System

Dynamic role system with:

- Create
- Read
- Update
- Delete
- Approve permissions

## 3. Dashboard

Show:

- Total revenue
- Total expenses
- Total profit
- Student revenue
- Client revenue
- Pending approvals
- Recent transactions

## 4. Training Finance Module

### Student Data

- Student name
- Phone
- Email
- Course name
- Joining date
- Notes

### Payments

- Full payment
- Installments
- Payment history

### Expense Categories

- Mentor fee
- Udemy course fee
- Referral commission
- Staff fee
- Ad boosting cost
- Company fund amount
- Certificate cost
- Server cost
- Miscellaneous cost
- Other custom cost

### Profit Formula

Training Profit =
Total Student Revenue - Total Expenses

## 5. Client Project Finance Module

### Project Data

- Project name
- Client name
- Contact info
- Deadline
- Assigned employees
- Notes

### Expense Categories

- Developer cost
- Staff fee
- Subscription cost
- Claude subscription
- ChatGPT subscription
- Hosting/server cost
- Referral commission
- Company fund allocation
- API costs
- Miscellaneous cost
- Other custom cost

### Profit Formula

Project Profit =
Total Project Revenue - Total Project Expenses

## 6. Personal Withdrawal / Partner Ledger

Track:

- Withdrawn amount
- Repaid amount
- Remaining balance
- Approval status

Rules:

- Requires approval
- Admin-only visibility
- Not treated as expense

## 7. Transaction System

Transaction types:

- student_payment
- project_payment
- expense
- referral_commission
- developer_payment
- employee_payment
- withdrawal
- repayment
- adjustment

## 8. Multi Currency Support

Support:

- INR
- NPR
- USD
- GBP

## 9. Approval Workflow

Statuses:

- Draft
- Pending Approval
- Approved
- Rejected
- Locked

## 10. Audit Logs

Track:

- User
- Action
- Old value
- New value
- Timestamp

## 11. File Storage

Use Cloudflare R2 for:

- PDFs
- Receipts
- Contracts
- Certificates

## 12. Database Design

Tables:

- users
- roles
- permissions
- students
- student_payments
- student_expenses
- clients
- projects
- project_payments
- project_expenses
- transactions
- withdrawals
- audit_logs
- uploaded_files

Use:

- UUIDs
- Foreign keys
- Indexes
- Timestamps

## 13. Security

Implement:

- Supabase RLS
- Secure server actions
- Protected routes
- Permission-based access

## 14. Next.js Architecture

Recommended structure:

```bash
src/
 ├── app/
 ├── components/
 ├── modules/
 ├── services/
 ├── hooks/
 ├── lib/
 ├── types/
 ├── utils/
 ├── providers/
 ├── actions/
 ├── styles/
 └── config/
```

## 15. Reusable UI Components

Build reusable:

- Sidebar
- Navbar
- Data tables
- Charts
- Cards
- Forms
- Modals
- Filters
- Pagination
- Search

## 16. Table Features

Support:

- Search
- Sorting
- Filtering
- Pagination
- Export CSV

## 17. Responsive Design

Support:

- Desktop
- Tablet
- Mobile

## 18. Dark Mode

Implement:

- Light mode
- Dark mode
- Theme persistence

## 19. Final Deliverables

Generate:

1. Full architecture
2. Database schema
3. SQL migrations
4. Next.js structure
5. Authentication
6. Role system
7. Dashboard UI
8. Profit calculation engine
9. Audit log system
10. Cloudflare deployment setup

# FINAL GOAL

Build a complete modern internal financial management system named:

# Hamro HisabKitab

The system must provide complete visibility into:

- Revenue
- Expenses
- Profit
- Student earnings
- Client project earnings
- Internal withdrawals
- Company financial health

The final result should feel:

- Modern
- Fast
- Professional
- Premium
- Finance-focused
