# Changelog (Entwickler) — ProcessCube App SDK

---

## 🔮 In Entwicklung

_Commits seit v8.2.1_

### Neue Funktionen

- `15627ff` stdio inherit für ETW-Child-Prozesse — `console.log` aus External Task Handlern wird an den Parent-Prozess weitergeleitet
- `65d7976` Besseres Logging für die External-Task-Clients

### Technische Änderungen

- `d520d1c` bugs URL und homepage in package.json aktualisiert
- `391dffc` Fix readme
- `15627ff` Testprozess (BoundaryEvent.bpmn) und Testbericht für Abort bei Timer Boundary Events hinzugefügt

### Commits

```
3b2b8c8 2026-02-13 Merge branch 'develop'
65d7976 2026-02-13 Besseres Logging für die External-Task-Clients
15627ff 2026-02-13 Add stdio inherit for ETW child processes and boundary event abort test
7169ad2 2026-02-13 Fix package-lock.json
d520d1c 2026-02-13 Update bugs URL and homepage in package.json
695c778 2026-02-13 Inc Version
391dffc 2026-02-13 Fix readme
```

---

## ✅ Stable v8.2.1 (13.02.2026)

_Enthält alle Änderungen seit v8.1.1 — ETW Stabilität bei Verbindungsverlust._

### Neue Funktionen

- `4b9243c` External Task Worker Reconnect mit exponentiellem Backoff bei Connection-Fehlern (ECONNREFUSED, ECONNRESET, ETIMEDOUT etc.)
- Worker-intern: max 6 Retries mit Backoff 1s→2s→4s→...→30s (konfigurierbar via `PROCESSCUBE_APP_SDK_ETW_RETRY`)
- Adapter: Restart-Backoff 1s→2s→4s→...→30s, max 6 Versuche in 5 Min statt 3 in 1 Min

### Fehlerbehebungen

- `6eab310` Fix connectionRetryCount-Bug: Counter wurde bei jedem `create()`-Aufruf synchron auf 0 zurückgesetzt, bevor der Error-Callback feuerte — Backoff war immer 1s statt exponentiell
- `6eab310` Token-Refresh-Zyklus retried jetzt unbegrenzt mit exponentiellem Backoff (bis 60s) statt nach 5×2s alle Worker zu killen
- `6eab310` IPC `send()` im Token-Refresh mit try/catch umgeben — disconnected Worker crashen den Zyklus nicht mehr
- `6eab310` Initialer Token-Fetch (`getFreshTokenSetWithRetry`) mit 10 Versuchen und exponentiellem Backoff (bis 30s)
- `6eab310` `externalTaskWorker.start()` mit try/catch umgeben — synchrone Fehler triggern jetzt Reconnect
- `6eab310` Token-Refresh-Zyklus wird bei Adapter-Restart wiederhergestellt falls inaktiv (`refreshCycleActive`-Flag)
- `05a526e` Nachbesserung ETW Stabilität

### Technische Änderungen

- `588ad7a` @5minds/processcube_engine_client auf 6.2.1-develop-ca239b aktualisiert
- `a5222fb` Version auf 8.2.1 angehoben
- `a1c1d71` test-app/.env zu .gitignore hinzugefügt, Workflow-Formatierung korrigiert

### Commits

```
dfba71e 2026-02-13 Release v8.2.1
391dffc 2026-02-13 Fix readme
05a526e 2026-02-13 Fix ETW stability
a1c1d71 2026-02-13 Add test-app/.env to gitignore, fix workflow formatting
a5222fb 2026-02-13 Bump version to 8.2.1, update Changelogs
6eab310 2026-02-13 Fix ETW reconnect: backoff counter bug, token refresh resilience
94814cf 2026-02-13 Add analysis and plan for ETW stability improvements
97e5a9a 2026-02-13 add demo app
1888b8b 2026-02-12 Bump version to 8.2.0
4b9243c 2026-02-12 Add ETW reconnect with exponential backoff on connection errors
588ad7a 2026-02-12 Update @5minds/processcube_engine_client to 6.2.1-develop-ca239b-mlju3ron
```

---

## ✅ Stable v8.1.1 (11.02.2026)

_Enthält alle Änderungen seit v8.0.2 — CI/CD-Überarbeitung, Security-Fixes und Bugfixes._

### Neue Funktionen

- `992c386` GitHub Packages Publishing und GitHub Release-Erstellung hinzugefügt
- `a1aab28` ci_tools publish durch dedizierte npm publish Steps ersetzt
- `4a7cff6` CLAUDE.md mit Projektdokumentation und Entwicklungsregeln hinzugefügt

### Fehlerbehebungen

- `99811ec` Verbindung Engine <-> App SDK für externe Tasks korrigiert
- `48accc6` Fehlende TypeScript-Deklarationsdateien für 8.x-Kompatibilität wiederhergestellt (#408)
- `31af543` Code-Änderungen und Zusammenfassung
- `b6af5a7` 7 Sicherheitslücken via npm audit fix behoben (#410)

### Technische Änderungen

- `896b5d9` NPM_TOKEN für npmjs.org Auth verwendet
- `876b387` NODE_AUTH_TOKEN zu NODE_AUTH_TOKEN_PROCESSCUBE_IO umbenannt
- `597ae09` Repository-URL in package.json auf HTTPS geändert
- `cfa1eb5` .npmrc zu .gitignore hinzugefügt, Push-Refspec korrigiert
- `1388fe5` GH_TOKEN PAT für Verify-Job (Branch Protection)
- `b5f72f2` Korrektes Org-Secret NODE_AUTH_TOKEN verwendet
- `20a35ac` @5minds Registry zur Laufzeit konfiguriert
- `c55f6d7` .npmrc aus Repository entfernt
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

### Commits

```
ca78cbd 2026-02-11 Release v8.1.1
43a8cca 2026-02-11 Update Changelog and Changelog-Dev with CI/CD publishing changes
2f89987 2026-02-11 fix publish to npmjs.orf
896b5d9 2026-02-11 Use NPM_TOKEN for npmjs.org auth instead of OIDC
4590ba3 2026-02-11 Add npmjs.org registry and auth token to project .npmrc
c5902db 2026-02-11 Fix: remove NODE_AUTH_TOKEN from CI tools, rename GitHub Packages token
876b387 2026-02-11 Rename NODE_AUTH_TOKEN to NODE_AUTH_TOKEN_PROCESSCUBE_IO for marketplace
597ae09 2026-02-11 Fix OIDC Trusted Publisher: remove registry-url from setup-node
a1aab28 2026-02-11 Replace ci_tools publish with dedicated npm publish steps
1388fe5 2026-02-11 Fix CI: use GH_TOKEN PAT for verify job to bypass branch protection
cfa1eb5 2026-02-11 Fix CI: add .npmrc to .gitignore and fix push refspec
b5f72f2 2026-02-11 Fix CI: use correct org secret name NODE_AUTH_TOKEN
20a35ac 2026-02-11 Fix CI: configure @5minds registry at runtime in both jobs
c55f6d7 2026-02-11 Remove .npmrc
992c386 2026-02-11 Add GitHub Packages publishing and GitHub Release creation
99811ec 2026-02-11 Fix connection engine <-> app sdk for external tasks
b6af5a7 2026-02-09 Fix 7 security vulnerabilities via npm audit fix (#410)
d459ba0 2026-02-06 style: apply prettier formatting to markdown files
7556719 2026-02-06 Fix 7 security vulnerabilities via npm audit fix
c11400b 2026-02-06 Add Changelog and Changelog-Dev for version history
4a7cff6 2026-02-06 Add CLAUDE.md with project documentation and development rules
48accc6 2026-01-29 Restore missing TypeScript declaration files for 8.x compatibility (#408)
af22b9d 2026-01-28 format code
31af543 2026-01-28 Die Änderungen sind fertig
195a4ee 2025-12-10 bump version to 8.0.5
813f993 2025-12-10 remove box relase
5b79927 2025-12-10 bump version to 8.0.4
cbe3815 2025-12-10 fix build
6477278 2025-12-10 bump version to 8.0.3
3bb74f4 2025-12-10 fix ci build
72c270b 2025-12-10 fix npm publish
```

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
