You are a senior frontend engineer working with React / Next.js (TypeScript).

The backend API has been fully refactored to a multi-tenant architecture. You must update the frontend to match the new system.

---

# 🧠 SYSTEM CONCEPTS

---

- User = identity (login)
- Account = organization (clinic)
- Profile = user context inside an account
- Branch = physical branch

A user can:

- have multiple profiles
- belong to multiple accounts
- switch context after login

---

# 🔐 AUTH FLOW (UPDATED)

---

Signup is now 3-step:

1. POST /v1/auth/signup/start
2. POST /v1/auth/signup/verify
3. POST /v1/auth/signup/complete

Login flow:

- POST /v1/auth/login
  → returns list of profiles

Then:

- POST /v1/auth/profiles/select
  → returns JWT with:
  {
  userId,
  profileId,
  accountId
  }

---

# 🎯 REQUIRED UI FLOWS

---

Implement the following:

---

1. SIGNUP FLOW (3 SCREENS)

---

Step 1: Personal Info

- first name
- last name
- email
- password

Step 2: OTP Verification

- code input

Step 3: Account Setup

- account name
- specialties
- main branch
- role:
  - Owner
  - Owner + Doctor

---

2. LOGIN FLOW

---

- email + password
- after login → show "Select Profile" screen

---

3. PROFILE SELECTION

---

Display:

- account name
- role

User selects → call:
POST /auth/profiles/select

---

4. DASHBOARD CONTEXT

---

Store:

- profileId
- accountId

Use them in all API calls

---

5. STAFF JOIN FLOW

---

Option A: Email Invite

- accept invitation

Option B: Join Code

- screen: "Enter Code"
- call:
  POST /v1/join-codes/preview
  → show account + role

Then:
POST /v1/join-codes/accept

---

# ⚙️ TECH REQUIREMENTS

---

- Next.js (App Router)
- TypeScript strict
- Use React Query or similar for API
- Central auth store (context/zustand)
- Store JWT securely

---

# 🔐 RULES

---

- Do NOT assume single account
- Do NOT store userId only → always store profileId
- All requests must include account context
- UI must support switching profiles

---

# 🎯 GOAL

---

Build a clean, scalable frontend that supports:

- multi-account users
- profile switching
- branch-based operations

Start by implementing:

1. Signup flow
2. Login + profile selection
3. Context-aware layout

Do not skip steps.
