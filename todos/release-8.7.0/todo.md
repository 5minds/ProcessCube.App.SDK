# Release 8.7.0 — Next.js-Security + Auth-Doku

Unreleased seit `v8.6.3` (22.06.2026): 10 Commits, zwei Themen
(PR #431 Security, PR #430 Auth-Doku).

## Warum Minor (8.7.0) statt Patch (8.6.4)

`peerDependencies.next` wurde von `>=15` auf `>=15.5.24 <16.0.0 || >=16.3.3`
verschärft. Consumer mit `next < 15.5.24` bzw. `16.0.0–16.3.2` bekommen dadurch
beim Installieren einen Peer-Konflikt — das ist für sie eine spürbare Änderung
und gehört nicht in einen Patch-Release.

## Todos

- [x] Changelog.md — Eintrag `[8.7.0]` (Anwendersicht)
- [x] Changelog-Dev.md — Eintrag `Stable v8.7.0` (Commit-Ebene)
- [ ] Release über den `release-process`-Skill fahren (Stable, Branch `main`)
- [ ] Review-Abschnitt füllen

## Inhalt des Releases

### Sicherheit (PR #431, `fbb5be9`)

- CVE-2026-75604 (CVSS 9.0, RCE unter Windows) — Next.js < 15.5.24 / < 16.3.3
- `peerDependencies.next`: `>=15` → `>=15.5.24 <16.0.0 || >=16.3.3`
- Root-Lock: `next` 16.2.9 → 16.3.3
- `test-app`: `next` `^15.3.0` → `^15.5.24`, Lock 15.5.12 → 15.5.24
- AVIF/libheif (CVSS 9.8) als nicht zutreffend bewertet (kein `next/image`-AVIF,
  kein `libheif` in den Lockfiles)
- Details: [`todos/security-nextjs-aug2026/todo.md`](../security-nextjs-aug2026/todo.md)

### Dokumentation (PR #430, `d466698`)

- README: manueller Logout (NextAuth `signOut` + föderierter Logout),
  Zwei-Ebenen-Sessionmodell, Troubleshooting-Tabelle zu Authority-Fehlern,
  Erkennung von `RefreshAccessTokenError`
- `AGENTS.md` als Quelle für `CLAUDE.md` (Symlink, `04d42e3`)

## Review

_Wird nach dem Release gefüllt._
