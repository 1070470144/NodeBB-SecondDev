# NodeBB-SecondDev Development Guidelines

Auto-generated from feature plans. Last updated: 2026-03-04

## Active Technologies

- JavaScript (Node.js >= 20) + NodeBB core (Express 4, Benchpress, socket.io) (002-script-management)

## Project Structure

```text
src/                    # NodeBB server (controllers/routes/services)
public/                 # Client assets (templates, client JS, SCSS)
specs/                  # Spec-driven development artifacts
```

## Commands

- npm test
- npm run lint

## Code Style

- JavaScript: follow repository ESLint configuration (`eslint.config.mjs`)
- Prefer NodeBB patterns: thin controllers, logic in `src/**` modules

## Recent Changes

- 002-script-management: Added scripts feature plan/design artifacts

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
