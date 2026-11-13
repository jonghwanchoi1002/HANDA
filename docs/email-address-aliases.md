# Gmail email-address aliases

HANDA treats the same local part at `gmail.com` and `googlemail.com` as equivalent for account lookup and duplicate signup detection. Matching is case-insensitive and trims surrounding spaces. New accounts use the `gmail.com` form. Other domains, dots in local parts, and plus tags are not merged or rewritten.

The rule is applied on the server to email signup, sign-in, verification-email requests, password-reset requests, email changes, and new user creation. Verified Google profile emails are resolved before local account lookup. An existing Google provider account ID takes precedence over an email match, and Better Auth's verified-local-email requirement for linking remains enabled.

## Existing records

No migration or automatic account consolidation is performed. Existing addresses, user IDs, approval states, roles, sessions and authored content remain unchanged.

If only one alias exists, either address finds that user. If both aliases already belong to different users, exact-address matching preserves each existing identity. Google sign-in continues to use its bound provider account ID. No password, approval, or admin privileges are transferred between users. Consolidating those existing users is a separate operation requiring a decision about which identity and content to retain.

## Validation

```bash
npm run test:email
npm run test:auth
npm run test:profile
npm run build
```

The alias tests cover canonical signup, duplicate rejection without an email, equivalent sign-in, verification and reset lookup, legacy single-alias records, existing duplicate identities, verified Google email resolution, and bound Google account precedence. Real Google OAuth delivery requires a configured environment; profile resolution is tested locally without Google network access.
