# AGENTS.md: AI Orchestration & Guidelines

This document serves as the primary instruction set for AI agents working on the **Zero-Trust Anonymous Feedback** system. All agents must adhere to the workflows and technical standards defined here to ensure architectural consistency and cryptographic integrity.

## 1. Agent Workflow & State Management
Before performing any task, the agent must synchronize with the current project state using the `agents/` directory.

**CRITICAL RULE: WE ARE ONLY DOING BACKEND FOR NOW. DO NOT IMPLEMENT OR PLAN ANY FRONTEND FEATURES.**

* **Reference the Source of Truth:** Always refer to `agents/project-spec.md` for the full technical requirements, database schemas, and API endpoints. Do not deviate from the spec unless explicitly instructed by the user.
* **Context Awareness:** Read `agents/context.md` at the start of every session to understand the current development phase, previous hurdles, and specific user instructions for the current iteration.
* **Task Tracking:** Use `agents/todo.md` to manage short-term tasks. 
    * **Rule:** Mark tasks as completed and update the "Current Phase" description in `todo.md` before finishing a response.
* **Handoff:** If a task is incomplete, the agent must write a "Next Steps" summary into `agents/context.md` to guide the next agent.

---

## 2. Core Engineering Standards

### 2.1 API Response Shape
All Express responses **must** follow this uniform structure:
* **Success:** `{ "data": { ... }, "error": false, "error_message": null }`
* **Failure:** `{ "data": null, "error": true, "error_message": "Reason" }`

### 2.2 Validation & Safety
* **Zod First:** No route should process `req.body` or `req.query` without a Zod schema. Use the `validate(schema, source)` middleware factory.
* **Error Handling:** Use the `asyncHandler` wrapper for all routes. Throw `ApiError(status, message)` for operational errors (4xx).
* **Logging:** Use `req.log.info()` or `req.log.error()` (via `pino-http`). Never use `console.log`.

### 2.3 Authentication Logic
* **Admin (/api/*):** Strictly protected by `authMiddleware`. Requires valid JWT with `user_id` and `password_version`.
* **Client (/start, /submit):** Unauthenticated by design. Identification is handled via Blind RSA signatures and OTPs.

---

## 3. Cryptographic Implementation Rules (Blind RSA)
The anonymity of this system relies on the correct implementation of the `@cloudflare/blindrsa-ts` library.

1.  **Blind Signing:** The server signs a *blinded* message and never sees the raw token $t$.
2.  **Double-Spend Prevention:** The server must store `SHA-256(token)` in the `BlindToken` collection. Before saving a response, the agent must verify the token has not been used.
3.  **Key Isolation:** Each `Campaign` owns its own RSA key pair. Never use a global server key for campaign signatures.

---

## 4. Testing Requirements
No feature is considered "Done" until its corresponding test in `server/tests/` passes.
* **Environment:** Use `mongodb-memory-server` for database testing.
* **Coverage:** Every new service method requires a unit test; every new route requires an integration test using `supertest`.

---

## 5. Directory Structure Reference
Maintain the following organization:
* `server/src/core/`: Singleton instances (Logger, DB, Errors).
* `server/src/services/`: All business logic and DB queries.
* `server/src/routes/`: Route definitions only (logic stays in services).
* `server/src/schemas/`: Zod definitions shared across the stack.

---

### Agent Checklist
- [ ] Read `agents/project-spec.md`.
- [ ] Check `agents/todo.md` for the next task.
- [ ] Verify existing context in `agents/context.md`.
- [ ] Implement feature following the technical standards above.
- [ ] Write/Run tests.
- [ ] Update `agents/todo.md` and `agents/context.md` with progress.
