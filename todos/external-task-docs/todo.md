# External Task Dokumentation für docs.processcube.io

## Ziel

README.md überarbeiten mit detaillierter ExternalTask-Dokumentation und Mermaid-Diagrammen,
geeignet für die Veröffentlichung auf docs.processcube.io.

## Plan

- [x] README.md: ExternalTask-Abschnitt komplett neu schreiben mit folgender Struktur:
  - [x] Überblick: Was sind External Tasks und wofür werden sie eingesetzt?
  - [x] Architektur-Diagramm (Mermaid): Zusammenspiel Engine ↔ App SDK ↔ Worker
  - [x] Sequenzdiagramm (Mermaid): Lebenszyklus eines External Tasks (Fetch & Lock → Process → Finish)
  - [x] Sequenzdiagramm (Mermaid): Worker-Startup & IPC-Kommunikation (Adapter ↔ Worker Process)
  - [x] Flowchart (Mermaid): Error-Handling & Retry-Strategie
  - [x] Setup & Konfiguration (withApplicationSdk, next.config.js)
  - [x] Dateistruktur & Topic-Mapping (Verzeichnispfad → Topic)
  - [x] Handler-Signatur mit allen Parametern erklärt
  - [x] Konfiguration (ExternalTaskConfig: lockDuration, maxTasks)
  - [x] Abort-Handling bei Boundary Events (mit Beispiel)
  - [x] Authentifizierung & Token-Management (Umgebungsvariablen, Token-Refresh)
  - [x] Fehlerbehandlung & Restart-Strategie (Worker-Level + Adapter-Level)
  - [x] Umgebungsvariablen-Referenz (Tabelle)
  - [x] Vollständiges Beispiel mit allen Features

## Review

### Änderungen

Die README.md wurde im Abschnitt "External Tasks" (vorher ~85 Zeilen) durch eine umfassende
Dokumentation (~300 Zeilen) ersetzt. Der Rest der README (Installation, Setup, lokale Entwicklung) blieb unverändert.

### Neue Inhalte

**4 Mermaid-Diagramme:**

1. **Architektur-Diagramm** (graph LR) — Zeigt Engine ↔ Adapter ↔ Worker Prozesse mit IPC und HTTP
2. **Task-Lebenszyklus** (sequenceDiagram) — Fetch & Lock → Processing → Extend Lock → Finish/Error
3. **Worker-Startup & IPC** (sequenceDiagram) — File Watch → Transpile → Fork → create/restart/updateIdentity
4. **Error-Handling Flowchart** (flowchart TD) — Zweistufige Retry-Strategie (Worker + Adapter Level)

**Dokumentierte Abschnitte:**

- Überblick und Architektur mit Komponenten-Tabelle
- Detaillierter Ablauf (5 Schritte) des Task-Lebenszyklus
- IPC-Nachrichten-Referenz (create, restart, updateIdentity)
- Fehlerbehandlung mit allen Exit-Codes und Retry-Schwellenwerten
- Setup-Anleitung (next.config.js + Handler-Datei anlegen)
- Topic-Mapping-Beispiele (Verzeichnisstruktur → Topic)
- Handler-Signatur mit Parameter-Tabelle
- Worker-Konfiguration mit Options-Tabelle
- Abort-Handling mit lockDuration-Tabelle und Beispielcode
- Token-Management mit Sequenzdiagramm
- Umgebungsvariablen-Referenz (5 Variablen, komplett dokumentiert)
- Vollständiges Beispiel mit typisierten Payload/Result
- Hot-Reload Beschreibung
