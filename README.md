# HME Component Intelligence System Backend

This repository houses the microservices backend for the Heavy Mining Equipment (HME) Component Intelligence System, migrated to **Fastify** for high-performance and sub-millisecond response routing.

---

## Technical Enhancements & Backend Report

### 1. Fastify Framework Migration
* Migrated the HTTP server routing, middlewares, and request hooks from Express to **Fastify** to boost routing speeds and reduce memory footprint.
* Implemented unified response logging hooks (`onRequest`, `onResponse`) and customized exception handlers to return consistent REST bodies.
* Used `@fastify/http-proxy` in the central API Gateway to map routes dynamically to microservices (Auth Service, Component Intelligence Service).

### 2. Fleet Health Heat Map Calculation Engine
* Built a high-precision, decimal-safe computation engine (`calculateMetrics` via `decimal.js`) to parse component lifecycles:
  * **Hours Run:** Calculated from installation time against current machine operational hours.
  * **Life Used %:** Proportional usage capped safely at 100% to prevent NaN/division-by-zero.
  * **Risk Assessment:** Dynamic classification (`Healthy` / `Monitor` / `Warning` / `Critical`) mapped from wear rates and physical conditions.
  * **Slot Categorization:** Aggregates worst-case component metrics for 4 system slots: **Tyre (Tracks)**, **Engine**, **Hydraulic**, and **Transmission**.
* The computed payload returns overall machine health counters, category tabs, and tabular layout rows for the UI.

### 3. Role-Based Access Control (RBAC) & Secure CRUD
* **Multitenancy Isolation:** Fleet data is strictly isolated by `companyId`. Company Admins can only view and manage machines belonging to their own company context.
* **JWT Validation Fallback:** Added middleware interceptors to automatically fetch the active company context from the bearer JWT signature (`req.user.companyId`) if query parameters are omitted.
* **Super Admin Privilege:** Enabled `super_admin` users to override multitenancy isolation. Super Admins can pass an explicit `companyId` query parameter to retrieve or manage any company's fleet data.
* **Schema Validation Guards:** Secured CRUD endpoints using Zod schema sanitization:
  * `POST /fleet-heatmap` (Register Machine) - Validates limits against the company's subscription plan, inserts the record, persists database notification logs, and alerts admins.
  * `PUT /fleet-heatmap/:id` (Update Machine) - Partials update for operational values.
  * `DELETE /fleet-heatmap/:id` - Cascade deletes the machine and cleans up associated sub-components.

### 4. Real-time Events & Monitoring
* Connected DB notification triggers to a **Redis Pub/Sub** real-time channel (`role:Admin:alerts`, `alerts:global`).
* Successfully pushes WebSocket events to active client sessions when new fleet machines are added or deleted.
