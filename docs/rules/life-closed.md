# LIFE is closed to the public

Owner, 24.11.2026: close LIFE to the public in FAN LIFE and THE WORKER, Coming soon everywhere, nobody enters but the admin through a dedicated link.

- `middleware.ts` rewrites every LIFE page (`/life`, `/life/**` pages and HTML, `/qa/life-*`) to `/coming-soon` unless the request carries the owner's cookie. The list is `lib/owner/paths.ts`; shared assets stay open.
- `app/life/layout.tsx` locks it again on the server. The tunnel plate on the wall says Coming soon.
- The owner's door is `/owner`: he types the FAN LIFE admin key (`FAN_LIFE_ADMIN_KEY`, passed to this service by FAN LIFE's deploy) and gets the same signed cookie the control room issues, then lands in LIFE.
- Opening LIFE is a code change on the owner's word.
