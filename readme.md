# ForeignPay

> UPI payments for international tourists in India — no Indian bank account or SIM card required.

ForeignPay is a full-stack UPI proxy wallet that lets foreign tourists load money using an international card and pay at any UPI merchant in India by scanning a QR code. Built as a solo production-grade rebuild of a hackathon 1st place project.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Test Credentials](#test-credentials)
- [Key Design Decisions](#key-design-decisions)

---

## Problem Statement

UPI is India's real-time payment system used by 500M+ merchants. It requires an Indian bank account and an Indian phone number — both of which international tourists don't have. This means foreigners are locked out of one of the most convenient payment systems in the world, forced to carry cash or pay inflated forex rates at ATMs.

ForeignPay solves this by acting as a proxy: tourists load INR into a ForeignPay wallet using their international card, and the platform handles the actual UPI payment on their behalf.

---

## How It Works

```
Tourist                    ForeignPay                   Merchant
   │                           │                            │
   │── Register & KYC ────────>│                            │
   │<─ KYC Approved ───────────│                            │
   │                           │                            │
   │── Top up $20 (Razorpay) ─>│                            │
   │<─ ₹1,631 credited ────────│                            │
   │                           │                            │
   │── Scan QR + Pay ₹50 ─────>│── UPI payment ────────────>│
   │<─ UTR + balance ──────────│<─ Success ─────────────────│
```

1. Tourist registers and submits passport photo for KYC
2. Admin reviews and approves the KYC application
3. Tourist tops up their INR wallet using Visa/Mastercard via Razorpay
4. Tourist scans any UPI QR code and pays — ForeignPay debits the wallet and routes the UPI payment
5. Tourist gets a UTR reference number as payment proof

---

## Tech Stack

| Layer | Technology                     |
|---|--------------------------------|
| Backend | Spring Boot 3 (Java)           |
| Frontend | React 18 + Vite + Tailwind CSS |
| Database | PostgreSQL                     |
| Auth | JWT (HS256 via jjwt)           |
| File Storage | Cloudinary (passport images)   |
| Payments | Razorpay (test mode)           |
| AI | Grok                           |
| Charts | Recharts                       |
| QR Scanner | @zxing/library                 |

---

## Architecture

```
React (localhost:3000)
         │
         │  HTTP + JWT (Bearer token)
         ▼
Spring Boot (localhost:8080)
         │              │               │
         ▼              ▼               ▼
    PostgreSQL      Cloudinary    Razorpay / Gemini
```

React never communicates with PostgreSQL, Cloudinary, or any third-party API directly. All business logic, secret keys, and external API calls live exclusively in Spring Boot. React only calls Spring Boot endpoints.

---

## Features

### Tourist (User)
- **Register / Login** — JWT-based authentication
- **KYC Submission** — Upload passport image (stored on Cloudinary), submit passport number
- **KYC Status Tracking** — Real-time status: Pending → Approved / Rejected with admin remarks
- **Wallet Top-up** — Load INR using international card via Razorpay checkout; live USD→INR preview with 2% commission displayed before payment
- **Scan & Pay** — Camera-based UPI QR scanner; payment confirmation screen with category selection; final review screen before money moves; UTR reference on success
- **Transaction History** — Recent payments on dashboard
- **Expense Analytics** — Category pie chart, daily spend bar chart, per-category breakdown with progress bars
- **AI Companion** — Gemini-powered chat that reads your actual transaction data and gives personalised spend advice; auto-generated insights cards

### Admin
- **KYC Review Queue** — View all pending applications with passport image, user details, passport number
- **Passport Viewer** — Click to expand passport image in full modal
- **Approve / Reject** — One-click with optional remarks; approved status propagates to user instantly
- **Queue Management** — Approved/rejected cards disappear from queue in real time

---

---

## Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL 14+
- A Cloudinary account (free tier)
- A Razorpay account (test mode)
- A Gemini API key (free at [aistudio.google.com](https://aistudio.google.com/app/apikey))

### 1. Database Setup

```sql
CREATE DATABASE foreignpay_db;

-- Seed admin account (password: admin123)
INSERT INTO admins (email, password_hash)
VALUES (
  'admin@foreignpay.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPZdShB4P1i'
);
```

### 2. Backend Setup

```bash
cd foreignpay-backend
```

Edit `src/main/resources/application.yaml`:

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/foreignpay_db
    username: postgres
    password: postgres
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true

jwt:
  secret: foreignpay_jwt_secret_2024_very_long_string_must_be_at_least_32_chars
  expiration: 86400000

razorpay:
  key:
    id: ${RAZORPAY_KEY_ID}
    secret: ${RAZORPAY_KEY_SECRET}

cloudinary:
  cloud:
    name: ${CLOUDINARY_CLOUD_NAME}
  api:
    key: ${CLOUDINARY_API_KEY}
    secret: ${CLOUDINARY_API_SECRET}

gemini:
  api:
    key: ${GEMINI_API_KEY}

cors:
  allowed:
    origins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000}

spring:
  servlet:
    multipart:
      enabled: true
      max-file-size: 10MB
      max-request-size: 10MB
```

Run the backend:

```bash
./mvnw spring-boot:run
```

JPA will auto-create all tables on first run via `ddl-auto: update`.

### 3. Frontend Setup

```bash
cd foreignpay-frontend
npm install
```

Create `.env` in the frontend root — **note: Spring Boot does not read `.env` files, only the frontend Vite build does**:

```env
VITE_SPRING_URL=http://localhost:8080
VITE_RAZORPAY_KEY=rzp_test_XXXXXXXXXXXXXXXX
```

Start the dev server:

```bash
npm run dev
```

App runs at `http://localhost:3000`.

---

## Environment Variables

### Backend (set as system environment variables or in IntelliJ Run Configuration)

| Variable | Description |
|---|---|
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API key secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `GEMINI_API_KEY` | Google Gemini API key |
| `CORS_ALLOWED_ORIGINS` | Frontend URL (defaults to `http://localhost:3000`) |

> **Note:** Spring Boot does not read `.env` files automatically. Set these as real system environment variables or in your IDE's run configuration. The `CORS_ALLOWED_ORIGINS` variable has a built-in default so local dev works without setting it.

### Frontend (Vite `.env` file)

| Variable | Description |
|---|---|
| `VITE_SPRING_URL` | Spring Boot base URL |
| `VITE_RAZORPAY_KEY` | Razorpay publishable key (starts with `rzp_test_`) |

---


## Key Design Decisions

### Why `walletBalance` is stored on `User`, not computed
Every payment check and dashboard load needs the balance. Computing it as `SUM(topups) - SUM(payments)` on every request means a JOIN + aggregation on potentially thousands of rows. Storing it directly makes reads O(1). Writes always happen inside `@Transactional` methods so the balance and the transaction record are always consistent — if one fails, both roll back.

### Why `Admin` is a separate table from `User`
Admins and users have different data shapes, different access rights, and should never be confused by a misplaced `WHERE role = 'ADMIN'`. Separate tables mean separate JWT role claims (`ROLE_USER` vs `ROLE_ADMIN`) and separate Spring Security matchers. There's no risk of an admin account being exposed through a user endpoint.

### Why `KycApplication` is separate from `User`
KYC is an auditable process. A user can be rejected and reapply — you need a history of every submission, who reviewed it, when, and what they said. If you stored KYC state directly on the user you'd overwrite history on every resubmission. `KycApplication` is an immutable audit log. `User.kycStatus` is a denormalized copy of the latest verdict for fast reads.

### Why every financial field is stored individually on `TopupTransaction`
`fxRate`, `commissionPercent`, `commissionAmount`, and `finalCredited` are all stored per transaction. This means you can fully reconstruct and audit any transaction from its record alone, without relying on current rates (which change constantly) or platform config (which might change over time).

### Why Spring Security needs a `CorsConfigurationSource` bean, not just `WebMvcConfigurer`
Spring Security's filter chain runs before Spring MVC. When a browser sends a CORS preflight (`OPTIONS`) request, Security intercepts it first, sees no JWT, and returns a 403 — the CORS headers never get added. Wiring a `CorsConfigurationSource` directly into `.cors(cors -> cors.configurationSource(...))` makes Security itself handle CORS before any auth checks run.

### Why `@Transactional` is non-negotiable on payment methods
Every method that touches `user.walletBalance` also creates or updates a transaction record. These two writes must be atomic. Without `@Transactional`, a crash between the two writes leaves the database in an inconsistent state — money credited but no record, or record created but money not credited. Spring's `@Transactional` wraps both writes in a single database transaction with automatic rollback on any exception.

---

## Payment Flow — Step by Step

### Top-up
```
1. User enters $20
2. Frontend → POST /api/topup/create-order
3. Spring Boot calls Razorpay API → gets order_id
4. Spring Boot saves TopupTransaction(status=PENDING, orderId=...)
5. Frontend opens Razorpay modal
6. User pays with international card
7. Razorpay returns payment_id + HMAC signature to frontend handler
8. Frontend → POST /api/topup/verify {orderId, paymentId, signature, amountUsd}
9. Spring Boot verifies HMAC signature
10. Spring Boot fetches live USD→INR rate from exchangerate-api.com
11. Computes: amountInr, commission (2%), finalCredited
12. Updates TopupTransaction(status=SUCCESS, all computed fields)
13. Adds finalCredited to user.walletBalance
14. Steps 12+13 in one @Transactional
15. Returns new balance to frontend
```

### UPI Payment
```
1. User scans QR → extracts merchantUpiId, merchantName, amount
2. User selects category, reviews, confirms
3. Frontend → POST /api/payment/initiate
4. Spring Boot checks: kycStatus == APPROVED, walletBalance >= amount
5. Creates UpiTransaction(status=PENDING)
6. Simulates payout (2s delay), generates MOCK + 9-digit UTR
7. Updates UpiTransaction(status=SUCCESS, mockUtr=...)
8. Deducts amount from user.walletBalance
9. Steps 7+8 in one @Transactional
10. Returns UTR + remaining balance to frontend
```

---

## What's Mocked / Not Production-Ready

| Feature | Current State | Production Upgrade |
|---|---|---|
| UPI Payout | Simulated with MOCK UTR + 2s delay | Razorpay Payout API or NPCI integration |
| Exchange Rate | Live from exchangerate-api.com (free tier) | Paid FX data provider for production accuracy |
| KYC Review | Manual by admin | Automated document verification (Digilocker, IDfy) |
| Multi-currency | INR only | Full FX conversion at wallet level |
| PENDING topup cleanup | No cleanup job | Scheduled job to expire ghost PENDING orders |

---