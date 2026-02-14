# External Task Dokumentation in README.md

## Ziel

Neuen Abschnitt `### External Tasks` in der README.md ergänzen, der SDK-Nutzern erklärt wie External Tasks funktionieren.

## Aufgaben

- [x] External Tasks Abschnitt in README.md nach `### Client` einfügen
- [x] `npm run format` ausführen (Prettier formatiert auch Markdown)
- [x] Ergebnis prüfen
- [x] Review

## Review

### Änderungen

- **README.md** — Neuer Abschnitt `### External Tasks` eingefügt (Zeilen 49–135)

### Inhalt des neuen Abschnitts

1. **Einleitung** — Verzeichniskonvention (`external_task.ts` im `app/`-Verzeichnis), Topic-Ableitung aus Pfad, `withApplicationSdk`-Konfiguration
2. **Handler-Signatur** — `default export` mit `payload`, `task`, `signal` Parametern
3. **Konfiguration** — `export const config` mit `lockDuration` und `maxTasks`
4. **Abort-Handling bei Boundary Events** — Erklärung des Zusammenhangs zwischen `lockDuration` und Abort-Verzögerung, Tabelle mit Werten, vollständiges Codebeispiel mit `AbortSignal`

### Stil

- Deutsch, konsistent mit dem Rest der README
- Kurze Erklärungen + Codebeispiele
- Prettier-formatiert
