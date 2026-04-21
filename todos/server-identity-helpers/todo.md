# Server Identity & Authority Client Helpers

## Motivation

In ProcessCube-Apps (z.B. processcube.io) wird in External Tasks wiederholt der gleiche
Boilerplate-Code geschrieben:

1. **Token-Beschaffung** — Client-Credentials-Flow gegen die Authority
2. **Identity-Erzeugung** — JWT-Decode des Tokens zu einem `Identity`-Objekt
3. **Authority-API-Calls** — HTTP-Aufrufe an Admin-Endpoints (Claims, Scopes, Groups, User-Deletion)

Das SDK bietet aktuell nur `getIdentity()` (NextAuth-basiert, für User-Sessions). Für
Server-to-Server-Kommunikation in External Tasks fehlen Hilfsfunktionen.

## Entscheidungen

- **Token-Caching:** Ja, mit automatischem Refresh. Fehler (z.B. User gesperrt) werden propagiert.
- **Authority Client:** Zwei Stufen — allgemeiner Base-Client + spezifischer ProcessCube-Authority-Client
- **Namensgebung:** `getServerAccessToken` / `getServerIdentity`
- **Scopes:** Default `'upe_admin engine_read engine_write'`, überschreibbar per Parameter oder Env-Var

## Plan

### Phase 1: Server Access Token & Identity (mit Cache)

- [x] 1.1 Neue Datei `src/server/lib/getServerIdentity.ts`
  - Token-Cache (Modul-Level): Token + Expiry speichern
  - `getServerAccessToken(options?)` — Client-Credentials-Flow
    - Standard-Env-Vars: `PROCESSCUBE_SERVER_CLIENT_ID`, `PROCESSCUBE_SERVER_CLIENT_SECRET`
    - Authority-URL aus `PROCESSCUBE_AUTHORITY_URL`
    - Default-Scopes: `'upe_admin engine_read engine_write'`, überschreibbar per Parameter
    - Cache-Check: Token zurückgeben wenn noch gültig (mit Buffer-Faktor)
    - Bei Refresh-Fehler: Error werfen (z.B. User gesperrt)
  - `getServerIdentity(options?)` — Wrapper der `Identity` zurückgibt
    - Ruft `getServerAccessToken()` auf
    - JWT-Decode mit `jwtDecode`
    - Gibt `{ token, userId }` zurück
  - `ServerAccessTokenOptions` Interface

- [x] 1.2 Export in `src/server/lib/index.ts` hinzufügen

### Phase 2: Authority Client (Zwei-Stufen-Architektur)

- [x] 2.1 Neue Datei `src/server/lib/AuthorityClient.ts`
  - **Stufe 1 — Allgemeiner Base-Client:**
    - `AuthorityClient` Klasse
    - Constructor: `authorityUrl` (aus Env oder Parameter), Token-Beschaffung via `getServerAccessToken()`
    - Generische `request(method, path, body?)` Methode
    - Handles: Cookie-basierte Auth, Content-Type, Redirect, Response-Parsing
    - Fehlerbehandlung: Wirft bei Auth-Fehlern (403/401 → User gesperrt o.ä.)
  - **Stufe 2 — ProcessCube-spezifische Convenience-Methoden:**
    - `updateClaim(username, claimName, claimValue)` → PATCH `.../update/claim`
    - `addScope(username, scopeName)` → PATCH `.../add/scope`
    - `addGroup(username, groupName)` → PATCH `.../add/group`
    - `deleteUser(username, options?: { fullDelete? })` → DELETE `.../delete`
  - Typisierte Rückgabewerte (`AuthorityResponse<T>`)

- [x] 2.2 Export in `src/server/lib/index.ts` hinzufügen

### Phase 3: Build & Format

- [x] 3.1 Build testen (`npm run build`)
- [x] 3.2 Format prüfen (`npm run format:check`)

## Vorher/Nachher

### Vorher (in jeder App, ~30 Zeilen Boilerplate pro Task)

```typescript
import { getAccessToken } from '../../common/utils/authorization';
export default async function (payload: any) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${process.env.PROCESSCUBE_AUTHORITY_URL}/acr/username_password/admin/user/${payload.email}/delete`, {
    method: 'DELETE',
    headers: { Cookie: `access_token=${accessToken}`, 'Content-Type': 'application/json' },
    redirect: 'follow',
    body: JSON.stringify({ fullDelete: false }),
  });
  return { completed_successful: response.ok };
}
```

### Nachher — Stufe 1 (nur Token)

```typescript
import { getServerAccessToken } from '@5minds/processcube_app_sdk/server';
export default async function (payload: any) {
  const token = await getServerAccessToken();
  // eigene fetch-Aufrufe mit dem Token
}
```

### Nachher — Stufe 2 (Authority Client)

```typescript
import { AuthorityClient } from '@5minds/processcube_app_sdk/server';
export default async function (payload: any) {
  const authority = new AuthorityClient();
  const result = await authority.deleteUser(payload.email, { fullDelete: false });
  return { completed_successful: result.ok, username: result.data?.username };
}
```

## Review

### Neue Dateien

| Datei | Beschreibung |
|---|---|
| `src/server/lib/getServerIdentity.ts` | Token-Cache + `getServerAccessToken()` + `getServerIdentity()` |
| `src/server/lib/AuthorityClient.ts` | `AuthorityClient`-Klasse mit generischem `request()` + Convenience-Methoden |

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/server/lib/index.ts` | 2 neue Exports hinzugefügt |

### Architektur-Entscheidungen

- **Token-Cache auf Modul-Ebene:** Einfacher `tokenCache` mit `expiresAt`-Prüfung und 0.85-Buffer-Faktor. Kein separater Refresh-Cycle nötig — der Token wird beim nächsten Aufruf automatisch erneuert.
- **Fehler-Propagierung:** Bei HTTP-Fehlern (401/403 etc.) wird ein Error geworfen — User-Sperrung wird dadurch korrekt gemeldet.
- **Zwei-Stufen-Client:** `AuthorityClient.request()` ist generisch für beliebige Authority-Calls. Die Convenience-Methoden (`updateClaim`, `addScope`, `addGroup`, `deleteUser`) kapseln die bekannten ProcessCube-Endpoints.
- **URL-Encoding:** Usernames werden mit `encodeURIComponent` encoded, um Sonderzeichen (z.B. `@` in E-Mails) korrekt zu behandeln.
- **Keine neue Dependency:** Nutzt `jwt-decode` und `@5minds/processcube_engine_sdk` (Logger, Identity), die bereits im Projekt sind.

### Neue Env-Variablen (für Consumer-Apps)

| Variable | Beschreibung | Pflicht |
|---|---|---|
| `PROCESSCUBE_SERVER_CLIENT_ID` | OAuth2 Client ID für Server-to-Server | Ja |
| `PROCESSCUBE_SERVER_CLIENT_SECRET` | OAuth2 Client Secret | Ja |
| `PROCESSCUBE_AUTHORITY_URL` | Authority URL (bereits vorhanden) | Ja |
| `PROCESSCUBE_SERVER_SCOPES` | Scopes überschreiben | Nein (Default: `upe_admin engine_read engine_write`) |
