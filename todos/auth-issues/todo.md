# Auth Issues mit TS AppSDK (#424)

## Problem

Nutzer können sich einloggen, aber der AccessToken ist nicht nutzbar.
Logs (aus der Consumer-App):

- `No access token found for authenticated user`
- `Failed to get access token via API, falling back to cookies` (error: `Account not found`)

## Analyse

Die konkreten Log-Zeilen stammen aus der Consumer-App, nicht aus dem SDK.
Das Fehlerbild „eingeloggt, aber Token unbrauchbar" entsteht im SDK aber an
einer klar identifizierbaren Stelle:

- `src/common/functions/hasClaim.ts` → `authConfigJwtCallback`: Wenn der
  Refresh fehlschlägt (kein / abgelaufener Refresh-Token), wird
  `token.error = 'RefreshAccessTokenError'` gesetzt. Die NextAuth-Session
  bleibt gültig (User „eingeloggt"), aber es gibt keinen brauchbaren
  AccessToken mehr → passt exakt zum Fehlerbild.
- Häufigste Ursache: Der Scope `offline_access` wird beim Login nicht
  angefragt → die Authority liefert keinen Refresh-Token
  (`MISSING_REFRESH_TOKEN_MESSAGE`). Nach Ablauf des ersten AccessTokens
  ist der User gestrandet.
- `src/server/lib/getIdentity.ts`: Wirft in diesem Fall nur ein generisches
  `AccessToken or Sub could not be determined!` und unterscheidet den
  Refresh-Fehler nicht — schwer zu diagnostizieren.

## Geplante Änderungen (Vorschlag — Freigabe abwarten)

### 1. Doku: Manuelle Abmeldung / Federated Logout (README)

Neuer Abschnitt unter „Authentifizierung": Wie man sich sauber ab- und
wieder anmeldet, um einen frischen AccessToken zu erhalten.

- NextAuth `signOut()` (löscht Session-Cookie lokal).
- Federated Logout am Authority `end_session_endpoint` (mit `id_token_hint`),
  damit auch die Authority-Session beendet wird und beim erneuten Login ein
  neuer Token ausgestellt wird.

### 2. Doku: Bekannte Fehlerquellen / Troubleshooting (README)

Neuer Abschnitt mit den bekannten Stolperfallen:

- Fehlender `offline_access`-Scope → kein Refresh-Token → RefreshAccessTokenError.
- Abgelaufener/rotierter Refresh-Token.
- `session.error === 'RefreshAccessTokenError'` in der App abfragen und den
  User zum Re-Login schicken.
- Hinweis zu „Account not found" (NextAuth-Adapter-seitig, Consumer-App).

### 3. Code (optional, klein): klarere Fehlermeldung in `getIdentity()`

Wenn `token.error` bzw. fehlender AccessToken auf einen Refresh-Fehler
zurückgeht, eine aussagekräftige Meldung werfen statt des generischen Textes.
Nur wenn gewünscht — minimal-invasiv.

### 4. Support-Anruf

Kann ich als Agent nicht leisten → an das Team weiterreichen.

## Offene Frage an das Team

Reicht die Doku (1 + 2), oder soll auch die Code-Verbesserung (3) mit rein?

## Review

_(wird nach Umsetzung ergänzt)_
