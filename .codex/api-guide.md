# Cradlen API Guide (for Codex)

This project uses a multi-tenant backend with profile-based authentication.

## 🔐 Auth Flow

### Signup

1. POST /v1/auth/signup/start
2. POST /v1/auth/signup/verify
3. POST /v1/auth/signup/complete

### Login

POST /v1/auth/login
→ returns profiles + selection_token

### Profile Selection

POST /v1/auth/profiles/select
→ returns access + refresh tokens

---

## 🧠 Important Concepts

- userId = identity
- profileId = active context
- accountId = organization

All authenticated requests must include:

- profileId
- accountId
- branchId (if needed)

---

## 📦 Headers (via proxy)

- X-Account-Id
- X-Profile-Id
- X-Branch-Id (optional)

---

## 👥 Staff Join

### Invite Flow

POST /v1/accounts/:accountId/invitations

### Join Code Flow

POST /v1/join-codes/accept

Preview endpoint may or may not exist.

---

## ⚠️ Rules

- Do NOT assume single account
- Do NOT assume single role
- Do NOT use userId for business logic
- Always use profileId

---

## 🎯 Notes

- Roles are uppercase from backend:
  OWNER, DOCTOR, RECEPTIONIST
- Frontend may normalize roles for UI only
- Branch selection may be required after profile selection
