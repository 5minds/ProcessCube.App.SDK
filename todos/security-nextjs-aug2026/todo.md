# Security-Vermerk — Next.js August-2026 Advisories

Bezug: heise/iX-Artikel „Zwei kritische Lücken in Next.js – Remote-Code-Ausführung
unter Windows" (28.08.2026) sowie Vercel August-2026 Security-Release.
Bearbeitet in PR #431.

## Kontext

Vercel hat im August 2026 zwei kritische Next.js-Lücken gepatcht:

1. **CVE-2026-75604 (CVSS 9.0) — RCE unter Windows**
   - Betrifft Next.js-Installationen **auf Windows**, die Pages- und App-Router
     **ohne Cache-Komponente** einsetzen.
   - **Kein Workaround** — nur Update hilft.
   - Betroffen: `next < 15.5.24` und `next < 16.3.3`.
   - Fix: `next@15.5.24` (15.5-Linie) bzw. `next@16.3.3` (16.3-Linie).

2. **AVIF-/libheif-Heap-Overflow (CVSS 9.8)**
   - Buffer Overflow im Heap über `heif_decode_image()` der Bibliothek `libheif`.
   - Trifft Anwendungen, die die AVIF-Bildoptimierung von `next/image` nutzen.

Die von Vercel gehostete Variante ist laut Hersteller nicht betroffen (kein AVIF,
Linux).

## Bewertung für das App-SDK

**CVE-2026-75604 (RCE Windows) — relevant für die gepinnten Lockfiles.**
Das SDK liefert Next.js nicht selbst aus (`next` ist peerDependency), aber die im
Repo gepinnten Lockfiles lagen im verwundbaren Bereich:

- Root `package-lock.json`: `next@16.2.9` → **verwundbar**
- `test-app/package-lock.json`: `next@15.5.12` → **verwundbar**

**AVIF/libheif (CVSS 9.8) — nicht anwendbar.**
Das SDK nutzt keine `next/image`-AVIF-Optimierung; `libheif` ist in keinem
Lockfile vorhanden. Kein Handlungsbedarf.

## Umgesetzte Fixes (Commit `fbb5be9`)

- `peerDependencies.next`: `>=15` → `>=15.5.24 <16.0.0 || >=16.3.3`
  → schließt die verwundbaren Bereiche aus, behält Next-15-Support, kein harter
  Breaking-Change auf `^16`.
- Root `package-lock.json`: `next 16.2.9` → **16.3.3**
- `test-app`: `next ^15.3.0` → `^15.5.24`, Lock `15.5.12` → **15.5.24**

**Verifiziert (Stand PR #431):**

- Root aufgelöst: `next@16.3.3` ✓
- `test-app` aufgelöst: `next@15.5.24` ✓
- Keine `next`-Auflösung unterhalb der Patch-Version mehr in beiden Lockfiles.

## Hinweis für Consumer (SDK-Nutzer)

Da `next` eine **peerDependency** ist, bestimmt die konsumierende Anwendung die
tatsächlich installierte Next.js-Version. Betreiber eigener ProcessCube-Apps
müssen in **ihrem eigenen Projekt** aktualisieren:

```bash
npm install next@15.5.24   # für die 15.5-Linie
# oder
npm install next@16.3.3    # für die 16.3-Linie
```

Besonders dringend, wenn die App **unter Windows** betrieben wird
(Pages/App-Router ohne Cache-Komponente) — dort ist CVE-2026-75604 ohne Update
nicht zu entschärfen.

## Kundenkommunikation

Textbausteine für eine Kundeninformation liegen in
[`kundenmail.md`](./kundenmail.md) — je eine „technische" und eine „nicht so
technische" Variante.

## Status

- [x] Fixes umgesetzt und verifiziert (`fbb5be9`)
- [x] Vermerk in lokaler Dokumentation (diese Datei)
- [x] E-Mail-Textbausteine für Kunden (technisch / nicht-technisch)

## Review

_Wird nach Merge gefüllt._
