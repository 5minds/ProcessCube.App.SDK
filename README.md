# ProcessCube.App.SDK

Das SDK beinhaltet Komponenten und Funktionen für Frontend und Backend (Client/Server) zur einfachen und schnellen Entwicklung einer ProcessCube App auf Basis von [Next.js](https://nextjs.org/).

## Installation zur Verwendung

### Voraussetzungen

- NodeJS `>= v24`

```shell
npm i @5minds/processcube_app_sdk
```

## Benutzung

Das NPM Paket hat _drei_ Exports.

### Default/Common

Hier werden Komponenten und Funktionen exportiert, die im Client und Server genutzt werden können.

Zum Beispiel die React Komponente RemoteUserTask:

```javascript
import { RemoteUserTask } from '@5minds/processcube_app_sdk';
```

### Server

Hier steht alles ausschließlich für eine serverseitige Umgebung zur Verfügung. Dazu zählen Funktionen, die mit der Engine arbeiten, oder React Komponenten, die Serverseitig gerendert werden können.

Beispiel:

```javascript
import { startProcess } from '@5minds/processcube_app_sdk/server';
```

Um die Engine URL anzupassen, die von den exportierten Funktionen genutzt wird, muss `PROCESSCUBE_ENGINE_URL` als Umgebungsvariable gesetzt werden. Andernfalls wird localhost mit dem Standardport der Engine genutzt `10560`.

### Client

Es können nur Komponenten und Funktionen importiert werden, die im Browser funktionieren. Zum Beispiel React Komponenten, die einen clientseitigen Router und dessen React Hooks nutzen oder Funktionen, die auf `window` oder generell globale Browser APIs zugreifen möchten.

```javascript
import { DynamicLink } from '@5minds/processcube_app_sdk/client';
```

### External Tasks

External Tasks ermöglichen es, Logik in einer Next.js App auszuführen, die von der ProcessCube Engine als Aufgabe vergeben wird. Dazu wird eine Datei `external_task.ts` (oder `.js`) im `app/`-Verzeichnis der Next.js App angelegt. Der Verzeichnispfad bestimmt das Topic, unter dem die Engine den Task erkennt — z.B. wird `app/order/process/external_task.ts` zum Topic `order/process`.

Die External Tasks werden automatisch erkannt und als eigene Worker-Prozesse gestartet, wenn `useExternalTasks: true` in der SDK-Konfiguration gesetzt ist:

```javascript
// next.config.js
const { withApplicationSdk } = require('@5minds/processcube_app_sdk/server');

module.exports = withApplicationSdk({
  applicationSdk: {
    useExternalTasks: true,
  },
});
```

#### Handler-Signatur

Der Handler wird als `default export` exportiert und erhält bis zu drei Parameter:

```typescript
export default async function handleExternalTask(
  payload: any, // Prozess-Variablen
  task: ExternalTask<any>, // Task-Metadaten (optional)
  signal: AbortSignal, // Abort-Signal (optional)
) {
  // Aufgabe bearbeiten
  return { result: 'done' };
}
```

Der Rückgabewert wird als Ergebnis an die Engine zurückgegeben und steht im Prozess als Variable zur Verfügung.

#### Konfiguration

Über einen benannten `config`-Export können Worker-Einstellungen angepasst werden:

```typescript
import { ExternalTaskConfig } from '@5minds/processcube_app_sdk/server';

export const config: ExternalTaskConfig = {
  lockDuration: 5000, // Lock-Dauer in ms (default: 30000)
  maxTasks: 5, // Gleichzeitige Tasks (default: 10)
};
```

Die `lockDuration` bestimmt, wie oft der Worker der Engine signalisiert, dass er noch aktiv ist. Der Standardwert ist 30 Sekunden.

#### Abort-Handling bei Boundary Events

Wenn ein Boundary Event (z.B. ein Timer) einen External Task abbricht, wird das `AbortSignal` ausgelöst. Damit der Worker schnell auf den Abbruch reagiert, sollte die `lockDuration` reduziert werden — die Engine kann den Abbruch erst beim nächsten Lock-Renewal mitteilen.

| lockDuration    | Max. Verzögerung bis Abort |
| --------------- | -------------------------- |
| 30000 (default) | bis zu 30 Sekunden         |
| 5000            | bis zu 5 Sekunden          |
| 1000            | bis zu 1 Sekunde           |

Vollständiges Beispiel mit Abort-Handling:

```typescript
import { ExternalTaskConfig } from '@5minds/processcube_app_sdk/server';

export const config: ExternalTaskConfig = {
  lockDuration: 5000,
};

export default async function handleExternalTask(payload: any, _task: any, signal: AbortSignal) {
  signal.addEventListener(
    'abort',
    () => {
      console.log('Task wurde durch Boundary Event abgebrochen');
    },
    { once: true },
  );

  // Signal vor und nach asynchronen Operationen prüfen
  if (signal.aborted) return;

  const result = await doWork(payload);

  if (signal.aborted) return;

  return result;
}
```

## Wie kann ich das Projekt aufsetzen?

### Setup/Installation

Das SDK wird über den Node Paketmanager `npm` gebaut.

Für das Installieren und Bauen können folgende Befehle benutzt werden:

```shell
npm ci
npm run build
```

Für ein Productionbuild:

```shell
npm run build:prod
```

Um mit dem Paket lokal zu arbeiten, kann es mit npm in ein anderes Projekt verlinkt werden:

```shell
npm link
npm run watch
```

Im Zielprojekt anschließend:

```shell
npm link @5minds/processcube_app_sdk
```

Bei Problemen mit React muss ggf. noch die React Dependency des Zielprojekts zurück in das SDK gelinkt werden, damit nur eine React Instanz zur Laufzeit existiert:

```shell
npm link <path-to-project>/node_modules/react
```
