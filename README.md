# Box Log - coach digitale CrossFit

Web app personale (PWA) strutturata come un vero percorso di allenamento: crei un **Piano** (Forza, Skill o Metcon) verso un obiettivo, l'app misura il punto di partenza, propone ogni giorno lo step dovuto, e ricorda dove sei arrivato - non genera mai un allenamento a caso. Nessun account, nessun backend: tutto vive nel browser tramite `localStorage`.

## Il modello: Piano -> Sessione

- **Piano**: un percorso con memoria persistente verso un obiettivo. Tre tipi:
  - **Forza** - progressione lineare 3x5. Parti da un 1RM misurato, il carico sale ad ogni sessione riuscita, si scarica automaticamente dopo 2 fallimenti di fila. Retest del massimale ogni 6 settimane. Ogni sessione ti chiede se vuoi il carico **calcolato automaticamente** (modificabile in ogni momento se ti sembra sbagliato) oppure se preferisci **personalizzare** tu serie, ripetizioni e carico.
  - **Skill** - scala di propedeutici (muscle-up, chest-to-bar, toes-to-bar, pistol squat, handstand walk, rope climb). Avanzi allo step successivo solo dopo 1-2 sessioni "pulite" consecutive sullo step attuale, mai per il calendario.
  - **Metcon** - mesociclo di 6 settimane su un benchmark che scegli tu. Settimana 1 = test baseline, settimane 2-5 = formati che aumentano volume/intensita in sequenza fissa (non casuale), settimana 6 = retest sullo stesso benchmark per misurare il progresso reale.
- **Rotazione automatica**: ogni giorno l'app calcola quale piano attivo e piu "in ritardo" rispetto alla sua cadenza settimanale e lo propone - non serve un calendario fisso da gestire a mano.
- **Sessione**: ha un ciclo di vita esplicito.
  1. **Inizia sessione** -> scegli guidata dal piano / monostrutturale / manuale, poi imposti tempo disponibile e stato fisico **una sola volta**. Questi valori restano bloccati per tutta la sessione (persistiti, sopravvivono a cambi di tab o al chiudere l'app).
  2. **Esecuzione** -> premi il pulsante rotondo **INIZIA** quando sei pronto: parte un timer a fasi che scorre Warm-up -> fase centrale -> WOD, con conto alla rovescia per fase e avanzamento automatico (o manuale, con "Fase successiva"). Ogni sessione guidata (Forza o Skill) segue sempre la struttura completa **Warm-up -> fase centrale -> WOD**: il WOD finale evita attivamente il pattern di movimento appena lavorato, dura sempre tra 8 e 25 minuti, ed e sempre composto da movimenti reali e intensi (mai un solo esercizio leggero per pochi minuti).
  3. **Termina sessione** -> completamento 100% / 50% / non eseguito + RPE. Questo aggiorna il piano collegato e va nello storico. In qualsiasi momento puoi premere **Annulla sessione** per tornare alla home senza salvare nulla, se cambi idea.
- **Sotto i 30 minuti** l'app non salta l'allenamento ne comprime uno step pieno: propone mobilita o un movimento leggero. Da 30 a 90 minuti la durata scala normalmente.
- **Piu piani in parallelo**: puoi avere piu piani attivi contemporaneamente, anche dello stesso tipo (es. due piani Forza su movimenti diversi) - la rotazione automatica li propone tutti a turno in base a quanto ciascuno e "in ritardo".

## Le tre modalita di sessione

1. **Guidata dal piano** - l'app pesca lo step dovuto e lo prescrive per intero.
2. **Monostrutturale** - corsa outdoor, bici su strada, nuoto, vogatore o bike indoor: scegli l'attivita, registri distanza e durata reali a fine sessione.
3. **Manuale** - scegli prima il focus di oggi (Solo WOD / Forza / Skill), poi decidi il WOD: **lo scrivo io** (movimenti dal database interno) oppure **genera tu**, scegliendo tra tab di formato ben separate (For Time / AMRAP / EMOM / Total reps) e 2-3 movimenti - il motore calcola reps, round e carichi. Il warm-up viene sempre costruito automaticamente sui pattern coinvolti.

## Cosa tiene traccia di cosa

- **Piani** (tab "Piani"): crea/vedi i percorsi attivi, con retest dovuti evidenziati.
- **Storico** (tab "Storico"): ogni sessione salvata con completamento, RPE, carico; grafico del carico di allenamento; vista calendario.
- **Profilo**: dati anagrafici (nome, eta, peso, genere), attrezzatura, massimali (1RM) - genere e 1RM alimentano rispettivamente il carico Rx mostrato nei metcon e i carichi delle sessioni di Forza.

## Deploy gratuito su GitHub Pages

1. Crea un repository su GitHub (es. `box-log`).
2. Carica **tutto** il contenuto di questa cartella nella root del repository (drag & drop dalla pagina "Upload files" di GitHub, oppure via terminale/Working Copy).
3. Settings -> Pages -> Source: Deploy from a branch -> Branch: main / (root) -> Save.
4. Dopo 1-2 minuti il sito e live su `https://TUO_USERNAME.github.io/box-log/`.

Su iPhone: apri il link in Safari -> icona Condividi -> **Aggiungi alla schermata Home**.

## Come verificare che un aggiornamento sia arrivato davvero

In alto a sinistra c'e un **numero di versione** (es. `v5 - 21 ago 2026`). Dopo ogni aggiornamento:

1. Aspetta 1-2 minuti che GitHub Pages ripubblichi.
2. Chiudi del tutto l'app (swipe up dalle app recenti) e riaprila.
3. Controlla il numero di versione: se non e cambiato, il telefono sta mostrando una versione in cache - vai su Impostazioni Safari -> Avanzate -> Dati dei siti web, cancella il dominio, oppure rimuovi l'icona dalla Home e riaggiungila.

Il Service Worker usa una strategia network-first: prova sempre a scaricare l'ultima versione online, e usa la cache solo come riserva offline.

## Se carichi i file da iPad

Il drag-and-drop di cartelle intere da Safari/File non e sempre affidabile. Se l'app sembra non aggiornarsi, verifica su github.com che la cartella `js/data/` contenga `skills.js` e che `js/generator/` contenga `planEngine.js` - se mancano, l'upload e stato parziale. Per questo tipo di lavoro un client Git dedicato come **Working Copy** e molto piu affidabile del trascinamento tra app.

## Struttura del codice

- `js/data/movements.js` - database movimenti (pattern, skill, fatica, attrezzatura, carico Rx, sostituzioni).
- `js/data/templates.js` - formati metcon (FOR_TIME, AMRAP_ROUNDS, AMRAP_REPS, EMOM, TABATA, DEATH_BY, STEADY, RECOVERY).
- `js/data/skills.js` - le 6 scale di propedeutici skill, con criteri di avanzamento espliciti.
- `js/data/warmups.js` - drill di riscaldamento specifici per pattern di movimento.
- `js/generator/planEngine.js` - creazione piani, progressione forza/skill/metcon, rotazione automatica tra piani attivi.
- `js/generator/generateWod.js` - costruttore di metcon per formato (usato dai piani metcon).
- `js/generator/readiness.js`, `scaling.js`, `validation.js` - readiness, scalatura, scoring/varieta.
- `js/storage.js` - persistenza `localStorage`: profilo, piani, sessioni (inclusa la **sessione attiva**, che rende il ciclo Inizia/Termina resistente ai cambi schermata), promemoria.
- `js/motivation.js`, `js/ui/calendar.js`, `js/ui/chart.js` - streak/promemoria, calendario, grafici.
- `js/app.js` - controller UI: ciclo di vita sessione, gestione piani, storico, profilo.

## Prossimi passi (ordine concordato)

Questa versione copre la **Fase 1**: CrossFit ristrutturato con architettura Piano->Sessione, piu il framework condiviso (monostrutturali, toggle di completamento, sessione persistente). Le fasi successive, non ancora costruite:

2. HYROX - piano basato sulle 8 stazioni ufficiali (SkiErg, Sled push/pull, Burpee broad jump, Row, Farmer's carry, Sandbag lunge, Wall ball) con fasi base -> compromised running -> simulazione.
3. ATHX - piano sui 3 blocchi (Forza / Endurance / Metcon X) con simulazione completa a 2,5h come retest.
4. Triathlon Sprint (750m/20km/5km) - piano di endurance multi-disciplina, senza scadenza gara fissa.

Sincronizzazione multi-dispositivo (Supabase) resta un'estensione futura, utile anche per notifiche push reali su iPhone.
