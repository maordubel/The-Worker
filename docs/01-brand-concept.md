# The Worker — Brand Concept

Run before any UI. Tokens live in `app/globals.css`, mapped in `tailwind.config.ts`.
Nothing in the codebase uses a raw hex or an ad-hoc px.

## 1. The idea

- **What it is** — a Hebrew game about the history of Hapoel Tel Aviv: trivia, historical lineups, memory, kits.
- **Who looks at it** — Hapoel fans, on a phone, in downtime. Proud, tribal, and genuinely knowledgeable. They will catch a wrong fact instantly.
- **The feeling** — *earned pride in an archive*. Not hype. The dignity of a workers' club that has been losing and winning for a hundred years.
- **The anti-target** — the default sports app: navy-to-black gradient, neon FIFA card UI, green pitch texture, glassmorphism, esports lettering. Rejected outright.

## 2. Territory

**Archival letterpress — red ink on newsprint.**

Hapoel is *the workers' club*. Its real visual heritage is not modern sportswear, it is Hebrew labour-movement print: 1930s–50s letterpress, matchday programmes, union posters, cheap cream stock, one red plate over black type, stamped serial numbers. That heritage is specific to this club and could not be borrowed by any other football game. The product is an archive, so it should look like one — printed, not rendered.

## 3. The system

### Palette

| Token | Light | Dark | Role |
|---|---|---|---|
| `paper` | `#F4EDE1` | `#14110F` | newsprint stock |
| `paper-2` | `#E8DFCF` | `#201B18` | card / programme surface |
| `paper-3` | `#D6CBB8` | `#2E2722` | pressed state |
| `ink` | `#171310` | `#EFE6D8` | warm press black — not pure black |
| `muted` | `#6B6055` | `#9A8E80` | secondary text |
| `red` | `#D1121F` | `#F2564C` | the club, the red plate |
| `red-deep` | `#8E1116` | `#BE342C` | second pass / wrong answer |
| `ochre` | `#B4802A` | `#D6A552` | trophies, highlights |
| `verified` | `#2F6B4F` | `#6AB38A` | verified fact / correct answer |

Contrast, measured: ink on paper **15.4:1**; red on paper **4.74:1** (AA body ✓); dark red on dark paper **5.61:1** (AA body ✓). Nothing relies on colour alone — correct/wrong also carry a mark and text.

### Typography

- **Display — Frank Ruhl Libre** (700 / 900). The Hebrew newspaper serif. It carries the archive idea in the letterforms themselves rather than in decoration.
- **Body — Heebo** (400 / 500 / 700). A clean grotesque, deliberately a different voice from the serif.
- Two faces only. Numerals use Frank Ruhl Libre Black with `tabular-nums` — scores and shirt numbers read as stamped type, no third font required.
- Scale is a 1.2 ratio, `step--1` … `step-5`, defined once in the theme.

### Geometry

Sharp. **Radius 0** on every surface — printed paper has no rounded corners; only interactive chips get 2px. Separation comes from paper tone and ink rules (1px hairline, 1.5px rule, 3px red plate rule), **never from shadows**. There is no shadow token in this system, deliberately.

### Signature motif

Carried on every screen, three layers:

1. **Misregistration.** The red plate prints 1.5px out of alignment with the black. `.plate-offset` on display headings; pressed states shift the same way. This is the single element that makes the product recognisable.
2. **Perforation.** Ticket-stub dashed rules divide every section and every card header (`.perforated-b`).
3. **Halftone stock.** A 4px dot grain on the paper, at 6% ink.

Every card is a **programme ticket** with a stamped serial number in red (`components/ui/Ticket.tsx`).

### Motion

Mechanical, not bouncy. `90ms` press, `160ms` plate shift, `cubic-bezier(0.2, 0, 0, 1)`. No page transitions. `prefers-reduced-motion` is honoured globally in `globals.css`.

## 4. Defaults rejected

Stock blue and the purple→blue gradient · rounded cards · drop shadows and glassmorphism · a green pitch background · system-ui headlines · neon score cards · emoji as UI · one scaled layout for all screens.

## Verification

The concept is *archival letterpress*: an interface printed in two plates — warm press black and Hapoel red — on newsprint stock, where every unit of content is a matchday programme ticket with a stamped serial, and the red plate is deliberately 1.5px out of register. It is specific to a hundred-year-old workers' club with a print heritage, and it would be wrong for any other product.

Handoff: `responsive-qa` — verified at 320 / 390 / 430 / 768 / 1440, no horizontal overflow at any width, RTL confirmed.
