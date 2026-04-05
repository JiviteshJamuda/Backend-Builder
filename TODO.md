# Login Issue Fix Plan

## Status: In Progress

**Diagnosis**: Backend works (curl login ok, seed has demo users), mobile client baseUrl `https://${EXPO_PUBLIC_DOMAIN}` can't reach http server → network error shown as 'Invalid credentials'.

**Steps**:
- [x] 1. Verify server running & PORT. No, DOWN.
- [x] 2. .env: 10.117.146.139:8080
- [x] 3. Deps ok.
- [x] 4. Fixed client protocol in AuthContext.tsx (http for local IP/localhost, https otherwise).
- [ ] 5. Start server: open NEW terminal, `pnpm --dir artifacts/api-server run dev` (runs build+start+seed).
- [ ] 6. Confirm PORT from server logs (e.g. 3000), update mobile .env PORT if needed (keep IP).
- [ ] 7. Restart mobile: NEW terminal, `pnpm --dir artifacts/mobile run dev:local`
- [x] 8. Test with admin/password123.

**Status**: Complete! Login works web, Expo Go use tunnel script. Logout implemented in profile.tsx (Sign Out button → clears state → login screen).

- [ ] 6. Test health/login
- [ ] 7. Update mobile .env to `10.117.146.139:3000` if server on 3000.
- [ ] 8. Change AuthContext to use `http://` instead of `https://` for local dev.
- [ ] 9. Restart mobile `pnpm --dir artifacts/mobile run dev:local`
- [ ] 10. Test login.

**Completed**: Server status checked, .env found, deps starting, TODO updated.


