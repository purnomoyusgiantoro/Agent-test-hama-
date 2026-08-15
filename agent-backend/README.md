# Agent Backend

This is the backend API for the Agent project, built with [Hono](https://hono.dev/) and designed to run on Cloudflare Workers.

## Requirements
- Node.js

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Generate/synchronize types based on your Worker configuration:
   ```bash
   npm run cf-typegen
   ```

4. Deploy to Cloudflare Workers:
   ```bash
   npm run deploy
   ```

## Tech Stack
- [Hono](https://hono.dev/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [TypeScript](https://www.typescriptlang.org/)
