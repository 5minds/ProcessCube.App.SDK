# GitHub Packages + Release + Tags

## Ist-Zustand

Die aktuelle CI-Pipeline (`verify-build-and-publish.yml`) macht folgendes:

1. **Verify-Job**: Prettier formatieren, ggf. committen
2. **Build & Publish-Job**:
   - `ci_tools prepare-version` → setzt Version in `package.json`
   - `ci_tools commit-and-tag-version --only-on-primary-branches` → committet Version & erstellt Git-Tag (nur main/next)
   - `npm run build` + `npm run test`
   - `ci_tools publish-npm-package --create-tag-from-branch-name` → publiziert auf npm (via `marketplace.processcube.io/npm/`)

**Was fehlt:**

- Kein Publish nach GitHub Packages (`npm.pkg.github.com`)
- Kein GitHub Release wird erstellt
- Tags werden zwar von `ci_tools` erstellt, aber es gibt kein explizites Release-Objekt bei GitHub

## Soll-Zustand

Auf `main` und `next` soll zusätzlich:

1. Das npm-Paket auch auf **GitHub Packages** publiziert werden
2. Ein **GitHub Release** erstellt werden (mit der Version als Titel)
3. Die **Git-Tags** sollen korrekt bei GitHub vorhanden sein (wird bereits durch `ci_tools` gemacht)

## Plan

### Änderungen an `verify-build-and-publish.yml`

- [x] **1. Permissions erweitern**
  - `contents: write` hinzufügen (für Release-Erstellung und Tag-Push)
  - `packages: write` hinzufügen (für GitHub Packages)

- [x] **2. GitHub Packages Publish-Step hinzufügen** (nur main/next)
  - Neuer Step nach dem bestehenden npm-Publish
  - Bedingung: `if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/next'`
  - Temporäre `.npmrc` für `npm.pkg.github.com` erstellen
  - `npm publish` mit `GITHUB_TOKEN` als Auth
  - Der Scope `@5minds` muss auf die GitHub-Registry gemappt werden

- [x] **3. GitHub Release erstellen** (nur main/next)
  - Neuer Step nach dem Publish
  - Version aus `package.json` auslesen
  - `gh release create` mit dem Tag verwenden
  - Auf `next` als Pre-Release markieren (`--prerelease`)
  - Auf `main` als reguläres Release
  - Release Notes automatisch generiert (`--generate-notes`)
  - Keine Build-Artefakte angehängt

## Offene Fragen

1. **Release Notes**: Sollen die Release Notes automatisch generiert werden (`--generate-notes`) oder aus dem Changelog kommen?
2. **Build-Artefakte**: Sollen Build-Artefakte (z.B. ein tarball) an das Release angehängt werden?
3. **next-Branch**: Soll das Release auf `next` als Pre-Release markiert werden (empfohlen)?

## Technische Details

### GitHub Packages Publish

```yaml
- name: Publish to GitHub Packages
  if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/next'
  run: |
    echo "@5minds:registry=https://npm.pkg.github.com" > .npmrc
    echo "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}" >> .npmrc
    npm publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### GitHub Release

```yaml
- name: Create GitHub Release
  if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/next'
  run: |
    VERSION=$(node -p "require('./package.json').version")
    TAG="v${VERSION}"
    if [ "${{ github.ref }}" = "refs/heads/next" ]; then
      gh release create "${TAG}" --title "${TAG}" --generate-notes --prerelease
    else
      gh release create "${TAG}" --title "${TAG}" --generate-notes
    fi
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Review

### Änderungen

Nur eine Datei geändert: `.github/workflows/verify-build-and-publish.yml`

1. **Permissions** (Zeile 17-18): `contents: write` und `packages: write` hinzugefügt
2. **GitHub Packages Publish** (Zeile 114-121): Neuer Step, der nach dem npm-Publish eine temporäre `.npmrc` für `npm.pkg.github.com` schreibt und `npm publish` ausführt. Nur auf `main` und `next`.
3. **GitHub Release** (Zeile 123-134): Neuer Step, der die Version aus `package.json` liest und `gh release create` aufruft. Auf `next` mit `--prerelease`, auf `main` ohne.

### Hinweise

- Der `GITHUB_TOKEN` reicht für GitHub Packages und Release-Erstellung — kein zusätzliches Secret nötig
- Die `.npmrc` wird nur temporär im Workflow überschrieben, das hat keinen Einfluss auf den vorherigen npm-Publish-Step (der über `ci_tools` läuft)
- Falls der Tag nicht existiert, erstellt `gh release create` ihn automatisch
