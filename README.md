# Spielkasten 🎮

Eine Sammlung kinderfreundlicher Zwei-Spieler-Brettspiele als Progressive Web App (PWA).

Komplett lokal im Browser: keine Accounts, keine Werbung und kein Tracking.

## 🎮 Enthaltene Spiele

### 🎲 Deutsches Dame
Das klassische Dame-Spiel mit deutschen Regeln. Schlage gegnerische Steine, werde zur Dame und blockiere deinen Gegner!

**Features:**
- Vollständige deutsche Dame-Regeln
- Schlagpflicht und Mehrfachschlag
- Damen-Promotion
- Klare visuelle Hinweise

### 🎯 Mühle (Nine Men's Morris)
Ein strategisches Spiel aus dem Mittelalter. Bilde Mühlen, um gegnerische Steine zu entfernen!

**Features:**
- Alle 3 Spielphasen: Setzen, Ziehen, Fliegen
- Automatische Mühlen-Erkennung
- Korrekte Entfernungsregeln (nicht aus Mühlen, wenn möglich)
- Fliegen bei nur 3 Steinen

### 🔢 Sudoku
Zahlenrätsel für eine Person, direkt im Browser erzeugt.

**Features:**
- Fünf Schwierigkeitsstufen: kinder, leicht, mittel, schwer und profi
- Jedes Rätsel hat genau eine Lösung
- Eingaben prüfen, Lösung anzeigen und Spielstand speichern

### 🚢 Schiffe versenken
- Zwei Spieler an einem Gerät, mit geheimer Aufstellung
- Klassische Flotte: 5er, 4er, zwei 3er und 2er-Schiff
- Schiffe dürfen sich nicht berühren

### 🧠 Codeknacker
- Knacke einen geheimen Code aus vier Farben
- Schwarzer Hinweis: Farbe und Platz richtig; weißer Hinweis: Farbe richtig, Platz falsch
- Zehn Versuche, Autospeicherung und komplett offline

### 🔢 2048
- Schiebe gleiche Zahlen zusammen und erreiche 2048
- Wischgesten und Pfeiltasten, Bestwert und Autospeicherung

### 💣 Minenfeld
- 9×9-Minensuchfeld mit 10 Minen
- Erster Zug ist immer sicher, Flaggen per langem Druck und Autospeicherung

### 🧀 Käsekästchen
- Zwei Spieler ziehen abwechselnd Linien und schließen Felder
- Geschlossenes Kästchen bringt einen Punkt und einen Extrazug

## 🚀 Schnellstart

```bash
# Repository klonen
git clone https://github.com/<dein-user>/spielkasten.git
cd spielkasten

# Tests ausführen
node --test game.test.js
node --test muehle.test.js
node sudoku.test.js

# Lokalen Server starten (optional)
npx serve .
# oder
python -m http.server 8080
```

Öffne dann `index.html` in einem modernen Browser.

## Deployment

### GitHub Pages

Aktiviere unter **Settings → Pages** die Veröffentlichung aus dem `main`-Branch. Spielkasten funktioniert sowohl unter einer Projekt-URL wie `https://<user>.github.io/spielkasten/` als auch unter einer eigenen Domain.

### Docker + Traefik

```bash
cp .env.example .env
# SPIELKASTEN_HOST in .env auf deine Domain setzen
docker compose up -d --build
```

Die Compose-Datei erwartet ein vorhandenes externes Docker-Netzwerk `traefik`.

## 🎯 Spielregeln

### Deutsches Dame

#### Grundregeln
- **Ziel**: Alle gegnerischen Steine schlagen oder blockieren
- **Brett**: 8×8 Felder, nur dunkle Felder werden bespielt
- **Steine**: Jeder Spieler startet mit 12 Steinen

#### Züge
- **Normal**: Diagonal vorwärts auf ein benachbartes freies Feld
- **Dame**: Kann vorwärts und rückwärts diagonal beliebig weit ziehen
- **Schlagpflicht**: Wenn schlagen möglich, muss geschlagen werden
- **Mehrfachschlag**: Nach einem Schlag mit dem gleichen Stein weiterschlagen
- **Rückwärtsschlag**: Ein normaler Stein darf vorwärts und rückwärts schlagen

#### Dame werden
- Ein Stein wird zur Dame, wenn er die gegnerische Grundreihe erreicht
- Damen können sich frei diagonal bewegen

#### Spielende
- **Sieg**: Gegner hat keine Steine mehr oder kann nicht mehr ziehen
- **Remis**: Beide Spieler können sich nicht mehr bewegen

### Mühle (Nine Men's Morris)

#### Grundregeln
- **Ziel**: Gegner auf weniger als 3 Steine reduzieren oder blockieren
- **Brett**: 24 Punkte in 3 Quadraten verbunden durch Linien
- **Steine**: Jeder Spieler hat 9 Steine

#### Spielphasen

##### 1. Setzphase
- Spieler setzen abwechselnd ihre 9 Steine auf freie Punkte
- **Mühle**: 3 eigene Steine in einer Reihe (horizontal oder vertikal)
- Bei Mühle: Ein gegnerischer Stein wird entfernt
- Nicht aus einer Mühle entfernen, wenn andere Steine verfügbar

##### 2. Zugphase
- Steine werden zu benachbarten freien Punkten gezogen
- Weiterhin Mühlen bilden und Steine entfernen

##### 3. Flugphase (bei 3 Steinen)
- Spieler mit nur 3 Steinen kann zu **jedem** freien Punkt springen
- Ermöglicht Comeback auch aus schwieriger Position

#### Spielende
- **Sieg**: Gegner hat weniger als 3 Steine
- **Sieg**: Gegner kann keinen legalen Zug mehr machen
- **Remis**: Drei gleiche Zugstellungen oder 50 Züge ohne entfernten Stein

## 🛠️ Technische Details

### Architektur
```
├── index.html      # Spiele-Auswahl (Landing Page)
├── dame.html       # Dame Spielseite
├── muehle.html     # Mühle Spielseite
├── game.js         # Dame Spiellogik (Node.js-kompatibel)
├── app.js          # Dame UI-Controller
├── muehle.js       # Mühle Spiellogik (Node.js-kompatibel)
├── muehle-app.js   # Mühle UI-Controller
├── sudoku.html      # Sudoku-Spielseite
├── sudoku.js        # Sudoku-Generator und Spiellogik
├── sudoku-app.js    # Sudoku UI-Controller
├── sw.js           # Service Worker für Offline-Nutzung
├── manifest.json   # PWA-Manifest
├── game.test.js    # Dame Test-Suite
└── muehle.test.js  # Mühle Test-Suite
└── sudoku.test.js   # Sudoku Test-Suite
```

### PWA-Features
- **Service Worker**: Caching aller Assets für Offline-Nutzung
- **Web App Manifest**: Installierbar auf Homescreen
- **localStorage**: Persistenz des Spielstands pro Spiel
- **Responsive**: Optimiert für alle Bildschirmgrößen

### Browser-Unterstützung
- Chrome/Edge (empfohlen)
- Firefox
- Safari (iOS 11.3+)
- Samsung Internet

## 🧪 Tests

Die Test-Suites verwenden den Node.js eingebauten Test Runner:

```bash
# Alle Tests ausführen
node --test

# Einzelne Test-Dateien
node --test game.test.js
node --test muehle.test.js

# Mit Ausgabe
node --test --verbose
```

### Dame Test-Abdeckung
- ✅ Brett-Initialisierung
- ✅ Grundlegende Bewegungen
- ✅ Schlagregeln und -pflicht
- ✅ Damen-Promotion
- ✅ Damen-Bewegungen
- ✅ Spielende-Erkennung
- ✅ Serialisierung/Deserialisierung
- ✅ Neustart-Funktionalität

### Mühle Test-Abdeckung
- ✅ Brett-Initialisierung (24 Punkte)
- ✅ Adjazenz-Struktur
- ✅ Mühlen-Erkennung
- ✅ Setzphase
- ✅ Zugphase
- ✅ Flugphase (bei 3 Steinen)
- ✅ Stein-Entfernungsregeln
- ✅ Spielende-Erkennung
- ✅ Serialisierung/Deserialisierung
- ✅ Status-Nachrichten

## 📱 Installation

### Als PWA installieren

1. Öffne die App im Browser
2. Klicke auf "Zum Homescreen hinzufügen" (Chrome/Edge)
3. Oder: Klicke den "Installieren"-Button in der App

### Manuelle Installation

```bash
# Server starten
npx serve . -p 8080

# Im Browser öffnen
open http://localhost:8080
```

## 🎨 Anpassung

### Farben ändern
Die Farben können in den HTML-Dateien im CSS-Bereich angepasst werden.

## 📄 Lizenz

Copyright © 2026 Tarek Becker. Veröffentlicht unter GPL-3.0-or-later. Details stehen in [LICENSE](LICENSE); Hinweise zu eingebundenen Komponenten in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## 🙏 Credits

Erstellt mit ❤️ für kinderfreundliche Brettspiele.
