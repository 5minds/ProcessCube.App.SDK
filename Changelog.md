# Changelog ProcessCube App SDK

---

## 🔮 In Entwicklung (Ausblick auf nächstes Release)

*Diese Features sind nach v8.0.2 hinzugekommen und werden im nächsten Release enthalten sein.*

### Fehlerbehebungen
- Fehlende TypeScript-Deklarationsdateien für 8.x-Kompatibilität wiederhergestellt (#408)

### Technische Änderungen
- CLAUDE.md mit Projektdokumentation und Entwicklungsregeln hinzugefügt

---

## ✅ Stable v8.0.2 (10.12.2025)

*Stabile Version — Major-Update mit Node.js 24, ES-Module-Support und neuen Features.*

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

*Major-Release mit Breaking Changes: Node.js 24, ES-Module-Unterstützung, Paket-Aktualisierungen.*

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

*Patch-Release mit aktualisierten Engine-Paketen.*

### Technische Änderungen
- Stabile Versionen für Engine-Pakete verwendet

---

## ✅ Stable v6.2.0 (17.05.2025)

*Feature-Release mit ProcessInstanceInspector, Dark Mode und vielen Verbesserungen.*

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

*Feature-Release als Basis für den 2025.1 Release-Zyklus.*

---

## Release-Prozess

Features durchlaufen drei Phasen, bevor sie alle Nutzer erreichen:

```
🔮 In Entwicklung  →  🧪 Insiders  →  ✅ Stable
     (Ausblick)        (Early Adopter)    (Alle Nutzer)
```

| Phase | Zielgruppe | Beschreibung |
|-------|------------|--------------|
| 🔮 **In Entwicklung** | Entwickler | Ausblick auf kommende Features. Noch in keinem Release enthalten. |
| 🧪 **Insiders** | Early Adopter | Vorschau-Versionen zum Testen neuer Features vor dem Stable-Release. |
| ✅ **Stable** | Alle Nutzer | Produktionsreife Version. Features sind vollständig getestet und freigegeben. |

**Hinweis:** Jeder Abschnitt listet nur die Änderungen, die **neu** in dieser Phase sind.