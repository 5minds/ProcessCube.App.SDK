# GitHub Packages + npmjs.org + Release — Überarbeiteter Plan

## Ziel

Das npm-Paket soll auf **allen Branches** sowohl auf **npmjs.org** als auch auf **GitHub Packages** publiziert werden. `ci_tools publish-npm-package` wird durch dedizierte `npm publish`-Steps ersetzt. Auf main/next wird zusätzlich ein GitHub Release erstellt.

## Ist-Zustand (vorher)

```
Publish Version          → ci_tools publish-npm-package (Marketplace, alle Branches)
Publish to GitHub Packages → npm publish (GitHub Packages, nur main/next)
Create GitHub Release      → gh release create (nur main/next)
```

## Soll-Zustand

```
Determine npm tag          → Branch → npm dist-tag Mapping
Publish to npmjs.org       → npm publish --tag <tag> (alle Branches)
Publish to GitHub Packages → npm publish --tag <tag> (alle Branches)
Create GitHub Release      → gh release create (nur main/next)
```

## Plan

### Änderungen an `verify-build-and-publish.yml`

- [x] **1. npm dist-tag Step erstellen**
  - Branch → Tag Mapping:
    - `main` → `latest`
    - `next` → `next`
    - `develop` → `develop`
    - `release/**` → Branch-Name sanitized (z.B. `release-1.0`)
    - Sonstige → Branch-Name sanitized
  - Output: `npm-tag` für nachfolgende Steps

- [x] **2. "Publish Version" (ci_tools) ersetzen durch "Publish to npmjs.org"**
  - `npm publish --provenance --tag <tag>` mit `registry.npmjs.org`
  - Auf allen Branches
  - Auth via OIDC Trusted Publisher (`--provenance`, kein Token nötig)
  - `id-token: write` Permission war bereits gesetzt

- [x] **3. "Publish to GitHub Packages" auf alle Branches erweitern**
  - `if:`-Bedingung entfernen
  - Temporäre `.npmrc` für `npm.pkg.github.com` schreiben
  - `npm publish --tag <tag>` mit `GITHUB_TOKEN`

- [x] **4. GitHub Release bleibt nur auf main/next**
  - Keine Änderung an der Logik
  - `next` → Pre-Release, `main` → Stable Release

## Review

### Umgesetzte Änderungen

Datei: `.github/workflows/verify-build-and-publish.yml` (Zeile 125-161)

**Entfernt:**

- `ci_tools publish-npm-package --create-tag-from-branch-name`

**Neu:**

1. **Determine npm tag** (Zeile 125-137) — Branch → dist-tag Mapping
2. **Publish to npmjs.org** (Zeile 139-140) — `npm publish --provenance --tag <tag>`, Auth via OIDC Trusted Publisher
3. **Publish to GitHub Packages** (Zeile 142-148) — Temporäre `.npmrc` für `npm.pkg.github.com`, Auth via `GITHUB_TOKEN`
4. **Create GitHub Release** (Zeile 150-161) — Unverändert, nur main/next

### Hinweise

- npmjs.org braucht kein Token, OIDC via `--provenance` + `id-token: write`
- GitHub Packages nutzt `GITHUB_TOKEN` mit `packages: write`
- `ci_tools` werden weiterhin für `prepare-version` und `commit-and-tag-version` genutzt
- Nur `publish-npm-package` wurde ersetzt

### OIDC-Debugging (ENEEDAUTH)

Das Problem war: `setup-node` mit `registry-url` erzeugt eine `~/.npmrc` mit `_authToken=${NODE_AUTH_TOKEN}`. Selbst wenn `NODE_AUTH_TOKEN` leer oder ungesetzt ist, versucht npm Token-basierte Auth **statt** OIDC. npm fällt nur auf OIDC zurück wenn **kein** `_authToken`-Eintrag existiert.

**Fixes:**
1. `registry-url` aus `setup-node@v6` im `build_and_publish`-Job entfernt
2. Publish-Step schreibt `~/.npmrc` explizit nur mit `registry=` (ohne `_authToken`)
3. Repository-URL in `package.json` von `git+ssh://` auf `git+https://` geändert (für Provenance)
