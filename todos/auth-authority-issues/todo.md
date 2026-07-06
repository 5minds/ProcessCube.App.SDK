# Auth Issues mit TS AppSDK (Ticket #987)

## Ausgangslage

Sporadische Probleme mit der Authority bei manchen Nutzern. Der Nutzer ist
eingeloggt, kann den AccessToken aber nicht nutzen. Fehlerbild aus den Logs:

```
No access token found for authenticated user { "userId": "OVp9ReM19hfaj7fDwIjbMvEewlzKlPFn" }
Failed to get access token via API, falling back to cookies { "userId": "...", "error": "Account not found" }
```

Kundenwunsch:

1. Anleitung, wie man sich **manuell von der Authority abmeldet** (um sich neu
   anzumelden und einen frischen AccessToken zu bekommen).
2. Auflistung **möglicher / bekannter Fehlerquellen** im Umgang mit der Authority.
3. Direkter Support-Call — **menschliche Aufgabe, außerhalb dieses PRs.**

## Analyse (Code-Bezug)

- `src/server/lib/getIdentity.ts` (NextAuth, User-Session):
  - Prüft `token.expiresAt`; bei Ablauf Refresh über `GET ${NEXTAUTH_URL}/api/auth/session`.
  - Dieser Call triggert den `jwt`-Callback → neuer verschlüsselter Session-Cookie
    mit neuem AccessToken.
  - Wirft `AccessToken or Sub could not be determined!`, wenn danach kein
    `accessToken`/`sub` vorhanden ist.
- Deutung der Logs:
  - **"Account not found"** beim Refresh ⇒ die Authority kennt das Konto (bzw. das
    Refresh-Token / den Account-Link) nicht mehr → Refresh scheitert, kein neuer
    AccessToken. Ursachen typischerweise: Account an der Authority gelöscht/rotiert,
    Refresh-Token abgelaufen/widerrufen, Client-Konfiguration geändert.
  - **"No access token found for authenticated user"** ⇒ die NextAuth-Session
    (Cookie) ist weiterhin gültig, enthält aber keinen brauchbaren AccessToken mehr.
  - Netto: Der Nutzer hängt in einer **kaputten Session** fest — scheinbar
    eingeloggt, aber ohne nutzbaren Token, und ohne eingebauten Weg, sich sauber
    neu anzumelden.

## Offene Richtungsentscheidung (bitte freigeben)

Der Ticket-Kern ist Support/Doku. Vor der Umsetzung bitte den **Umfang** wählen:

- **Option A — Nur Doku (minimal):**
  README-Abschnitt „Authority / Auth-Troubleshooting" mit
  (a) manueller Abmeldung (NextAuth `signOut()` bzw. Session-Cookies löschen →
  Re-Login gegen Authority) und (b) Tabelle bekannter Fehlerquellen inkl. der
  beiden Log-Meldungen und deren Bedeutung.

- **Option B — Doku + kleiner Helfer (empfohlen):**
  Zusätzlich zu A: in `getIdentity.ts` den Refresh-Fehlerfall („Account not found"
  / fehlender Token) sauber erkennen und einen **klaren, typisierten Fehler**
  werfen (z. B. „Re-Authentication required"), statt still eine kaputte Identity
  zu liefern. So kann die Consumer-App gezielt auf Re-Login umleiten.

- **Option C — Doku + Helfer + Sign-out-Export:**
  Zusätzlich zu B: eine dünne `signOut`/`clearSession`-Hilfe exportieren, damit
  Consumer-Apps die Abmeldung nicht selbst zusammenbauen müssen.

Empfehlung: **Option B** — kleiner, gezielter Codeeingriff plus Doku, ohne die
öffentliche API stark zu erweitern (Prinzip Einfachheit).

## Plan (wird nach Freigabe konkretisiert)

- [ ] Umfang (A/B/C) freigegeben
- [ ] README: Abschnitt „Authority / Auth-Troubleshooting" (manuelle Abmeldung + Fehlerquellen)
- [ ] (B/C) `getIdentity.ts`: Refresh-Fehler klar/typisiert propagieren
- [ ] (C) Sign-out-Helfer + Export in `src/server/lib/index.ts`
- [ ] `npm run format` + Build prüfen
- [ ] Review-Abschnitt ergänzen

## Was NICHT Teil des PRs ist

- Der gewünschte Support-Call (menschlich).
- Änderungen an der Authority selbst (dieses Repo ist nur das App-SDK).
