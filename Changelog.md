# Changelog ProcessCube App SDK

---

## [8.4.0-insiders.2] - 2026-04-20

**Insiders-Vorschauversion** - Für Feedback und Early Testing

### Verbesserungen

- **Single-Branch-Workflow** — Entwicklung findet nur noch auf `main` statt, `develop` Branch wurde entfernt
- **CI/CD verschlankt** — ci_tools entfernt, Version wird aus Git-Tag extrahiert (wie Cuby/Docs), Build+Publish nur noch auf Tag-Pushes

---

## [8.4.0-insiders.1] - 2026-04-20

**Insiders-Vorschauversion** - Für Feedback und Early Testing

### Verbesserungen

- **Single-Branch-Workflow** — Entwicklung findet nur noch auf `main` statt, `develop` Branch wurde entfernt
- **CI/CD vereinfacht** — GitHub Actions und npm-Tag-Logik auf Single-Branch-Workflow angepasst

---

## [8.3.2] - 2026-04-20

_Patch Release — Vollständige ESM-Kompatibilität für Node.js v24._

### Behobene Fehler

- **Node.js Built-in Imports** — Built-in Module (`fs`, `path`, etc.) werden im ESM-Build mit `node:`-Prefix versehen, wie von Node.js v24 im ESM-Kontext vorausgesetzt
- **exports-Map-Erkennung** — Packages mit `exports`-Map (z.B. React, heroicons) werden nicht mehr fälschlich mit `.js`-Extension umgeschrieben
- **ExternalTaskAdapter \_\_dirname-Fix** — `__dirname` ist in ESM-Modulen nicht verfügbar; Fallback über `import.meta.url` ergänzt

---

## [8.3.1] - 2026-04-20

_Patch Release — ESM-Kompatibilität für Node.js v24 und npm-Publish-Fix._

### Behobene Fehler

- **ESM-Imports für Node.js v24** — Bare Subpath-Imports (z.B. `next/headers`) werden im ESM-Build um `.js`-Extension ergänzt, damit Node.js v24 mit strikter ESM-Auflösung diese korrekt finden kann
- **npm publish Tag-Handling** — Semver-gültige Tag-Namen werden bei npm publish korrekt behandelt

---

## [8.3.0] - 2026-04-03

_Stabile Version — Umfassende External Task Dokumentation, Engine Client/SDK Update und Dependency-Aktualisierungen._

### Neue Features

- **Detaillierte External Task Dokumentation** — Umfassende Dokumentation mit Mermaid-Diagrammen (Architektur, Lebenszyklus, IPC-Kommunikation, Fehlerbehandlung) für docs.processcube.io
- **Console-Ausgaben in External Task Handlern sichtbar** — `console.log`-Ausgaben aus External Task Worker Handlern werden an den Parent-Prozess weitergeleitet
- **Verbessertes Logging für External-Task-Clients** — Detailliertere Log-Ausgaben für die Diagnose von External Task Worker Problemen

### Technische Änderungen

- Engine Client aktualisiert: `6.2.1-develop` → `6.3.0-develop.2` (behebt socket.io-parser Vulnerability)
- Engine SDK aktualisiert: `7.1.2` → `7.3.0-develop.2`
- Dependencies auf aktuelle kompatible Versionen aktualisiert (bpmn-js 18.14.0, isomorphic-dompurify 2.36.0, @heroui/react 2.8.10, prettier 3.8.1, esbuild 0.25.12 u.a.)

---

## ✅ Stable v8.2.1 (13.02.2026)

_Stabile Version — External Task Worker Stabilität bei Verbindungsverlust deutlich verbessert._

### Neue Funktionen (gegenüber v8.1.1)

- **External Task Worker Reconnect** — Bei Verbindungsabbrüchen zur Engine versuchen Worker automatisch mit exponentiellem Backoff die Verbindung wiederherzustellen, statt sofort abzustürzen
- Konfigurierbar über Umgebungsvariable `PROCESSCUBE_APP_SDK_ETW_RETRY` (Standard: 6 Versuche)

### Fehlerbehebungen

- **ETW Backoff-Counter korrigiert** — Der Retry-Zähler wurde bei jedem Versuch zurückgesetzt, sodass das exponentielle Backoff nie griff (immer 1s statt 1s→2s→4s→8s→16s→30s)
- **Token-Refresh gibt nicht mehr auf** — Bei Ausfall der Authority retried der Token-Refresh-Zyklus jetzt unbegrenzt mit exponentiellem Backoff, statt nach 10 Sekunden alle Worker zu beenden
- **IPC-Fehler crashen Token-Refresh nicht mehr** — Fehler beim Senden von Identity-Updates an beendete Worker-Prozesse werden jetzt abgefangen
- **App startet auch bei verzögerter Authority** — Initialer Token-Fetch hat jetzt 10 Retry-Versuche mit exponentiellem Backoff
- **Token-Refresh-Zyklus wird bei Worker-Restart wiederhergestellt** — War der Zyklus zuvor gestorben, wird er beim nächsten Adapter-Restart automatisch neu gestartet

### Technische Änderungen

- @5minds/processcube_engine_client auf 6.2.1-develop aktualisiert

---

## ✅ Stable v8.1.1 (11.02.2026)

_Stabile Version — CI/CD-Überarbeitung, Security-Fixes und Bugfixes._

### Neue Funktionen (gegenüber v8.0.2)

- npm-Paket wird jetzt auf **npmjs.org** und **GitHub Packages** veröffentlicht
- **GitHub Releases** werden automatisch bei Stable- und Pre-Releases erstellt

### Fehlerbehebungen

- Verbindung zwischen Engine und App SDK für externe Tasks korrigiert
- Fehlende TypeScript-Deklarationsdateien für 8.x-Kompatibilität wiederhergestellt (#408)
- 7 Sicherheitslücken in Abhängigkeiten behoben (#410)

### Technische Änderungen

- CI/CD-Pipeline überarbeitet: Dual-Publishing auf npmjs.org und GitHub Packages
- Repository-URL auf HTTPS-Format umgestellt
- CLAUDE.md mit Projektdokumentation und Entwicklungsregeln hinzugefügt
- Prettier-Formatierung auf Markdown-Dateien angewendet

---

## ✅ Stable v8.0.2 (10.12.2025)

_Stabile Version — Major-Update mit Node.js 24, ES-Module-Support und neuen Features._

### Neue Funktionen (gegenüber v7.0.0)

- Stable-Release des v8.x-Branches mit allen Verbesserungen aus v7.0.0

### Fehlerbehebungen

- Error-Handling für externe Tasks verbessert (#399)
- ExternalTaskWorkerProcess wird bei Fehlern automatisch neu gestartet

### Technische Änderungen

- Neue Entwicklungsversion für Client-Modul
- Renovate-Konfiguration entfernt

---

## ✅ Stable v7.0.0 (11.11.2025)

_Major-Release mit Breaking Changes: Node.js 24, ES-Module-Unterstützung, Paket-Aktualisierungen._

### Neue Funktionen (gegenüber v6.2.1)

- Heatmap-Visualisierung für Prozessinstanzen (#351)
- Next.js 15 Migration (#336, #353)
- Scope, JTI und Client-ID werden in Claims beibehalten (#325)
- DynamicUI React-Versionscheck angepasst
- Server Actions für ManualTask und UntypedTask hinzugefügt
- Gemeinsame Typen (Common Types) erweitert

### Fehlerbehebungen

- CommonJS/ES-Module-Kompatibilität behoben (#386)
- useInsertion-Bug behoben
- Strikteres JSX-Rendering in DynamicUI korrigiert
- RedirectType-Import korrigiert
- `revalidatePath` und `redirect` werden nicht mehr im selben Aufruf verwendet
- Asynchrone `cookies()` und `headers()` Aufrufe korrigiert (Next.js 15)

### Breaking Changes

- Node.js 24 erforderlich (vorher Node.js 22)
- Paketversionierung auf v8.x angehoben
- CommonJS-Bundling für ES-Module-Kompatibilität umgestellt

---

## ✅ Stable v6.2.1 (19.05.2025)

_Patch-Release mit aktualisierten Engine-Paketen._

### Technische Änderungen

- Stabile Versionen für Engine-Pakete verwendet

---

## ✅ Stable v6.2.0 (17.05.2025)

_Feature-Release mit ProcessInstanceInspector, Dark Mode und vielen Verbesserungen._

### Neue Funktionen (gegenüber v6.1.0)

- **ProcessInstanceInspector** — Vollständige Prozessinstanz-Ansicht mit Token-Inspektion, Retry-Dialog, Kommandopalette und Flow-Node-Navigation
- **Dark Mode** — Unterstützung für ProcessButtonsContainer und TokenInspector
- **RetryDialog** — Erlaubt das Ändern des Start-Tokens bei Retry
- **TerminateProcessButton** — Prozessinstanzen können direkt beendet werden
- **Monaco Editor** — Code-Editor-Integration für Token-Daten
- **Identity-System** — Automatische Identity-Übergabe in SDK-Funktionen
- Ladebildschirm ist anpassbar
- "Keine Ergebnisse"-Meldung ist konfigurierbar
- @heroui/react ersetzt @nextui-org/react (#294)

### Fehlerbehebungen

- SVG-Icons für Refresh und Retry korrigiert (#308)
- Fenstergröße des TokenInspectors angepasst (#306)
- bpmn-js 18 Kompatibilität wiederhergestellt
- Diverse Dependency-Updates (Security-Fixes für next, esbuild, cookie/next-auth)

---

## ✅ Stable v6.1.0 (07.10.2024)

_Feature-Release als Basis für den 2025.1 Release-Zyklus._

---

## Release-Prozess

Features durchlaufen drei Phasen, bevor sie alle Nutzer erreichen:

```
🔮 In Entwicklung  →  🧪 Insiders  →  ✅ Stable
     (Ausblick)        (Early Adopter)    (Alle Nutzer)
```

| Phase                 | Zielgruppe    | Beschreibung                                                                  |
| --------------------- | ------------- | ----------------------------------------------------------------------------- |
| 🔮 **In Entwicklung** | Entwickler    | Ausblick auf kommende Features. Noch in keinem Release enthalten.             |
| 🧪 **Insiders**       | Early Adopter | Vorschau-Versionen zum Testen neuer Features vor dem Stable-Release.          |
| ✅ **Stable**         | Alle Nutzer   | Produktionsreife Version. Features sind vollständig getestet und freigegeben. |

**Hinweis:** Jeder Abschnitt listet nur die Änderungen, die **neu** in dieser Phase sind.
