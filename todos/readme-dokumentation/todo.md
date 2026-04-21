# README.md Dokumentation — Umfassende Erweiterung

## Analyse

### Ist-Zustand README.md

| Abschnitt                           | Umfang        | Qualität                                                              |
| ----------------------------------- | ------------- | --------------------------------------------------------------------- |
| Installation                        | 3 Zeilen      | Minimal, OK                                                           |
| Drei Exports (Common/Server/Client) | Je 3-5 Zeilen | Nur je 1 Import-Beispiel, keine API-Details                           |
| External Tasks                      | ~350 Zeilen   | Sehr gut — Architektur, Sequenzdiagramme, Fehlerbehandlung, Beispiele |
| Projektsetup (Entwickler)           | ~30 Zeilen    | Knapp aber ausreichend                                                |

### Ist-Zustand docs.processcube.io/app-sdk

Die Online-Doku hat bereits diese Seitenstruktur:

```
AppSDK
├── App-SDK (Übersicht)
├── Getting Started
├── Configuration
│   ├── Configuration (Übersicht)
│   ├── Environment Variables
│   └── Plugin System
├── Components
│   ├── Components (Übersicht)
│   ├── RemoteUserTask
│   └── SplitterLayout
├── Functions
├── External Tasks
│   ├── External Tasks (Übersicht)
│   ├── Handler entwickeln
│   ├── Konfiguration
│   └── Erweiterte Konzepte
└── Examples
```

**Lücken auf docs.processcube.io:**

- Components: Nur RemoteUserTask + SplitterLayout — BPMNViewer, ProcessInstanceInspector, DynamicUi fehlen
- Functions: Nur wenige Funktionen gelistet, viele fehlen
- **Authentifizierung: Komplett fehlend** (getIdentity, getServerIdentity, AuthorityClient)
- **Server Identity & Authority Client: Komplett fehlend** (gerade erst gebaut)
- Configuration: Nur teilweise — neue Env-Vars fehlen

### Was fehlt in beiden

| Thema                              | README    | docs.processcube.io | Aktion                       |
| ---------------------------------- | --------- | ------------------- | ---------------------------- |
| SDK-Gesamtarchitektur              | Fehlt     | Fehlt               | Neu schreiben                |
| Server Identity & Authority Client | Fehlt     | Fehlt               | Neu schreiben (höchste Prio) |
| Auth-Konzepte (User vs. Server)    | Fehlt     | Fehlt               | Neu schreiben                |
| Server-Funktionen (vollständig)    | Fehlt     | Teilweise           | Erweitern                    |
| Client-Komponenten (vollständig)   | Fehlt     | Teilweise           | Erweitern                    |
| Umgebungsvariablen (vollständig)   | Teilweise | Teilweise           | Konsolidieren                |
| CSS-Import-Anleitung               | Fehlt     | Fehlt               | Neu schreiben                |
| External Tasks                     | Sehr gut  | Gut                 | Beibehalten                  |

## Strategie: README.md als Quelle, docs.processcube.io als Ziel

Die README.md wird als **Single-Source-of-Truth** geschrieben. Jeder Abschnitt wird so
strukturiert, dass er 1:1 als eigene Seite auf docs.processcube.io übertragbar ist.

**Mapping README-Abschnitte → docs.processcube.io Seiten:**

```
README.md Abschnitt              → docs.processcube.io Seite
─────────────────────────────────────────────────────────────
# Überblick                      → /app-sdk (Übersicht, aktualisieren)
## Installation                  → /app-sdk/getting-started (aktualisieren)
## Architektur                   → /app-sdk/architecture (neue Seite)
## Authentifizierung             → /app-sdk/authentication (neue Seite)
  ### User-Identity              →   /app-sdk/authentication/user-identity
  ### Server-Identity            →   /app-sdk/authentication/server-identity
  ### Authority Client           →   /app-sdk/authentication/authority-client
## Konfiguration                 → /app-sdk/configuration (aktualisieren)
  ### Plugin System              →   /app-sdk/configuration/plugin-system (aktualisieren)
  ### Umgebungsvariablen         →   /app-sdk/configuration/environment-variables (aktualisieren)
## Server-Funktionen             → /app-sdk/functions (aktualisieren)
  ### Process-Instanzen          →   /app-sdk/functions/process-instances
  ### User Tasks                 →   /app-sdk/functions/user-tasks
  ### Server Actions             →   /app-sdk/functions/server-actions
## Client-Komponenten            → /app-sdk/components (aktualisieren)
  ### BPMNViewer                 →   /app-sdk/components/bpmn-viewer (neue Seite)
  ### ProcessInstanceInspector   →   /app-sdk/components/process-instance-inspector (neue Seite)
  ### DynamicUi                  →   /app-sdk/components/dynamic-ui (neue Seite)
  ### Weitere                    →   je eigene Seite
## External Tasks                → /app-sdk/external-tasks (bestehend, beibehalten)
## Entwicklung                   → Nur README (nicht für docs.processcube.io)
```

## Dokumentationsstruktur (Inhaltsverzeichnis der README.md)

```
# ProcessCube App SDK

## Überblick
  - Was ist das SDK?
  - Architektur-Diagramm (Drei-Schichten + Export-Map)

## Installation
  - Voraussetzungen
  - npm install
  - Next.js-Konfiguration
  - CSS-Einbindung

## Architektur
  - Modulstruktur (Common / Server / Client) — Diagramm
  - Export-Map (Tabelle + Diagramm)
  - Build-Ausgabe (ESM + CJS)

## Authentifizierung
  - Übersicht: Zwei Strategien — Diagramm
  - User-Identity (NextAuth)
    - getIdentity()
    - hasClaim()
    - Auth-Callbacks
  - Server-Identity (Client Credentials)
    - getServerAccessToken()
    - getServerIdentity()
    - Token-Caching — Sequenzdiagramm
  - Authority Client
    - Zwei-Stufen-Architektur — Klassendiagramm
    - Stufe 1: request()
    - Stufe 2: Convenience-Methoden
    - Beispiele (Vorher/Nachher)

## Konfiguration
  - withApplicationSdk Plugin
  - Umgebungsvariablen (vollständige Referenz)

## Server-Funktionen
  - Übersicht (Tabelle aller Funktionen)
  - Process-Instanzen
  - User Tasks
  - Server Actions
  - Engine Client

## Client-Komponenten
  - Übersicht (Tabelle aller Komponenten)
  - BPMNViewer
  - ProcessInstanceInspector
  - DynamicUi
  - ProcessModelInspector
  - DocumentationViewer
  - SplitterLayout
  - DropdownMenu
  - RemoteUserTask (Common)

## External Tasks
  (bestehende Doku — bleibt 1:1 erhalten)

## Entwicklung
  - Setup / Build
  - npm link Workflow
  - Test-App
```

## Umsetzungsplan

### Phase 1: Überblick, Architektur, Installation

- [x] 1.1 Überblick — SDK-Beschreibung, Features, Quick-Start-Beispiel
- [x] 1.2 Architektur — Drei-Schichten-Diagramm (Mermaid `graph TD`)
- [x] 1.3 Export-Map — Diagramm (Mermaid `graph LR`) + Tabelle
- [x] 1.4 Installation — Erweitern: Next.js-Config, CSS-Import, Peer-Dependencies

### Phase 2: Authentifizierung (höchste Prio — neues Feature)

- [x] 2.1 Übersicht — Entscheidungsdiagramm: User-Identity vs. Server-Identity (Mermaid `flowchart`)
- [x] 2.2 User-Identity — getIdentity(), hasClaim(), Auth-Callbacks mit Beispielen
- [x] 2.3 Server-Identity — getServerAccessToken(), getServerIdentity() - Token-Cache-Flow (Mermaid `sequenceDiagram`) - Env-Vars, Options, Fehlerbehandlung - Code-Beispiel: External Task mit Server-Token
- [x] 2.4 Authority Client — Zwei-Stufen-Architektur - API-Diagramm (Mermaid `classDiagram`) - Stufe 1: request() generisch - Stufe 2: updateClaim, addScope, addGroup, deleteUser - Vorher/Nachher-Beispiele

### Phase 3: Konfiguration + Server-Funktionen

- [x] 3.1 Konfiguration — withApplicationSdk Plugin, vollständige Env-Var-Tabelle
- [x] 3.2 Server-Funktionen Übersicht — Tabelle aller Funktionen nach Kategorie
- [x] 3.3 Process-Instanzen — Signatur, Beschreibung, Beispiel je Funktion
- [x] 3.4 User Tasks — Signatur, Beschreibung, Beispiel je Funktion
- [x] 3.5 Server Actions — Tabelle, Unterschied zu direkten Funktionen, Beispiel
- [x] 3.6 Engine Client — getEngineClient(), wann direkt nutzen

### Phase 4: Client-Komponenten

- [x] 4.1 Komponenten-Übersicht — Tabelle mit allen Komponenten + Import
- [x] 4.2 BPMNViewer — Props, Ref-API (Methoden-Tabelle), CSS-Import, Beispiel
- [x] 4.3 ProcessInstanceInspector — Props (alle Flags), onFinish-Callback, Beispiel
- [x] 4.4 DynamicUi — Props, Custom Fields, FormState-Flow (Mermaid), Beispiel
- [x] 4.5 Weitere — ProcessModelInspector, DocumentationViewer, SplitterLayout, DropdownMenu, RemoteUserTask

### Phase 5: Abschluss

- [x] 5.1 External Tasks — bestehende Doku eingliedern (nur Position im Dokument anpassen)
- [x] 5.2 Entwicklung — bestehende Setup-Doku beibehalten + Test-App ergänzen
- [x] 5.3 Formatierung prüfen (Prettier)

## Geplante Mermaid-Diagramme

| #    | Typ               | Beschreibung                                     | Abschnitt          |
| ---- | ----------------- | ------------------------------------------------ | ------------------ |
| 1    | `graph TD`        | SDK-Drei-Schichten-Architektur                   | Architektur        |
| 2    | `graph LR`        | Export-Map: Paket → Einstiegspunkte              | Architektur        |
| 3    | `flowchart TD`    | Auth-Entscheidungsbaum: User vs. Server Identity | Authentifizierung  |
| 4    | `sequenceDiagram` | Server-Identity Token-Cache-Flow                 | Authentifizierung  |
| 5    | `classDiagram`    | AuthorityClient Zwei-Stufen-API                  | Authentifizierung  |
| 6    | `graph TD`        | DynamicUi Datenfluss                             | Client-Komponenten |
| 7–11 | Diverse           | External-Task-Diagramme (bestehend, unverändert) | External Tasks     |

**→ 6 neue Diagramme + 5 bestehende = 11 Mermaid-Diagramme gesamt**

## Prinzipien

- **Deutsch** — README bleibt deutsch (wie bisher, wie docs.processcube.io)
- **Sektions-kompatibel** — Jeder H2-Abschnitt = eine potenzielle docs.processcube.io Seite
- **Mermaid** — Für alle Architektur- und Flow-Diagramme
- **Beispiele** — Jede Funktion/Komponente mit mindestens einem Code-Beispiel
- **Tabellen** — Für Props, Parameter, Env-Vars, Funktionsübersichten
- **Bestehende Doku erhalten** — External-Task-Doku bleibt 1:1
- **Zielgruppe** — Entwickler, die das SDK in ihrer Next.js-App nutzen

## Review

### Ergebnis

Die README.md wurde von ~495 auf ~1401 Zeilen erweitert (+183%).

### Neue Abschnitte

| Abschnitt          | Zeilen (ca.) | Mermaid-Diagramme                              | Beschreibung                                             |
| ------------------ | ------------ | ---------------------------------------------- | -------------------------------------------------------- |
| Überblick          | 50           | 1 (Drei-Schichten-Architektur)                 | SDK-Beschreibung, Features                               |
| Export-Map         | 30           | 1 (Import-Pfade)                               | Tabellarische + visuelle Übersicht                       |
| Installation       | 60           | —                                              | Erweitert: Next.js-Config, CSS, Env-Vars                 |
| Authentifizierung  | 200          | 3 (Entscheidung, Token-Cache, AuthorityClient) | Komplett neu: User vs. Server Identity, Authority Client |
| Konfiguration      | 60           | —                                              | Plugin + vollständige Env-Var-Referenz                   |
| Server-Funktionen  | 200          | —                                              | Alle Funktionen mit Signatur + Beispiel                  |
| Client-Komponenten | 250          | 1 (DynamicUi-Datenfluss)                       | Alle Komponenten mit Props-Tabellen                      |
| External Tasks     | ~350         | 5 (bestehend, unverändert)                     | 1:1 übernommen                                           |
| Entwicklung        | 50           | —                                              | Erweitert um Test-App                                    |

### Mermaid-Diagramme (11 gesamt)

1. SDK-Drei-Schichten-Architektur (`graph TD`)
2. Export-Map Import-Pfade (`graph LR`)
3. Auth-Entscheidungsbaum User vs. Server (`flowchart TD`)
4. Server-Identity Token-Cache-Flow (`sequenceDiagram`)
5. AuthorityClient Klassen-API (`classDiagram`)
6. DynamicUi Datenfluss (`graph TD`)
   7–11. Bestehende External-Task-Diagramme (unverändert)

### Transport-Mapping für docs.processcube.io

Jeder H2-Abschnitt kann als eigene Seite übertragen werden:

| README H2               | docs.processcube.io Seite  | Aktion                           |
| ----------------------- | -------------------------- | -------------------------------- |
| Überblick + Architektur | `/app-sdk`                 | Aktualisieren                    |
| Installation            | `/app-sdk/getting-started` | Aktualisieren                    |
| Authentifizierung       | `/app-sdk/authentication`  | **Neue Sektion** (3 Unterseiten) |
| Konfiguration           | `/app-sdk/configuration`   | Aktualisieren                    |
| Server-Funktionen       | `/app-sdk/functions`       | Erweitern (3 Unterseiten)        |
| Client-Komponenten      | `/app-sdk/components`      | Erweitern (5+ Unterseiten)       |
| External Tasks          | `/app-sdk/external-tasks`  | Bestehend                        |
