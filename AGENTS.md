# Coding Guidelines

# Comment is not required, only if very complicated methods/component that requirest explanation
# No emojis in code

# Codebase Structure

## Backend (`backend/`)
- Node.js Express server (`src/server.ts`).
- Exposes `POST /api/research` which implements the AI Deep Research logic using OpenAI/DeepSeek.
- Core logic is in `src/deepResearchService.ts`.

## Frontend (`frontend/`)
- React SPA built with Vite and TypeScript.
- Uses Tailwind CSS (v4) for styling and theming, incorporating a premium dual-tone aesthetic.
- Components leverage Ant Design for robust UI elements natively spaced and colored.
- Uses `@tanstack/react-query` for API data fetching inside `src/api.ts` and `src/App.tsx`.