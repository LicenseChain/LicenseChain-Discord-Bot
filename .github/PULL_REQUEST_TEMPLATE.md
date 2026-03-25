## Summary

<!-- What changed (commands, client, handlers). -->

## Related issue

Closes #____

## API alignment

- [ ] Uses `POST /v1/licenses/verify` with body field `key` (and optional `hardwareId` / `hwuid` per API).
- [ ] Errors from API are not hidden behind fake data (e.g. no fabricated app on 401).

## Vendored API helper

- [ ] If editing `src/client/licensechainApiNormalize.js`: apply the same change to `LicenseChain-TG-Bot` and update `api/src/contracts/bot-license-contracts.ts` + tests if shapes change.

## Verification

- [ ] Smoke test: validate / license command against staging API.
- [ ] `npm test` or CI green.
