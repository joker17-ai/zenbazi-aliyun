# ICP Footer Design

## Goal

Display the approved ICP filing number `琼ICP备2026012986号` at the bottom of every application state.

## Design

Add a semantic `<footer>` immediately after the application's `<main>` element in `src/App.jsx`. The filing number will be a subdued, centered text link to `https://beian.miit.gov.cn/`, opening in a new tab with `rel="noopener noreferrer"`.

The footer remains in normal document flow so it never covers interactive content. Existing Tailwind utility classes will provide spacing, color, hover, and focus behavior; no new component or dependency is needed.

## Verification

- Confirm the filing number and Ministry of Industry and Information Technology URL appear in the production bundle.
- Run the project's configured verification commands once at the end of the implementation phase.
- Deploy the built static files to the existing server path and verify the filing number is returned by the live page.
