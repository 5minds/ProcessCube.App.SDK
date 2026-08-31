# Kundeninformation — Next.js Sicherheitsupdate (August 2026)

Textbausteine zur Weitergabe an Kunden/Betreiber von ProcessCube-Apps. Bitte vor
dem Versand an den konkreten Empfänger anpassen (Anrede, Betreiberkontext,
Windows/Linux, konkrete Next.js-Version).

---

## Variante A — „technisch"

**Betreff:** Sicherheitshinweis: Next.js auf ≥ 15.5.24 bzw. ≥ 16.3.3 aktualisieren (CVE-2026-75604)

Hallo <Name>,

Vercel hat im August-2026-Release zwei kritische Sicherheitslücken in Next.js
geschlossen. Für den Betrieb von ProcessCube-Apps ist vor allem relevant:

- **CVE-2026-75604 (CVSS 9.0) — Remote Code Execution unter Windows.**
  Betroffen sind Next.js-Installationen auf **Windows**, die Pages- oder
  App-Router **ohne Cache-Komponente** einsetzen. Es gibt **keinen Workaround** —
  ausschließlich ein Update behebt die Lücke.
  Betroffene Versionen: `next < 15.5.24` und `next < 16.3.3`.

- Eine zweite Lücke (AVIF-/libheif-Heap-Overflow, CVSS 9.8) betrifft nur
  Anwendungen, die die AVIF-Bildoptimierung von `next/image` nutzen. Das
  ProcessCube App-SDK verwendet diese Optimierung **nicht**.

**Was das App-SDK betrifft:**
`next` ist im App-SDK eine *peerDependency* — die tatsächlich installierte Version
bestimmt **Ihre** Anwendung, nicht das SDK. Wir haben im SDK die zulässigen
Versionsbereiche so verschärft, dass verwundbare Next.js-Versionen ausgeschlossen
sind (`next: ">=15.5.24 <16.0.0 || >=16.3.3"`) und die mitgelieferten
Referenz-/Lockfiles auf die gepatchten Versionen gehoben.

**Was Sie tun sollten:**
Aktualisieren Sie Next.js in Ihrem Anwendungsprojekt:

```bash
npm install next@15.5.24   # 15.5-Linie
# oder
npm install next@16.3.3    # 16.3-Linie
```

Anschließend neu bauen und deployen. Prüfen Sie mit `npm ls next`, dass keine
verwundbare Version mehr aufgelöst wird. Priorisieren Sie Windows-Deployments.

Bei Fragen zur Umstellung unterstützen wir Sie gern.

Viele Grüße
<Absender>

---

## Variante B — „nicht so technisch"

**Betreff:** Wichtiges Sicherheitsupdate für Ihre Anwendung

Hallo <Name>,

wir möchten Sie über ein wichtiges Sicherheitsupdate informieren, das die
Basistechnologie Ihrer Anwendung (das Framework „Next.js") betrifft.

Der Hersteller hat eine schwerwiegende Sicherheitslücke geschlossen. Ohne das
Update könnten Angreifer unter bestimmten Bedingungen Schadcode auf dem Server
ausführen — besonders bei einem Betrieb unter **Windows**. Eine Umgehung ohne
Update gibt es nicht.

**Für Ihre ProcessCube-Anwendung bedeutet das:**
Wir haben unsere Software (das App-SDK) bereits so angepasst, dass nur noch die
sicheren, aktualisierten Framework-Versionen verwendet werden. Damit dies bei
Ihnen wirksam wird, muss Ihre Anwendung einmalig aktualisiert und neu
bereitgestellt werden.

**Empfehlung:** Bitte planen Sie dieses Update zeitnah ein. Wenn wir Ihre
Anwendung betreuen, übernehmen wir das für Sie — melden Sie sich einfach kurz.
Falls Ihr eigenes Team den Betrieb verantwortet, unterstützen wir gern mit einer
kurzen Anleitung.

Es besteht kein Grund zur Sorge, solange das Update zeitnah eingespielt wird. Wir
kümmern uns darum, dass Ihre Anwendung sicher bleibt.

Viele Grüße
<Absender>
