# Rules for AI Code Changes

## Verification Requirements

After any code change, run ALL of these commands. All must pass with 0 failures:

```bash
npm ci
npm test
npm run build
```

**Note on Tests:**
- Some tests require real API credentials (Offerwall.me, BitcoTasks). These can be skipped in local development but should pass in CI with proper env vars.
- All other tests must pass with 0 failures.
- Do not ignore test failures - either fix them or document why they require specific credentials.

## Environment Variables

- Env variable names in code must match the Vercel names exactly. Do not rename them.
- Never change env var names without explicit approval.
- Check .env.example for canonical names.

## Database Rules

### quest_step_credits Table

- `step_index` must be greater than 0. Steps are 1-based. Never insert 0.
- `metadata` must never be null. Pass `{}` if no metadata needed.

### wallet_apply Function

- `p_reference_id` must be a uuid or null, never a string like "quest_step_...".
- Put readable text in `p_description` instead.

## Quest Implementation Rules

### Feed Quests

- Feed quests (feed_ptc, feed_shortlink, feed_article) have their own flow.
- Feed quests must NOT go through `runAd`, `runShortlink`, or the generic `startQuest`.
- Use feed-specific functions only.

### Feed Quest API Returns

- `startFeedQuest` returns `{ sessionId }`. Read `.sessionId`, not `.id`.
- `openFeedQuestStep` returns `{ url }`. If url is missing, show an error. Do not open undefined.

## Error Handling

- Every client mutation must show `err.message` in a toast and call `console.error(err)`.
- No silent failures allowed.
- User must see error messages for all failures.

## Git Workflow

- Work on a feature branch only. Never push to main.
- Branch naming: `feature/description` or `fix/description`.
- Only merge to main via PR or after explicit approval.

## Code Quality

- TypeScript strict mode must pass (npm run typecheck).
- All tests must pass (npm test).
- Build must succeed (npm run build).
- Fix linting errors if they appear.

## When Making Changes

1. Create feature branch
2. Make changes
3. Run full verification suite (npm ci, typecheck, test, build)
4. Fix all failures
5. Commit with clear message
6. Push to feature branch
7. Request review/approval before merging
