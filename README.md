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

## Wen kann ich auf das Projekt ansprechen?

1. [Alexander Kasten](mailto:alexander.kasten@5minds.de)
2. [Matthias Danne](mailto:matthias.danne@5minds.de)
3. [Jeremy Hill](mailto:jeremy.hill@5minds.de)
4. [Marius Jahn](mailto:marius.jahn@5minds.de)
