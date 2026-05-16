# Security-Audit — React Server Components RCE (CVE-2025-55182)

## Kontext

- React Blog 03.12.2025: kritische RCE in React Server Components Deserialisierung.
- **CVE-2025-55182** (CVSS 10.0), zusätzlich CVE-2025-55183 / 55184 / 67779 / 2026-23864 (DoS, Source Code Exposure).
- Vulnerable: alle Next.js ≥ 13.3 (bis vor den Patches), `react-server-dom-*` 19.0 – 19.2.0.
- Patches u.a.: Next.js 15.5.10, 15.4.11, 15.3.9, 15.2.9, 15.1.12, 15.0.8, 14.2.35, 16.0.11, 16.1.5; React 19.0.1 / 19.1.2 / 19.2.1.
- Angriff: ein **unauthentifizierter** HTTP-Request an einen Server-Function-Endpunkt → RCE beim Deserialisieren. Apps sind potenziell auch dann betroffen, wenn sie Server Functions nicht explizit benutzen, solange der Framework-/Bundler-Pfad RSC unterstützt.

## SDK-spezifischer Befund (Stand v8.6.2)

- `package.json` peerDependencies:
  - `next`: `>=15` — **zu offen**, erlaubt 15.0.0 – 15.5.9 (alle verwundbar).
  - `react`: `^19.1.0` — erlaubt 19.1.0 / 19.1.1 / 19.2.0 (verwundbar).
  - `react-dom`: `^19.1.0` (deps) — analog.
- SDK liefert Server Actions (`src/server/server-actions/*Actions.ts`) und einen `withApplicationSDK`-Plugin → läuft im RSC-/Server-Function-Kontext der Consumer-App.
- SDK ist selbst kein Next.js-Host, das eigentliche Patch-Ziel liegt **beim Consumer**. Wir können aber:
  1. peerDeps so verschärfen, dass Consumer durch `npm install` auf gepatchte Versionen gedrückt werden,
  2. Risiko gegenüber Consumern dokumentieren,
  3. SDK-Server-Code auf gefährliche Patterns (unsichere Deserialisierung, ungeschützte Server Actions, fehlende Auth-Checks) prüfen.

## To-Dos

- [ ] **A1** — Vollständigen `npm`/`gh`-Snapshot der Repo-Sicherheitslage erfassen (Branch, dirty files, Tags).
- [ ] **A2** — Tatsächliche aufgelöste Versionen prüfen: `npm ls react react-dom react-server-dom-webpack next` im Repo und im `test-app/`.
- [ ] **A3** — `npm audit` und `npm audit --omit=dev` laufen lassen (Repo + `test-app/`), Ergebnis dokumentieren.
- [ ] **A4** — `gh`-Check: offene Dependabot/Security-Advisories (Dependabot ist laut CLAUDE.md deaktiviert — also nur Best-Effort über `gh api`).
- [ ] **A5** — SDK Server Actions auditieren (`src/server/server-actions/*`, `src/server/actions.ts`):
  - Werden Inputs `JSON.parse`/`eval`/`Function`/`vm.runIn*` deserialisiert?
  - Hängt jede Action an `getIdentity()` / Auth-Guard?
  - Werden Parameter unvalidiert in Engine-Calls weitergereicht?
- [ ] **A6** — `src/server/plugin/withApplicationSDK.ts` prüfen: setzt sie eigene Routen, Webhooks oder API-Handler im Next-Lifecycle?
- [ ] **A7** — Client-/Common-Code grob auf unsichere Patterns prüfen (DOMPurify-Nutzung, `dangerouslySetInnerHTML`, `marked` ohne Sanitizer, Monaco-Eval-Pfade).
- [ ] **A8** — `security-review`-Skill auf den aktuellen Branch anwenden (Skill ist als User-Skill verfügbar — der Benutzer muss `/security-review` triggern, ich kann den Skill nicht selbst aufrufen). Alternativ: manueller Review-Bericht in `todos/security-audit-rsc/report.md`.
- [ ] **F1** — `peerDependencies` schärfen:
  - `next: ">=15.5.10 <16 || ^16.0.11 || ^16.1.5"` (oder vergleichbar — Variante mit dem Benutzer abstimmen).
  - `react: ">=19.0.1 <19.1.0 || >=19.1.2 <19.2.0 || >=19.2.1"` — analog für `react-dom`.
- [ ] **F2** — `dependencies.react-dom` und `react-is` an gepatchte Mindestversionen anziehen.
- [ ] **F3** — README / SECURITY-Hinweis: Security-Advisory-Abschnitt mit CVE, Patch-Matrix, Upgrade-Befehlen für Consumer.
- [ ] **F4** — `test-app/`-Versionen prüfen und ggf. anheben.
- [ ] **F5** — Optionales `SECURITY.md` auf Repo-Root (Disclosure-Policy + dieser CVE).

## Open Questions an den Benutzer

1. Soll Next.js 14 noch im Support-Korridor bleiben oder darf die peerDependency hart auf `>=15.5.10` gehoben werden? (CLAUDE.md sagt aktuell `next: >=15` → ich würde nur die Untergrenze nach oben ziehen, ohne 14 zuzulassen.)
2. Soll Major-Range `next@16` weiterhin erlaubt sein? Falls ja: `^16.0.11 || ^16.1.5` aufnehmen.
3. Soll der Hinweis in `README.md` oder in einer separaten `SECURITY.md` landen?
4. `security-review`-Skill: möchtest du ihn selbst triggern (`/security-review`), oder reicht ein manueller Audit-Bericht hier in `todos/`?
5. Sind in der Realität nur SDK-Konsumenten mit gehosteten Next-Apps relevant, oder gibt es interne Deployments, die wir aktiv informieren müssen (Nutzerliste / Distribution)?

## Review

_Wird nach Umsetzung gefüllt._
