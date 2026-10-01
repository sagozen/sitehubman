# AVIO Platform — Development Plan

## 1. Project Goal

Build the AVIO Platform following the architecture defined by Ban.

Do NOT redesign or change the architecture without approval.

---

## 2. Platform Structure

### Avio Cloud

Repository: `avio-cloud`
Domain: `aviobrand.com`

Purpose:

* Public landing page
* Customer profile website
* Customer-facing experience
* High-traffic website
* Best possible latency

Technology:

* TanStack Start
* Cloudflare Workers
* Cloudflare D1
* Separate Cloud API/database logic

---

### Avio Shop

Repository: `avio-shop`
Domain: `shop.aviobrand.com`

Purpose:

* Online shopping
* Payment
* Discounts
* New customer orders
* Customer management
* Order management

Avio Shop must use the central Avio API for business data.

---

### Avio API

Repository: `avio-api`
Domain: `api.aviobrand.com` — TBD

Purpose:

* Mobile application backend
* Salesman system
* Printer system
* Shipper system
* Internal users
* Customer management
* Order management
* Real-time salary functionality

Technology:

* Strapi
* TypeScript
* Self-hosted
* Open-source Strapi

Do NOT require a Strapi account or Strapi Cloud.

---

## 3. Architecture Rules

### Customer-facing

Avio Cloud
→ Cloudflare Workers
→ Cloudflare D1

### Business/Internal

Avio Shop
→ Avio API
→ Strapi
→ Database

Avio Mobile
→ Avio API
→ Strapi
→ Database

Do not merge Avio Cloud's high-traffic database/API architecture into Avio API unless explicitly requested.

---

## 4. Current Tasks

### Priority 1 — Avio Cloud

* Follow the existing project template.
* Port the existing Bolt AI implementation to TanStack Start.
* Follow Cloudflare Workers standards.
* Ensure the application works correctly on Cloudflare Workers.
* Keep performance and latency as a priority.
* Use Cloudflare D1 where required.

### Priority 2 — Avio API

* Continue from the existing Strapi setup.
* Learn the existing Strapi structure before making major changes.
* Use TypeScript.
* Build reusable API/content structures.
* Keep the API suitable for Mobile, Shop and internal users.

### Priority 3 — Avio Shop

* Follow the existing repository structure.
* Connect business functionality through Avio API.
* Do not create duplicate business logic unnecessarily.

---

## 5. AI Coding Rules

Before changing code:

1. Read the existing project structure.
2. Read `plan.md`.
3. Understand the current implementation.
4. Reuse existing components and patterns.
5. Do not replace the architecture with another framework.
6. Do not introduce unnecessary dependencies.
7. Do not create duplicate APIs or databases.
8. Do not modify unrelated files.
9. Keep changes small and reviewable.
10. Run appropriate checks/builds before committing.

If a requirement conflicts with this architecture, STOP and explain the conflict instead of silently changing the architecture.

---

## 6. Git Workflow

After completing a meaningful task:

1. Check changed files.
2. Run tests/build/lint where available.
3. Review the changes.
4. Commit with a clear message.
5. Push to the repository.
6. Report what was changed and what remains.

Never claim a task is complete without verifying the result.

---

## 7. Important Principle

The goal is not to build three independent applications.

The goal is to build ONE AVIO PLATFORM with:

* Avio Cloud = customer-facing high-performance web
* Avio Shop = shopping/order experience
* Avio API = centralized business/internal backend

Follow Ban's architecture first. Optimize and improve only within this architecture.
