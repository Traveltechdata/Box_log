# Box Log — WOD adattivo

Web app personale (PWA) per generare allenamenti CrossFit adattati a obiettivo, tempo disponibile e readiness del giorno. Nessun account, nessun backend: tutto vive nel browser del tuo iPhone/Mac tramite `localStorage`.

## Come funziona

- **Profilo**: livello, attrezzatura disponibile, movimenti da evitare.
- **Check-in** (ogni volta che ti alleni): obiettivo, tempo disponibile, energia, sonno, stress, dolori → calcola una **readiness** 0–100.
- **Generatore**: sceglie un template di sessione adatto a obiettivo/tempo, riempie gli "slot" con movimenti compatibili con la tua attrezzatura e le tue limitazioni, scala volume/intensità in base alla readiness, e valida che stia nel tempo disponibile.
- **Storico**: ogni WOD generato viene salvato; puoi segnarlo come svolto con l'RPE percepito, che alimenta il carico di allenamento (`durata × RPE`) usato per evitare di ripetere troppo spesso gli stessi pattern.

Il motore è tutto deterministico (regole + punteggio), niente chiamate esterne: funziona anche offline una volta caricata la pagina la prima volta.

## Deploy gratuito su GitHub Pages

1. Crea un nuovo repository su GitHub (es. `box-log`).
2. Carica tutti i file di questa cartella nella root del repository (oppure, da terminale sul Mac):
   ```bash
   cd box-log
   git init
   git add .
   git commit -m "Box Log v1"
   git branch -M main
   git remote add origin https://github.com/TUO_USERNAME/box-log.git
   git push -u origin main
   ```
3. Su GitHub: **Settings → Pages → Source: Deploy from a branch → Branch: main / (root)** → Save.
4. Dopo un paio di minuti il sito sarà live su `https://TUO_USERNAME.github.io/box-log/`.

## Installarla sull'iPhone

1. Apri il link `https://TUO_USERNAME.github.io/box-log/` in **Safari** sull'iPhone.
2. Tocca l'icona **Condividi** (il quadrato con la freccia verso l'alto).
3. Scorri e tocca **Aggiungi alla schermata Home**.
4. Da quel momento l'icona si apre come un'app a schermo intero, e funziona anche offline (grazie al service worker) dopo il primo caricamento.

## Backup dei dati

I dati restano solo su quel dispositivo/browser: se cancelli i dati di Safari o cambi telefono li perdi. Nella tab **Storico** trovi **Esporta JSON** per salvare un backup e **Importa JSON** per ripristinarlo (anche su un altro dispositivo).

## Estendere il motore

- `js/data/movements.js` — database dei movimenti (pattern, skill, fatica, attrezzatura, sostituzioni).
- `js/data/templates.js` — "forme" di sessione (AMRAP, For Time, EMOM, Strength, Recovery…).
- `js/generator/generateWod.js` — pipeline: obiettivo → template → movimenti → scalatura → validazione → punteggio.
- `js/generator/readiness.js` — calcolo readiness e training load.
- `js/generator/scaling.js` — selezione movimenti, sostituzioni, scalatura per readiness/tempo.
- `js/generator/validation.js` — regole bloccanti e scoring dei candidati.

Aggiungere un movimento o un template è questione di aggiungere una entry nei rispettivi file dati: il generatore lo userà automaticamente se rientra nei pattern/goal giusti.

## Prossimi passi possibili

- Sincronizzazione multi-dispositivo con Supabase (auth + database cloud).
- Grafici di training load nello Storico.
- App nativa Swift/SwiftUI se in futuro serve HealthKit, Apple Watch o notifiche.
