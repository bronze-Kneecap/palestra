# Palestra

Questo file lo legge Claude Code all'inizio di ogni sessione. Riunisce in un
posto solo quello che e emerso nelle chat sul progetto: cos'e l'app, a cosa
deve tendere e come ci si lavora. La cronologia delle chat, con le richieste
e le decisioni di ognuna, e in [STORIA.md](STORIA.md).

Insieme a questo file si caricano altri due file, e valgono sempre:

- le regole sul repository e sul push. La piu importante: ogni commit va sul
  branch di lavoro **e subito anche su `main`** (`git push origin HEAD:main`),
  senza chiedere e senza pull request, perche il proprietario prova l'app
  solo da `main`;
- il profilo del proprietario: come ragiona, come chiede e come vuole le
  risposte.

@AGENTS.md

@PROFILO.md

## Il progetto

Un'app web installabile (PWA) per registrare le serie in palestra dal
telefono, un iPhone, tra una serie e l'altra. Ogni serie diventa una riga del
foglio Google **Allenamenti**, scritta da uno script Apps Script (`Code.gs`).
L'app e servita da GitHub Pages a partire da `main` e si aggiorna da sola a
ogni push.

La usa una persona sola, il proprietario del repository. Non legge il codice:
giudica soltanto il risultato, provando l'app sul telefono.

Tre schermate, che si scorrono di lato o si scelgono dalla barra in basso:

1. **Allenamento** - data, gruppo, esercizio, sottocategoria (solo se
   l'esercizio ne ha), ripetizioni, set, peso, i bottoni Mono, Esplosiva,
   Esecuzione e Aumenta, il commento e **Salva serie**.
2. **Esercizi** - modifica i menu della prima schermata: gruppi muscolari con
   il loro colore, esercizi, sottocategorie. In fondo, il collegamento al
   foglio Google.
3. **Progressi** - l'ultima serie di ogni esercizio, letta dal foglio;
   toccando un esercizio si vede il dettaglio per sottocategoria.

## Obiettivi

Ogni modifica deve avvicinare l'app a questi cinque obiettivi, e nessuna
deve allontanarla da uno di essi.

1. **Una serie in pochi secondi.** Il caso normale e: scegli l'esercizio,
   premi Salva. Tutto il resto e gia compilato come l'ultima volta.
2. **Nessuna attesa, nessuna serie persa.** Salvare e istantaneo; il foglio
   si aggiorna in sottofondo, anche piu tardi se manca la rete, e mai due
   volte per la stessa serie.
3. **Il foglio e lo storico.** Resta leggibile e usabile a mano (somme,
   filtri, checkbox, tendine). L'app non ne rompe mai la struttura e non
   sposta le righe gia scritte.
4. **Semplice da mantenere.** Nessuna dipendenza, nessuna build, un backend
   che fa il minimo. Le regole dei menu stanno nell'app, dove si cambiano
   facilmente.
5. **Minimale, nello stile Apple.** Come Orologio e Promemoria: nero, schede
   grigio scuro, icone disegnate, pochi colori e ognuno con un significato.

## Linee guida UX

### Velocita d'uso

- **Precompila dall'ultima volta**, per lo stesso esercizio e sottocategoria:
  - ripetizioni, set e peso compaiono come placeholder grigi, e un campo
    lasciato vuoto vale il numero grigio (per salvare senza peso si scrive 0);
  - Mono, Esecuzione e Aumenta partono come l'ultima serie;
  - il commento vecchio si vede in grigio ma non viene salvato di nuovo: si
    salva solo un commento scritto adesso.
- Esercizio senza storico: campi vuoti e bottoni allo stato di partenza, cosi
  non restano addosso i numeri dell'esercizio scelto prima.
- **Le serie esplosive sono una categoria a parte**: non entrano nei Progressi
  e non cambiano i suggerimenti delle serie normali. Con Esplosiva accesa,
  tutto si allinea invece all'ultima serie esplosiva.
- **Aumenta** e il promemoria per alzare il peso la volta dopo; si spegne da
  solo se l'esecuzione non e pulita.
- Dopo il salvataggio il modulo e subito pronto per la serie successiva.
  Niente conferme, niente attese sull'azione principale.
- Se la data non e stata scelta a mano, riaprendo l'app torna a oggi.
- Le sottocategorie sono facoltative: servono a ricordare l'attrezzo usato,
  ma l'esercizio resta lo stesso. Il campo compare solo se ce ne sono.

### Layout e tocco

- Mobile-first, iPhone, spesso una mano sola. Aree di tocco di almeno 44 px.
- I bottoni di stato (Mono, Esplosiva, Esecuzione, Aumenta) stanno **sempre
  su una riga**: sui telefoni stretti si rimpicciolisce il testo, sotto i
  360 px spariscono le icone. Hanno larghezza fissa, cosi cambiare stato non
  sposta nient'altro.
- Un tocco passa allo stato successivo: Esecuzione gira Pulita, Sporca,
  Scorretta e ricomincia.
- Con la tastiera aperta la barra in basso sale sopra la tastiera, in
  versione compatta (`visualViewport`).
- Barra in basso con icone chiare, come le tab bar di iOS. Per "modifica" non
  si usa l'ingranaggio.
- Niente scritte superflue: se un dato si vede gia nei campi precompilati,
  non va ripetuto in una riga di testo.

### Colori e testi

- Solo tema scuro: con un tema chiaro, ora e batteria dell'iPhone sparirebbero.
- Colori di sistema iOS (le variabili `--c-*` in `index.html`), uno per
  significato: Esecuzione a semaforo (verde pulita, giallo sporca, rosso
  scorretta), Esplosiva arancione, Aumenta lilla, accento blu. Due bottoni
  vicini non devono avere lo stesso colore con significati diversi.
- Contrasto del testo almeno 4,5:1. Sui colori dei gruppi il testo e nero,
  bianco solo sull'indaco.
- Ogni gruppo muscolare ha un colore, modificabile dalla schermata Esercizi:
  colora il pallino e il bottone Salva e i titoli nei Progressi.
- L'interfaccia e in italiano, con parole brevi ("Scorretta" invece di "non
  va bene"). Se esiste un nome o un colore migliore di quello chiesto, usalo
  e spiega perche.

### Rete, stati ed errori

- Senza rete l'app funziona uguale: i menu vengono dalla copia locale, le
  serie aspettano in coda e partono da sole quando torna la connessione.
- Gli avvisi compaiono solo quando servono e offrono un'azione ("Riprova",
  "Configura"). Se lo script pubblicato e piu vecchio di quello che l'app si
  aspetta, la schermata Allenamento lo dice finche non viene ripubblicato.

## Linee guida di efficienza

- **Tutto in `index.html`**: HTML, CSS e JavaScript senza librerie, framework
  o passi di build. Icone SVG disegnate nel file (`<symbol>`), non emoji.
- **Mai aspettare Apps Script.** Salva serie mette la serie in coda in
  `localStorage` e la manda in sottofondo, una alla volta, finche il foglio
  non conferma. Ogni serie ha un `id`: `doPost` ricorda gli id scritti per
  6 ore, quindi un nuovo invio dopo una risposta persa non crea doppioni.
- **Menu sincronizzati senza sprechi**: ogni modifica parte dopo 800 ms
  (tre rinomine di fila sono una richiesta sola), vince la versione
  modificata per ultima, e l'app rilegge il foglio all'apertura, al ritorno
  in primo piano e al rientro della rete.
- **Backend che fa il minimo.** `Code.gs` non conosce gruppi ed esercizi: li
  scrive come testo. La configurazione dei menu e testo opaco, di cui legge
  solo nome e colore dei gruppi. Ogni filtro sta nell'app.
- **Colonne per titolo, mai per posizione.** Una colonna mancante viene
  inserita accanto alla precedente, e le righe vecchie non si spostano.
- **La serie va sotto l'ultima riga con la Data**, cella per cella e senza
  `appendRow`: checkbox e tendine preparate nel foglio restano al loro posto.
- I numeri restano numeri (`12,5` diventa `12.5`), cosi il foglio fa somme.
- Service worker: la pagina dalla rete e poi dalla cache, gli asset dalla
  cache con aggiornamento in sottofondo. Le chiamate ad Apps Script non
  passano dal service worker.
- Modifiche piccole e mirate. Niente refactor ampi che nessuno ha chiesto.

## Mappa del codice

| File | Cosa contiene |
|---|---|
| `index.html` | L'intera app (circa 2700 righe): stile, tre schermate, logica. Si cerca per nome di costante o funzione. |
| `Code.gs` | Backend Apps Script: scrive le serie, rilegge lo storico, conserva la configurazione dei menu. |
| `sw.js` | Service worker per funzionare offline (`CACHE_NAME`). |
| `manifest.json`, `icon-*.png` | Installazione sulla schermata Home. |
| `appsscript.json`, `.clasp.json`, `.claspignore` | Pubblicazione di `Code.gs` con clasp. |
| `.github/workflows/deploy-appscript.yml` | Pubblica `Code.gs` da `main`, ma solo con i secret (oggi assenti). |
| `DEPLOY.md` | Come ripubblicare `Code.gs`, a mano o in automatico. |
| `.github/agents/workout-tracker.agent.md` | Istruzioni per GitHub Copilot: se cambi le colonne, aggiornale anche li. |

Punti fermi in `index.html`:

- `CATALOGO_PREDEFINITO`: l'elenco di partenza dei menu, usato solo alla
  prima apertura o con "Ripristina elenco predefinito".
- `localStorage`: `allenamento:menu` (menu), `allenamento:ultimeSerie`
  (ultime serie per i suggerimenti), `allenamento:serieInAttesa` (coda degli
  invii), `allenamento:scriptUrl` (URL dello script).
- `URL_PREDEFINITO` e `URL_DISMESSI`: l'URL `/exec` in uso e quelli vecchi,
  che l'app sostituisce da sola.
- `VERSIONE_SCRIPT`: la versione di `Code.gs` che l'app si aspetta.

In `Code.gs`:

- `COLONNE`: Data, Gruppo muscolare, Esercizio, Sottocategoria,
  Ripetizioni, Set, Peso (kg), Mono, Esplosiva, Aumenta, Esecuzione,
  Commento.
- `doGet`: `?action=leggiConfig`, `?action=leggiStorico`; senza azione
  risponde con la versione (utile come prova: `.../exec?action=ping`).
- `doPost`: una serie, oppure `action: 'scriviConfig'` con la configurazione.
- `VERSIONE`, con nel commento sopra una riga per ogni versione.
- `COLORA_GRUPPI`: i colori dei gruppi nel foglio, oggi in pausa (`false`).

## Come si lavora

### Se tocchi `Code.gs`

1. Alza `VERSIONE` e aggiungi la riga nel commento sopra.
2. Se l'app ha bisogno della novita, porta `VERSIONE_SCRIPT` in `index.html`
   allo stesso numero: l'avviso compare finche lo script pubblicato resta
   indietro.
3. L'app deve continuare a salvare le serie anche con lo script vecchio.
4. La pubblicazione automatica e spenta. Di' sempre al proprietario che deve
   ripubblicare a mano, con i passi di `DEPLOY.md`: incolla `Code.gs`, salva,
   **Distribuisci, Gestisci deployment, matita, Versione: Nuova,
   Distribuisci**. Mai "Nuovo deployment": cambierebbe l'URL.

### Verifica

- Prova l'app vera in Chromium headless (Playwright e gia installato) contro
  un finto foglio che esegue il vero `Code.gs`. Prova anche senza rete, con
  una risposta persa e su schermi larghi 320 e 360 px.
- I test e gli script di prova restano nella cartella temporanea della
  sessione, non nel repository.
- Non c'e un iPhone vero: quando qualcosa va confermato sul telefono, dillo.

### Commit

- Messaggi in italiano, al presente, che descrivono il risultato visibile:
  "Aggiunge il bottone Aumenta e la colonna Aumenta nel foglio".
- Poi push sul branch e su `main`, come da `AGENTS.md`.

### Come rispondere al proprietario

Il tono e il modo sono in `PROFILO.md`. In piu, per questo progetto:

- di' sempre se va ripubblicato `Code.gs`, si o no;
- di' quello che non hai potuto verificare, per esempio su un iPhone vero;
- ricorda che l'aggiornamento arriva chiudendo e riaprendo l'app, dopo
  qualche minuto.

## Stato al 11/10/2026

- `Code.gs` su `main` e alla versione 8 (lo storico restituisce anche il
  commento). Nell'ultima chat risultava ancora da ripubblicare.
- Mancano i secret per la pubblicazione automatica (`CLASPRC_JSON`,
  `SCRIPT_ID`, `DEPLOYMENT_ID`) e `.clasp.json` ha ancora il segnaposto.
- I colori dei gruppi nel foglio sono in pausa (`COLORA_GRUPPI = false`).
- Domanda aperta: oggi si vede solo il commento dell'ultima serie. Se la
  volta dopo si salva senza toccarlo, sparisce. Si era proposto di mostrare
  l'ultimo commento scritto finche non se ne scrive uno nuovo.
