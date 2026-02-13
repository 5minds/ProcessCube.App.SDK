# Test Next.js App mit External Task

## Schritte

- [x] 1. Next.js App manuell erstellen (package.json, tsconfig.json, next.config.ts)
- [x] 2. App-Seiten erstellen (layout.tsx, page.tsx)
- [x] 3. External Task erstellen (test-task/external_task.ts)
- [x] 4. Environment-Konfiguration (.env.local.example, .gitignore)
- [x] 5. SDK bauen und test-app testen

## Review

### Erstellte Dateien

```
test-app/
├── package.json          — Abhängigkeiten: next@^15.3.0, next-auth@~4.24.12, react@^19.1.0
├── tsconfig.json         — Standard Next.js TypeScript-Konfiguration
├── next.config.ts        — withApplicationSdk mit useExternalTasks: true
├── .env.local.example    — PROCESSCUBE_ENGINE_URL=http://localhost:10560
├── .gitignore            — node_modules/, .next/, .env.local
└── app/
    ├── layout.tsx        — Minimales Root-Layout
    ├── page.tsx          — Einfache Statusseite
    └── test-task/
        └── external_task.ts  — Handler für Topic "test-task"
```

### Verifikation

- Next.js startet erfolgreich auf http://localhost:3000
- External Task Worker wird für Topic "test-task" gestartet
- ECONNREFUSED-Fehler sind erwartet (keine Engine auf localhost:10560)
- SDK wird via `npm link` eingebunden

### Hinweis

Next.js zeigt eine Warnung: `experimental.serverComponentsExternalPackages has been moved to serverExternalPackages`.
Das liegt im SDK (`withApplicationSdk` setzt die alte Option). Sollte separat im SDK behoben werden.
