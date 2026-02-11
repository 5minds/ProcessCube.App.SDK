# Changelog (Entwickler) — ProcessCube App SDK

---

## 🔮 In Entwicklung

_Commits seit v8.0.2_

### Neue Funktionen

- `4a7cff6` CLAUDE.md mit Projektdokumentation und Entwicklungsregeln hinzugefügt

### Fehlerbehebungen

- `48accc6` Fehlende TypeScript-Deklarationsdateien für 8.x-Kompatibilität wiederhergestellt (#408)
- `31af543` Code-Änderungen und Zusammenfassung
- `b6af5a7` 7 Sicherheitslücken via npm audit fix behoben (#410)

### Technische Änderungen

- `af22b9d` Code formatiert
- `195a4ee` Version auf 8.0.5 angehoben
- `813f993` Box-Release entfernt
- `5b79927` Version auf 8.0.4 angehoben
- `cbe3815` Build-Fix
- `6477278` Version auf 8.0.3 angehoben
- `3bb74f4` CI-Build-Fix
- `72c270b` npm-Publish-Fix
- `d459ba0` Prettier-Formatierung auf Markdown-Dateien angewendet
- `c11400b` Changelog und Changelog-Dev für Versionshistorie hinzugefügt

---

## ✅ Stable v8.0.2 (10.12.2025)

_Enthält alle Änderungen seit v7.0.0_

### Fehlerbehebungen

- `8f4295b` Error-Handling für externe Tasks verbessert (#399)
- `397e959` ExternalTaskWorkerProcess bei Fehler neu starten

### Technische Änderungen

- `3444578` Release v8.0.2
- `9d66a91` Stable-Build (#401)
- `e160d26` Renovate entfernt
- `8da746e` Formatierung korrigiert
- `5b66914` Neue Dev-Version für client.ts
- `c82e7f1` Version manuell aktualisiert
- `54c01fe` Unbenutzte Pakete entfernt, next in develop gemerged (#390)
- `d8429f6` Fehlende next-Änderungen auf develop nachgezogen (#388)

### Commits

```
3444578 2025-12-10 Release v8.0.2
9d66a91 2025-12-10 Build stable (#401)
8f4295b 2025-12-05 Fix error handling for external task (#399)
397e959 2025-12-05 restart ExternalTaskWorkerProcess on failure
e160d26 2025-12-02 Remove renovate
8da746e 2025-11-30 Fix format
5b66914 2025-11-30 Update new dev version for client.ts
c82e7f1 2025-11-11 Manually update version to create a new one.
54c01fe 2025-11-11 Remove unused package and Merge next into dev (#390)
d8429f6 2025-11-10 Feature/fix next changes not on dev (#388)
8a8c88d 2025-11-07 chore(deps): update dependency node to v24 (#385)
256e39d 2025-11-07 PCE-2142: Fix CommonJS not working with ES modules (#386)
72494e6 2025-11-05 Update readme to the right node version
ffd7db2 2025-11-04 Add verify and bump version step to pipeline
9cba389 2025-11-03 Add and run linting
38c6f37 2025-11-03 Update version to 8
434d677 2025-11-03 Add some common types
c59751f 2025-11-03 Bundle package that use CommonJS to Work with ES modules
52931eb 2025-10-29 PCE-2142: Update packages (#382)
```

---

## ✅ Stable v7.0.0 (11.11.2025)

_Enthält alle Änderungen seit v6.2.1 — Major-Release_

### Breaking Changes

- Node.js 24 erforderlich
- Paketversionierung auf v8.x
- CommonJS-Bundling für ES-Module-Kompatibilität umgestellt
- Next.js 15 als Mindestversion (Peer Dependency)

### Neue Funktionen

- `4856c14` Heatmap-Visualisierung (#351)
- `8ef9462` Next.js 15 Migration (#336)
- `2cf8b91` Next.js 15 Migration (#353)
- `99b52f0` Scope, JTI und Client-ID in Claims beibehalten (#325)
- `7335f01` Services, Komponenten und Typen für Heatmap hinzugefügt
- `9bbfef9` UI und Services aktualisiert
- `2cf3fc7` DynamicUI React-Versionscheck angepasst
- `9a992b6` PCE-1528 implementiert
- `ae8b088` Strikteres JSX-Rendering in DynamicUI korrigiert
- `a3cb73e` Asynchrone cookies()/headers() Aufrufe (Next.js 15)
- `43fd0e8` Scope, JTI und Client-ID nicht mehr aus Claims entfernt
- `43fd0e8` Initiale Server Actions hinzugefügt

### Fehlerbehebungen

- `bff5429` useInsertion-Bug behoben
- `256e39d` CommonJS/ES-Module-Kompatibilität (#386)
- `5852b80` RedirectType-Import korrigiert
- `7ac511f` React.JSX statt JSX verwendet
- `79f0975` revalidatePath & redirect nicht im selben Aufruf
- `94ccad6` Typ-Fehler behoben
- `a314e12` Typ-Fehler behoben

### Technische Änderungen

- `d21af7e` Release v7.0.0
- `8a8c88d` Node.js 24 Update (#385)
- `38c6f37` Version auf 8 aktualisiert
- `c59751f` CommonJS-Pakete für ES-Module gebündelt
- `52931eb` PCE-2142: Pakete aktualisiert (#382)
- Diverse Dependency-Updates (React 19.2.0, bpmn-js 18.7.0, marked 16.x, uuid 13, TypeScript 5.9.3)

---

## ✅ Stable v6.2.1 (19.05.2025)

### Commits

```
deddace 2025-05-19 Release v6.2.1
10c15ff 2025-05-19 Use stable versions for engine packages
```

---

## ✅ Stable v6.2.0 (17.05.2025)

_Enthält alle Änderungen seit v6.1.0 — Feature-Release_

### Neue Funktionen

- `9025fa1` Identity-System in SDK-Funktionen (#140)
- `32452d4` ProcessInstanceInspector mit Token-Inspektion (#149)
- `52463bf` @heroui/react ersetzt @nextui-org/react (#294)
- `0a24a60` bpmn-js 18 Update
- `a124593` Größen-Button für TokenInspector
- `c6f032b` Dark Mode für ProcessButtonsContainer & TokenInspector
- `1fed5bb` RetryDialog mit Start-Token-Änderung
- `5bc74a8` Ladebildschirm anpassbar
- `fd88a14` Sidepanel-Draft und Monaco-Editor-Integration
- `b9f4ba7` TerminateProcessButton
- `e7683ff` finishManualTask hinzugefügt
- `33b0b2b` finishUntypedTask hinzugefügt
- `f56d8f6` CommandPalette generischer refaktoriert
- `0cf3637` "Keine Ergebnisse"-Meldung anpassbar

### Fehlerbehebungen

- `88f7e35` SVG Refresh und Retry korrigiert (#308)
- `2e1893b` SVGs von Refresh und Retry getauscht
- `9110a78` Beabsichtigtes Verhalten von bpmn-js v17 wiederhergestellt
- `a658325` URL-Parameter beim Schließen des TokenInspectors korrigiert
- `e6f1776` Rendering neuer Tokens korrigiert
- `12afd8e` Aktualisierung der Marker bei nicht mehr existierenden Instanzen

### Technische Änderungen

- `3222fec` CI Tools auf v5 aktualisiert
- `d75c305` Beta-Phase für 2025.1 gestartet
- Security-Fixes: next v14.2.25/v14.2.26, esbuild v0.25.0, cookie/next-auth
- Dependency-Updates: bpmn-js 18.x, marked 15.x, uuid 11.x, TypeScript 5.8.x, prettier 3.4.x, tailwindcss 3.4.x

---

## ✅ Stable v6.1.0 (07.10.2024)

_Basis für den 2025.1 Release-Zyklus._
