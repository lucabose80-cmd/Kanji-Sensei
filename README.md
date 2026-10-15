# 漢 Kanji Sensei – Dein persönliches Kanji-Notizbuch (PWA)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flucabose80-cmd%2FKanji-Sensei)

Eine moderne, offlinefähige Progressive Web App (PWA) zum täglichen Üben und Schreiben von 2.500 japanischen Kanji in ein Notizheft.

Repository: [https://github.com/lucabose80-cmd/Kanji-Sensei](https://github.com/lucabose80-cmd/Kanji-Sensei)

---

## 🚀 1-Klick Deployment auf Vercel

### Option 1: Automatische Verknüpfung über GitHub (Empfohlen)
1. Öffne das [Vercel Dashboard](https://vercel.com/dashboard).
2. Klicke auf **"Add New..."** ➔ **"Project"**.
3. Wähle dein GitHub-Repository `lucabose80-cmd/Kanji-Sensei` aus und klicke auf **"Import"**.
4. Vercel erkennt **Vite** automatisch:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Klicke auf **"Deploy"** – in ca. 20 Sekunden ist deine Webapp unter deiner persönlichen `*.vercel.app`-Domain online!
6. *Vorteil*: Jeder zukünftige `git push` aktualisiert deine Live-App automatisch.

### Option 2: Über Vercel CLI im Terminal
```powershell
npx.cmd vercel login
npx.cmd vercel --prod
```

---

## 📱 Auf dem Smartphone installieren (PWA)

Sobald die App auf Vercel läuft (oder über `npm run dev -- --host` im lokalen WLAN):

- **iOS (Safari)**:
  1. Öffne die URL in Safari.
  2. Tippe auf das **Teilen-Icon** (Viereck mit Pfeil).
  3. Wähle **"Zum Home-Bildschirm"**.
- **Android (Chrome)**:
  1. Öffne die URL in Google Chrome.
  2. Tippe auf das Drei-Punkte-Menü ➔ **"App installieren"** oder **"Zum Startbildschirm hinzufügen"**.

Die App funktioniert dank Offline Service Worker auch im Flugmodus oder ohne Internetverbindung.

---

## 🎴 Kernfunktionen

1. **2.500 Kanji-Datenbank**:
   - Alle 2.136 offiziellen Jōyō-Kanji (Grundschule Grade 1–6 + Sekundarstufe) + 364 relevante Jinmeiyō-/JLPT-Kanji.
   - Deutsche Bedeutungen, On-Lesungen (Katakana), Kun-Lesungen (Hiragana), Strichanzahl, JLPT (N5–N1) und Komposita-Beispiele mit Furigana.
2. **Lernstatus-Verwaltung**:
   - ⚪ Noch nicht gelernt | 🟡 Lerne ich (Tagespool) | 🟢 Kann ich (Gemeistert).
   - Schnellauswahl per Klick (z. B. "Alle N5 zu 'Lerne ich'").
   - Echtzeit-Volltextsuche nach Deutsch, Romaji, Kana oder Kanji.
3. **Notizheft-Schreibtraining**:
   - Tägliche Abfrage (5–20 Zeichen, Standard: 10).
   - Fokus auf deutsche Bedeutung: *Schreibe das Zeichen jetzt in dein Heft! 📝*
   - Tianzige 2x2-Gitter (田字格) für sauberen Proportionsabgleich.
   - Schritt-für-Schritt-Strichfolge mit Play/Pause und Nummerierung.
   - Wiederholungsschleife für unsichere Zeichen, bis alle Zeichen des Tages sitzen.
4. **Lokale Persistenz & Backup**:
   - Speicherung im Browser-LocalStorage.
   - JSON-Export/Import zur Sicherung und Übertragung zwischen Geräten.

---

## 🧪 Tests & Lokale Entwicklung

```powershell
# Abhängigkeiten installieren
npm.cmd install

# Lokalen Entwicklungsserver starten
npm.cmd run dev

# Unit-Tests ausführen
npm.cmd test

# 2.500 Kanji-Integritätstests ausführen
npx.cmd tsx tests/kanjiService.test.ts

# Produktions-Build testen
npm.cmd run build
```
