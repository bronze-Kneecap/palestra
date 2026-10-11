# Il proprietario: stile e modo di pensare

Questo file non elenca le richieste (quelle sono in [CLAUDE.md](CLAUDE.md) e
[STORIA.md](STORIA.md)). Descrive il modo di ragionare emerso in tutte le
chat sulla palestra, per capire cosa serve anche quando non viene detto.
Vale per ogni chat del progetto.

## In breve

L'app e costruita per uso personale, in palestra. Il proprietario pensa da
utente, non da programmatore. Giudica solo quello che prova sul telefono e
chiede poco e in fretta. Si aspetta che Claude capisca l'intento, lo
realizzi per intero, lo verifichi e lo metta online senza passaggi in piu.

## Come giudica

- **Conta solo il risultato provato.** Non legge il codice: "non revisiono
  il codice ma solo il feedback reale". Consegna sempre qualcosa che si
  prova subito, su `main`, e racconta cosa cambia nell'app, non come e fatto.
- **Lavora a giri brevi.** Chiede, prova, torna con "ora funziona pero...".
  Ogni consegna e una tappa: meglio una cosa piccola che funziona oggi che
  una grande domani.
- **Quello che funziona non si tocca.** "la visualizzazione che ho e
  perfetta", "senza cambiare la struttura", "senza grandi cambiamenti".
  Modifiche mirate, niente ritocchi che nessuno ha chiesto.

## Come pensa il prodotto

- **Dal punto di vista di chi si allena.** Tra una serie e l'altra, con il
  telefono in mano e poco tempo. Ogni idea serve a toccare e scrivere meno:
  suggerire l'ultimo dato, ricordare la scelta dell'ultima volta, salvare
  senza toccare nulla. La domanda guida e: quanti tocchi costa?
- **Per analogia.** "un tasto come i vicini", "come mono e esplosiva",
  "come le ripetizioni e il peso". Se una regola vale per un elemento, deve
  valere anche per quelli simili: estendila da solo, senza aspettare la
  richiesta successiva.
- **Lo stato sta nei controlli, non nelle scritte.** Ha fatto togliere la
  riga "Ultima serie del..." e il riquadro del promemoria: le informazioni
  dell'ultima volta devono comparire gia dentro campi e bottoni. Bottoni che
  si accendono o girano tra piu stati si, frasi di spiegazione no.
- **Ogni parte ha un compito solo.** "la prima pagina serve per..., la
  seconda serve solo a...", "il filtro e interno all'applicazione cosi piu
  facile da modificare". Se qualcosa non funziona non esita a cambiare
  l'architettura, ma vuole la logica dove si modifica facilmente e tutto il
  resto il piu semplice possibile.
- **Il perche viene dall'uso reale.** "le sottocategorie servono a ricordare
  che strumento ho usato, ma l'esercizio e il medesimo". Il motivo detto e
  la vera specifica: dati e comportamenti si modellano su quello, non sulla
  frase letterale.
- **Automatico, sempre.** "esporta in automatico", "da ovunque apro l'app",
  "fai in automatico il push". Se un passo puo farlo la macchina, lo fa la
  macchina.
- **Il foglio Google e suo.** Lo usa anche a mano: checkbox, tendine, colori.
  L'app si adatta a quelle personalizzazioni e non le sovrascrive. Davanti a
  una funzione che disturba preferisce metterla in pausa piuttosto che
  cancellarla.
- **Estetica Apple.** Promemoria e Orologio sono il riferimento: minimale,
  icone stilizzate, contrasti curati, pochi colori ognuno con un significato.
  Quando indica un colore preciso (il lilla per Aumenta), si usa quello.

## Come chiede

- **Messaggi brevi, scritti dal telefono,** in italiano parlato, spesso
  senza punteggiatura e con refusi. Comandi secchi: "risolvi", "fai commit",
  "manda a main".
- **Parole approssimate per le cose tecniche:** "code.js" per `Code.gs`,
  "excel" per il foglio Google, "ho fatto il deploy su tutte le versioni".
  Conta l'intento: non serve correggere i termini.
- **Fissa l'essenziale e lascia liberi i dettagli.** "se trovi nomi o colori
  migliori fai pure. l'importante che sia un tasto come i vicini".
  L'essenziale va rispettato alla lettera; sul resto scegli il meglio e
  spiega in una riga perche.
- **Separa obbligatorio e facoltativo.** "se riesci a diminuire la latenza
  bene, senno non e un problema". Rispetta quell'ordine di priorita.
- **Propone soluzioni come ipotesi.** "forse conviene rilevare come ultima
  immissione la data", "if e esplosiva escludi e prendi precedente". Vanno
  prese sul serio e verificate; se c'e un modo migliore, va detto.
- **Piu compiti insieme, ma con metodo:** "falli uno alla volta e poi
  controlla che non vanno in conflitto e che l'applicazione funziona".
- **Una domanda e solo una domanda:** "non modificare niente. voglio solo
  l'elenco". Quando chiede un'informazione, non si tocca il codice.

## Come vuole le risposte

- Brevi, concrete, in italiano semplice, senza gergo. Prima cosa si vede
  nell'app, poi cosa resta da fare a mano.
- Sempre esplicito se c'e qualcosa da fare, come ripubblicare lo script: e
  la domanda piu frequente ("avvisami se devo incollare il code.gs"). Se si,
  passi numerati con i nomi esatti dei menu.
- Se dice di aver gia fatto un passaggio e l'errore resta, e vero: cerca la
  causa reale e, se puoi, risolvila tu. Era successo con il deployment
  rimasto alla versione 2.
- Le scelte fatte di tua iniziativa vanno dichiarate in breve, cosi si
  possono ribaltare. Al massimo una domanda, con gia una proposta.

## Errori da non ripetere

- **Decidere al posto suo.** Le cautele che vanno contro il suo modo di usare
  l'app vengono ribaltate. Aumenta ripartiva spento "per non segnarlo senza
  volerlo", ed e stato chiesto di precompilarlo come tutto il resto. Segui
  il suo modello mentale; se vedi un rischio, dillo in una riga invece di
  cambiare il comportamento.
- **Aggiungere testo dove bastano i controlli:** righe informative, riquadri,
  spiegazioni sullo schermo.
- **Lasciare il lavoro a meta:** un branch non portato su `main`, un passo
  manuale non detto, una pull request da approvare.
