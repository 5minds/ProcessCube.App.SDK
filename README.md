# ProcessCube.App.SDK

Das SDK beinhaltet Komponenten und Funktionen für Frontend und Backend (Client/Server) zur einfachen und schnellen Entiwcklung einer ProcessCube App auf Basis von [Next.js](https://nextjs.org/).

## Installation

```shell
npm i @5minds/processcube_app_sdk
```

## Benutzung

Das NPM Paket hat *drei* Exports.

### Default/Common

Hier werden Komponten und Funktionen exportiert, die im Client und Server genutzt werden können.

Zum Beispiel die React Kompontene RemoteUserTask:
```javascript
import { RemoteUserTask } from "@5minds/processcube_app_sdk";
```

### Server

Hier steht alles ausschließlich für eine Serverseitige Umgebung zur Verfügung. Dazu zählen Funktionen die mit der Engine arbeiten, oder React Komponenten, die Serverseitig gerendert werden können.

Beispiel:

```javascript
import { startProcess } from "@5minds/processcube_app_sdk/server";
```

### Client

Es können nur Komponenten und Funktionen imprortiert werden, die im Browser funktionieren. Zum Beispiel React Komponenten, die einen Clientseitigen Router und dessen React Hooks nutzen oder Funktionen die auf `window` oder generell globale Browser APIs zugreifen möchten.

```javascript
import { DynamicLink } from "@5minds/processcube_app_sdk/client";
```

