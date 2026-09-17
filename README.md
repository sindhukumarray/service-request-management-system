# JASIQ Labs - Internship Readiness Audit
## AI-Assisted Service Request Management System (SRMS)

Welcome to the JASIQ Labs Internship Readiness Audit. You are tasked with auditing, debugging, fixing, and extending a partially implemented AI-Assisted Service Request Management System (SRMS).

---

## 1. Project Introduction

In any modern enterprise, managing internal employee request logs (such as software license renewals, corporate VPN access requests, hardware failures, or access changes) is critical. The **AI-Assisted Service Request Management System (SRMS)** provides:
- A public interface for users to register and sign in.
- An employee dashboard to create, view, search, and cancel service tickets.
- An AI-assisted text analyzer that automatically summarizes issues, recommends categories, and suggests priority levels before submission.
- An administrative portal for support agents to triage tickets, update statuses, assign agents, and track ticket metrics.

This repository contains a deliberately incomplete and partially defective codebase (approximately 30% functional). The foundational monorepo scaffolding is set up, but the implementation has extensive security gaps, configuration issues, data-integrity issues, and incomplete integration flows.

---

## 2. Assessment Objective

As a candidate, you are evaluated on your ability to:
1. Understand and trace a multi-layer codebase (React, Express, MongoDB).
2. Discover hidden functional, security, validation, and performance defects.
3. Secure APIs against common threats (Privilege Escalation, IDOR/BOLA, CORS issues).
4. Integrate and safeguard AI-assisted API wrappers.
5. Create automated test suites validating your fixes.
6. Deploy the application into a production cloud environment.
7. Present your architectural changes and defend your choices.

> [!NOTE]
> AI coding assistants, official documentation, and online resources are fully permitted. You must understand and be ready to defend all changes you make in your branch.

---

## 3. Expected Application Features

### Authentication & Authorization
- **Registration**: Register standard accounts. Secure role assignments.
- **Login & Persistence**: Secure logins, issue JWTs, and preserve sessions on page refresh.
- **Route Guarding**: Restrict dashboard pages and admin panels appropriately.

### User Workflows
- **Request Creation**: File new support requests.
- **AI Analyzer**: Query an AI service to summarize titles and suggest category/priority levels. Let users review suggestions before saving.
- **My Requests**: List, search, filter, and view details of own requests.
- **Cancellation**: Cancel eligible tickets (non-resolved, non-cancelled).

### Admin Workflows
- **Triage**: List all organization tickets. Search, filter, and paginate through results.
- **Assignment**: Assign tickets to registered support staff. Keep histories of changes.
- **Status Updates**: Update ticket statuses via valid state transitions (OPEN -> IN_REVIEW -> IN_PROGRESS -> RESOLVED).
- **Dashboard Metrics**: Display live metrics showing active, resolved, open, and high-priority ticket counts.

### Technical Controls
- **CORS Policies**: Configure robust cross-origin rules for frontend-backend communication.
- **Validation**: Enforce length, trimming, format, and type validation on both frontend and backend.
- **Error Handling**: Replace stack traces and raw DB logs with clean API responses.
- **Responsive Layout**: Support mobile screen resolutions.

---

## 4. Expected Use Cases

### UC-01: User Registration
- **Actor**: Guest
- **Preconditions**: Email is not already registered.
- **Primary Flow**: Guest enters name, email, and password. Submits and receives a success response.
- **Failure Scenarios**: Empty name/email, weak password, or duplicate email registration.

### UC-02: User Login
- **Actor**: Guest / Registered User
- **Preconditions**: Account exists and is active.
- **Primary Flow**: User enters credentials. Receives JWT, redirects to User Dashboard.
- **Failure Scenarios**: Wrong password, non-existent email, or logging into a deactivated account.

### UC-03: Admin Login
- **Actor**: Guest / Admin User
- **Preconditions**: Admin account exists.
- **Primary Flow**: Admin enters credentials. Receives JWT, redirects to Admin Panel.
- **Failure Scenarios**: Logging in with invalid admin details.

### UC-04: Create Service Request
- **Actor**: Authenticated User
- **Preconditions**: User is logged in.
- **Primary Flow**: User fills in title, description, category, and priority. Submits ticket.
- **Failure Scenarios**: Blank fields, missing title, or duplicate submissions on rapid clicks.

### UC-05: Generate AI Request Analysis
- **Actor**: Authenticated User
- **Preconditions**: Title and description are filled.
- **Primary Flow**: User clicks "Analyze Content". The system calls the AI route and displays a suggested summary, category, priority, and rationale.
- **Failure Scenarios**: Network offline, empty input, or AI provider failure.

### UC-06: View Own Requests
- **Actor**: Authenticated User
- **Preconditions**: User is logged in.
- **Primary Flow**: User opens dashboard and sees only tickets raised by their own account.
- **Failure Scenarios**: Data leak (BOLA/IDOR) showing other users' tickets.

### UC-07: View Request Details
- **Actor**: Authenticated User / Admin
- **Preconditions**: Request exists and user owns it (or is admin).
- **Primary Flow**: User clicks "View" and sees request info and timeline.
- **Failure Scenarios**: Accessing an invalid request ID or a ticket owned by another user.

### UC-08: Cancel Eligible Request
- **Actor**: Authenticated User
- **Preconditions**: Ticket status is OPEN or IN_REVIEW.
- **Primary Flow**: User clicks "Cancel". Status updates to CANCELLED.
- **Failure Scenarios**: Cancelling a RESOLVED ticket, or cancelling another user's ticket.

### UC-10: Admin Filters and Searches Requests
- **Actor**: Authenticated Admin
- **Preconditions**: In Admin Panel.
- **Primary Flow**: Admin enters search terms or selects category filters to query tickets.

### UC-11: Admin Assigns Request
- **Actor**: Authenticated Admin
- **Preconditions**: Selected ticket exists.
- **Primary Flow**: Admin selects support agent from dropdown and clicks assign.

### UC-12: Admin Updates Request Status
- **Actor**: Authenticated Admin
- **Preconditions**: Valid transition path (e.g. IN_PROGRESS -> RESOLVED).
- **Primary Flow**: Admin selects new status. Changes are saved.

### UC-13: Admin Updates Priority
- **Actor**: Authenticated Admin
- **Preconditions**: Selected ticket exists.
- **Primary Flow**: Admin updates ticket priority (LOW, MEDIUM, HIGH, URGENT).

### UC-14: View Status History
- **Actor**: User / Admin
- **Preconditions**: Ticket detail page is loaded.
- **Primary Flow**: System renders timeline showing who changed the status, when, and any note.

### UC-15: Admin Dashboard Metrics
- **Actor**: Authenticated Admin
- **Preconditions**: Accessing Admin Control Panel.
- **Primary Flow**: Dashboard cards display accurate calculations of all tickets in MongoDB.

### UC-16: Unauthorized Access Prevention
- **Actor**: Guest / Unauthenticated User
- **Preconditions**: Guest attempts to load private dashboards or request detail URLs.
- **Primary Flow**: System blocks request and redirects back to `/login`.

### UC-17: Logout and Session Expiry
- **Actor**: Authenticated User
- **Preconditions**: Active session exists.
- **Primary Flow**: User clicks logout. Local storage is cleared and user is redirected.

---

## 5. Expected Business Rules

1. **Isolation**: Standard users may only query and modify requests raised by their own user ID.
2. **Admin-Only**: Route guards must check both token validity and the `ADMIN` role.
3. **Unique Keys**: Ticket reference numbers (e.g. `SR-yymmdd-xxxx`) must be unique.
4. **Transition Rules**: Resolved or Cancelled tickets cannot be re-opened or changed.
5. **Advisory AI**: AI-generated priority suggestions are advisory and must not bypass backend validation.

---

## 6. Local Setup

### 1. Install Dependencies
Run from the monorepo root:
```bash
npm install
```

### 2. Configure Environment Files
- Copy `server/.env.example` to `server/.env`
- Copy `client/.env.example` to `client/.env`

### 3. Run Database Seeding
Ensure your local MongoDB instance is running, and execute:
```bash
npm run seed
```
*Note: You may need to review the seed script or environment configuration if seeding is blocked.*

### 4. Run Locally
Start the server and client concurrently in development mode:
```bash
npm run dev
```

### 5. Production Build
Verify that both client and server build without errors:
```bash
npm run build
```

---

## 7. Environment Variables

### Backend (`server/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/service-request-db
JWT_SECRET=replace_with_a_secure_local_secret
JWT_EXPIRES_IN=1d
CLIENT_ORIGIN=http://localhost:3000
AI_PROVIDER=mock
AI_SERVICE_TOKEN=mock_secret
DB_SEED_MODE=active
``` 

Note on reverse-proxy (TRUST_PROXY)

- TRUST_PROXY is optional in local development and tests. When the server runs behind a trusted reverse proxy in production (for example, NGINX, a cloud load balancer, or a CDN), set the environment variable TRUST_PROXY to a value appropriate for your topology so Express can populate req.ip correctly for IP-based protections (such as rate limiting).
- Example: `TRUST_PROXY=1` (suitable when there is exactly one trusted proxy in front of the app).
- Do NOT set `TRUST_PROXY` to `true`, `*`, or other overly-broad values in production; trusting untrusted proxies can allow spoofed `X-Forwarded-For` headers and weaken IP-based rate limiting and abuse defenses.

For more details, see deployment notes and the server's configuration files.


### Frontend (`client/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 8. Candidate Development Workflow

1. Create a feature branch from the latest `master`:
   ```bash
   git checkout master
   git pull origin master
   git checkout -b assessment/<your-name>
   ```
2. Make atomic commits describing your fixes (e.g. `git commit -m "fix: enforce CORS credentials and allowed methods"`).
3. Push your progress branch:
   ```bash
   git push -u origin assessment/<your-name>
   ```

---

## 9. Required Test Coverage

Your verification suite should cover:
- **Authentication**: Weak password rejections, logins, and session restores on refresh.
- **Authorization**: Standard users reading/updating other user tickets (BOLA/IDOR tests), and guest access blocks.
- **Request Operations**: Valid creation, duplicate submission blocks, enums validation (LOW/MEDIUM/HIGH/URGENT), and cancellations.
- **Admin**: Accurate metrics counts, assignee allocations, and status history logs.
- **AI Integration**: Endpoint availability, invalid suggested priority handling, error states, and offline fallbacks.
- **CORS & UI**: Preflight OPTIONS checking, responsive menu controls, and Toast notifications.

---

## 10. Test Case Documentation Format

Record your test executions in the following format:

| Test ID | Use Case | Preconditions | Test Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| TC-001 | Valid Login | Seeded user exists | Enter email & password, click sign in | Session token is saved, user redirected | | Pass/Fail |

---

# Internship Readiness Audit Submission

## Candidate Details

- Name:
- Email:
- College:
- Course and Year:
- Technology Track:
- GitHub Profile:

## Repository

- Feature Branch:
- Branch URL:
- Latest Commit:
- Pull Request URL:

## Deployment

- Frontend URL:
- Backend URL:
- User Credentials:
- Admin Credentials:

## Initial Gap Analysis

### Functional Gaps
1.
2.

### Technical Gaps
1.
2.

### Security and Authorization Gaps
1.
2.

### UI/UX Gaps
1.
2.

### Testing and Deployment Gaps
1.
2.

## Changes Completed

1.
2.
3.

## Use Cases Completed

| Use Case ID | Use Case | Completion Status | Notes |
|---|---|---|---|
| UC-01 | User Registration | Complete/Partial/Not Complete | |

## Test Execution

| Test ID | Use Case | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| TC-001 | | | | Pass/Fail |

## Known Limitations

1.
2.

## AI and External Tools Used

| Tool | Purpose | Files or Areas Affected | Verification Performed |
|---|---|---|---|
| | | |

## Deployment Notes

- Hosting platform:
- Database configuration:
- CORS & preflight details:

## Demo

- Demo Video:
- Preferred Live Demo Time:
