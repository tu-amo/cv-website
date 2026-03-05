---
description: how to publish / deploy the site to production
---

## Publishing workflow

All changes should be kept local until the user explicitly confirms they are ready to publish.

1. Make and verify changes locally using `npm run dev` (already running at `localhost:5173`)
2. Show the user a browser preview or summary of what changed
3. **Wait for explicit user confirmation** ("go ahead", "publish", "push it", etc.) before proceeding
4. Once confirmed, stage and commit:
   ```
   git add <changed files>
   git commit -m "<descriptive message>"
   ```
5. Push to origin:
   ```
   git push origin main
   ```
6. Confirm push succeeded and deployment is live
