# CLAUDE.md - ProcessCube App SDK

## Projektübersicht

`@5minds/processcube_app_sdk` ist ein TypeScript-SDK zur Entwicklung von ProcessCube-Anwendungen mit Next.js. Es stellt React-Komponenten, Server-Funktionen und gemeinsam genutzte Utilities für Prozessvisualisierung (BPMN), dynamische Formulare und die Integration mit der ProcessCube-Engine bereit.

**Paket:** `@5minds/processcube_app_sdk` (v8.x)
**Lizenz:** MIT

## Architektur

Das SDK hat eine **Drei-Schichten-Modulstruktur** mit strikter Trennung:

```
src/
├── common/    → Gemeinsame Typen, Komponenten und Funktionen (Client + Server)
├── server/    → Nur-Server-Code (geschützt durch 'only-server')
└── client/    → Nur-Client React-Komponenten (geschützt durch 'client-only')
```

**Einstiegspunkte** (aus `package.json` exports):
- `@5minds/processcube_app_sdk` → common (gemeinsam)
- `@5minds/processcube_app_sdk/server` → nur Server
- `@5minds/processcube_app_sdk/client` → nur Client

**Build-Ausgabe:** Jedes Modul erzeugt sowohl ESM (`.mjs`) als auch CommonJS (`.cjs`) mit TypeScript-Deklarationen.

## Tech-Stack

- **Sprache:** TypeScript 5.x (strict mode, ES2024 target)
- **Frontend:** React 19, Next.js >=15
- **Auth:** next-auth ~4.24, openid-client
- **Styling:** Tailwind CSS 3.x (Prefix: `app-sdk-`)
- **BPMN:** bpmn-js 18.x, diagram-js
- **UI-Bibliotheken:** @heroui/react, @headlessui/react, @heroicons/react, @monaco-editor/react
- **Build:** esbuild (JS/TS), PostCSS/Tailwind (CSS), tsc (nur Deklarationen)
- **Formatierung:** Prettier (kein Linter konfiguriert)
- **Node.js:** >=24

## Wichtige Befehle

```bash
npm ci                  # Abhängigkeiten installieren (clean)
npm run build           # Development-Build (Code + Types + CSS parallel)
npm run build:prod      # Production-Build (clean + minify + tree-shake)
npm run build:types     # Nur .d.ts-Dateien generieren
npm run watch           # Watch-Modus (alle Build-Prozesse)
npm run format          # Code mit Prettier formatieren
npm run format:check    # Formatierung prüfen ohne Änderungen
npm run clean           # build/-Verzeichnis löschen
```

Es gibt **keine Tests** in diesem Projekt (`npm test` ist ein No-Op).

## Code-Konventionen

### Formatierung (Prettier)
- Einfache Anführungszeichen, Zeilenbreite 120, immer Klammern bei Arrow-Functions
- Import-Reihenfolge: `node:*` → Drittanbieter → `@5minds/*` → relativ (mit Leerzeilen zwischen Gruppen)
- Tailwind-Klassen werden automatisch durch prettier-plugin-tailwindcss sortiert
- CI formatiert automatisch und committet bei Bedarf über `process-engine-ci`

### Benennung
- **PascalCase** für React-Komponenten und Komponentendateien (`ProcessInstanceInspector.tsx`)
- **camelCase** für Funktionen, Variablen und Utility-Dateien (`getIdentity.ts`)
- **kebab-case** für CSS-Dateien neben Komponenten
- Barrel-Exports über `index.ts`-Dateien

### Dateiorganisation
- Komponenten liegen zusammen mit ihrem CSS (`Component.tsx` + `Component.css` im selben Verzeichnis)
- Typen gehören in `types/`-Unterverzeichnisse
- Utilities gehören in `utils/`-Unterverzeichnisse
- Client-Komponenten verwenden die `'use client'`-Direktive
- Server-Code importiert den `'only-server'`-Guard

### Tailwind
- Alle Klassen haben den Prefix `app-sdk-` (konfiguriert in `tailwind.config.js`)
- Eigene Farben: `5minds-orange`, `app-sdk-gray`-Skala
- Dark Mode über Class-Strategie (`[class~='dark']`)
- Forms-Plugin mit `class`-Strategie (nicht global)

## Build-System

Der Build verwendet **esbuild** (nicht tsc) für JavaScript/TypeScript-Kompilierung:

- `build.js` — esbuild-Konfiguration für JS/TS (ESM + CJS Dual-Output)
- `build-css.cjs` — esbuild + PostCSS/Tailwind für CSS
- `tsc` wird nur für die Generierung von `.d.ts`-Deklarationsdateien verwendet
- Das Common-Modul ist in Server/Client-Builds als `external` markiert, um Duplikation zu vermeiden
- BPMN-Bibliotheken (bpmn-js, diagram-js) werden gebündelt; chokidar/fsevents sind ausgeschlossen

## Git-Workflow

### Branches
- `develop` — primärer Entwicklungsbranch (aktueller Default)
- `next` — Alpha/Pre-Release-Kanal (npm-Tag: `next`)
- `main` — stabile Releases
- `release/**` — Release-Branches

### CI/CD (GitHub Actions)
1. **Verify-Job:** Installieren, formatieren, Formatierungsänderungen automatisch committen
2. **Build & Publish-Job:** Versionsvorbereitung über `@5minds/product_ci_tools`, Build, Veröffentlichung auf npm mit branchbasierten Tags
- Versionen werden automatisch durch CI-Tools verwaltet (`ci_tools prepare-version`)
- Versionen in `package.json` **nicht** manuell hochsetzen

### PR-Template
PRs verwenden ein deutschsprachiges Template mit Abschnitten für Beschreibung, verwandte Issues, Tests und Dokumentation.

## Wichtige Komponenten

### Client (`src/client/`)
- **ProcessInstanceInspector** — Hauptansicht für Prozessinstanzen mit Token-Inspektion, Retry, Kommandopalette
- **BPMNViewer / bpmnViewerComponent** — BPMN-Diagramm-Rendering und -Interaktion
- **DynamicUi** — Dynamischer Formular-Builder aus Prozess-Engine-Schemas
- **ProcessModelInspector** — Prozessmodell-Übersicht
- **HeatmapInspector** — Heatmap-Visualisierung für Prozesskennzahlen
- **DocumentationViewer** — Markdown-Dokumentationsrenderer
- **SplitterLayout** — Größenveränderbare Panel-Layouts

### Server (`src/server/`)
- **Server Actions** — Next.js Server Actions für UserTask, ProcessInstance, ManualTask, Navigation, UntypedTask
- **EngineClient** — Interner ProcessCube-Engine-Client-Wrapper
- **ExternalTaskAdapter / ExternalTaskWorkerProcess** — Integration externer Task-Worker
- **withApplicationSDK** — Next.js-Plugin zur SDK-Einrichtung
- **getIdentity / getEngineClient** — Auth- und Engine-Client-Hilfsfunktionen

### Common (`src/common/`)
- **Types** — UserTaskInstance, HeatmapTypes, IPCMessageType
- **RemoteUserTask** — Gemeinsame Komponente für Remote-UserTask-Rendering
- **hasClaim** — Autorisierungs-Hilfsfunktion

## Wichtige Hinweise

- Das SDK wird von Next.js-Apps als npm-Abhängigkeit konsumiert
- Für lokale Entwicklung `npm link` zum Testen in Consumer-Apps verwenden (siehe README.md)
- Das `prepare`-Script führt `build:prod` bei `npm install` aus, daher erfolgt der Build automatisch
- CSS-Dateien werden separat bereitgestellt und müssen von Consumern importiert werden: `@5minds/processcube_app_sdk/client/components/*.css`


## Claude Regeln

### Arbeitsablauf

1. **Analyse & Planung**
   - Durchdenke das Problem gründlich
   - Lies die relevanten Dateien der Codebasis
   - Erstelle einen Plan in `todos/<thema>/todo.md`
   - todos sollen auch immer commited werden

2. **Aufgabenliste**
   - Der Plan enthält eine Liste von Todo-Punkten
   - Hake sie beim Abarbeiten ab

3. **Abstimmung**
   - Bevor du beginnst, stimme dich mit mir ab
   - Ich prüfe den Plan

4. **Umsetzung**
   - Arbeite die Todo-Punkte ab
   - Markiere erledigte Aufgaben

5. **Kommunikation**
   - Gib bei jedem Schritt eine kurze Zusammenfassung der Änderungen

6. **Einfachheit**
   - Halte jede Aufgabe und Codeänderung so einfach wie möglich
   - Vermeide umfangreiche oder komplexe Änderungen
   - Jede Änderung soll so wenig Code wie möglich betreffen
   - Einfachheit ist das oberste Prinzip

7. **Review**
   - Füge am Ende einen Review-Abschnitt in `todos/<thema>/todo.md` hinzu
   - Fasse die Änderungen und relevante Informationen zusammen

### Grundsätze

- **Keine Faulheit.** Du bist ein Senior Developer. Finde bei Bugs die Ursache und behebe sie richtig. Keine temporären Fixes.

- **Maximale Einfachheit.** Alle Änderungen betreffen nur den notwendigen Code. Das Ziel ist, keine neuen Bugs einzuführen. Einfachheit über alles.

- **Dateiberechtigungen.** Neue Dateien müssen für Gruppe und andere lesbar sein. Nach dem Erstellen von Dateien: `chmod go+r <datei>`. Bei Verzeichnissen zusätzlich: `chmod go+x <verzeichnis>`.

- **Kein automatisches Commit/Push.** Niemals selbstständig committen oder pushen. Nur auf explizite Anweisung des Benutzers.
