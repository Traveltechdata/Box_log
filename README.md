# Box Log — WOD adattivo

Web app personale (PWA) per generare allenamenti CrossFit adattati a obiettivo, tempo disponibile e readiness del giorno. Nessun account, nessun backend: tutto vive nel browser del tuo iPhone/Mac tramite `localStorage`.

## Come funziona

- **Profilo**: livello, attrezzatura disponibile, movimenti da evitare, promemoria di allenamento.
- **Check-in** (ogni volta che ti alleni): obiettivo, tempo disponibile, energia, sonno, stress, dolori → calcola una **readiness** 0–100.
- **Generatore**: sceglie un template di sessione adatto a obiettivo/tempo, riempie gli "slot" con movimenti compatibili con la tua attrezzatura e le tue limitazioni, scala volume/intensità in base alla readiness, e valida che stia nel tempo disponibile. Se hai un obiettivo trimestrale attivo su un sollevamento, il generatore lo privilegia nelle sessioni di forza.
- **Storico**: ogni WOD generato viene salvato; puoi segnarlo come svolto con l'RPE percepito, che alimenta il carico di allenamento (`durata × RPE`), visibile anche in un grafico di trend. Include una vista **calendario** con la possibilità di pianificare allenamenti futuri.
- **Obiettivi**: traguardi a medio termine (es. "Back squat 110kg entro 3 mesi") con barra di avanzamento e stato (in linea / in ritardo / raggiunto / scaduto).
- **Motivazione**: streak di allenamenti, giorni dall'ultima sessione, messaggi incoraggianti, e promemoria configurabili (giorni + orario).

Il motore è tutto deterministico (regole + punteggio), niente chiamate esterne: funziona anche offline una volta caricata la pagina la prima volta.

### Nota sui promemoria

Su desktop e Android, se concedi il permesso, ricevi una vera notifica del browser. **Su iPhone Safari le notifiche push richiedono un server dedicato**, che questa app (gratuita, senza backend) non ha: lì il promemoria compare come banner dentro l'app quando la apri, non come notifica in background. È una limitazione della piattaforma, non un bug.

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
- `js/data/templates.js` — "forme" di sessione (AMRAP, For Time, EMOM, Tabata, Strength, Recovery…).
- `js/generator/generateWod.js` — pipeline: obiettivo → template → movimenti → scalatura → validazione → punteggio.
- `js/generator/readiness.js` — calcolo readiness e training load.
- `js/generator/scaling.js` — selezione movimenti, sostituzioni, scalatura per readiness/tempo.
- `js/generator/validation.js` — regole bloccanti e scoring dei candidati.
- `js/goals.js` — logica obiettivi trimestrali (progresso, stato, scadenza).
- `js/motivation.js` — streak, messaggi motivazionali, logica promemoria.
- `js/ui/calendar.js` — griglia calendario mensile.
- `js/ui/chart.js` — grafici SVG (carico di allenamento, volume settimanale).
- `js/storage.js` — persistenza `localStorage` (profilo, sessioni, obiettivi, promemoria).

Aggiungere un movimento o un template è questione di aggiungere una entry nei rispettivi file dati: il generatore lo userà automaticamente se rientra nei pattern/goal giusti.

## Prossimi passi possibili

- Sincronizzazione multi-dispositivo con Supabase (auth + database cloud) — utile anche per notifiche push reali su iPhone tramite un piccolo servizio backend.
- Badge/traguardi motivazionali aggiuntivi.
- App nativa Swift/SwiftUI se in futuro serve HealthKit, Apple Watch o notifiche push native.
