# ICP Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compliant, clickable ICP filing number to the bottom of every application state.

**Architecture:** Extend the existing root layout in `src/App.jsx` with a semantic footer after the main content. Use the project's existing React and Tailwind setup and keep the link in normal document flow.

**Tech Stack:** React 18, JSX, Tailwind CSS, Vite

---

### Task 1: Add and publish the ICP footer

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Establish the pre-change check**

Run: `rg -n "琼ICP备2026012986号|beian\.miit\.gov\.cn" src/App.jsx`

Expected: no matches, proving the footer is not already present.

- [ ] **Step 2: Add the semantic footer**

Insert this JSX immediately after the closing `</main>` tag:

```jsx
<footer className="px-4 pb-6 pt-2 text-center text-xs text-[#2C2C2C]/55">
  <a
    href="https://beian.miit.gov.cn/"
    target="_blank"
    rel="noopener noreferrer"
    className="transition-colors hover:text-[#B22222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B22222]/40"
  >
    琼ICP备2026012986号
  </a>
</footer>
```

- [ ] **Step 3: Run the end-of-phase verification once**

Run: `npm test`, `npx tsc --noEmit`, and `npm run build`.

Expected: the first two commands may report that no test script or TypeScript dependency is configured; `npm run build` must succeed. Confirm the production bundle contains both the filing number and `beian.miit.gov.cn`.

- [ ] **Step 4: Commit and push the implementation**

Run: `git add src/App.jsx docs/superpowers/specs/2026-09-07-icp-footer-design.md docs/superpowers/plans/2026-09-07-icp-footer.md && git commit -m "feat: add ICP filing footer" && git push origin main`

Expected: the commit is created and pushed to the configured GitHub repository.

- [ ] **Step 5: Deploy and verify**

Upload the verified `dist` contents to the existing Nginx static root `/opt/zenbazi/dist`, preserving a backup of the previous directory. Verify that the server returns the filing number and HTTPS remains healthy.
