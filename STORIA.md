# Storia delle chat

Il riassunto di tutte le chat di Claude Code sul progetto, dalla piu vecchia
alla piu recente. Ogni voce dice cosa e stato chiesto, cosa e stato fatto e
le decisioni da ricordare. I titoli sono quelli che compaiono nell'elenco
delle chat. Le regole che ne derivano sono raccolte in [CLAUDE.md](CLAUDE.md).

## Prima delle chat (10-19 settembre)

Il proprietario carica i primi file e sistema l'app a mano: interfaccia,
diagnostica del salvataggio su Google Sheets, un solo numero per le
ripetizioni, il primo `Code.gs` e il catalogo esercizi modificabile.

## 22/09 - Refactoring app e UI esercizi

**Richiesta:** nella seconda pagina vedere tutti gli esercizi divisi per
gruppo muscolare, e poterli modificare, eliminare e creare. Nella barra in
basso solo icone: il piu per Allenamento e, per Esercizi, un'icona che faccia
capire "modifica", ma non un ingranaggio.

**Fatto:** schermata Esercizi dedicata con tutti i gruppi, rinomina ed
eliminazione; tolto il pulsante "Gestisci esercizi" dalla pagina di log.
Pull request 12, 13 e 14 unite a `main`.

**Da ricordare:** da qui in poi il lavoro finito va su `main` senza aspettare.

## 22/09 - Integrazione Google Fogli e menu

**Richiesta 1:** "l'applicazione non funziona, cambia l'architettura". La
prima pagina manda i dati al foglio; la seconda serve solo a modificare i
menu a tendina della prima. Lo script Apps Script non deve filtrare esercizi
o gruppi: li scrive come testo, e il filtro sta nell'app, dove e piu facile
da cambiare.

**Fatto:** `Code.gs` passa da 400 a 130 righe e scrive soltanto. I menu
partono da `CATALOGO_PREDEFINITO` in cima a `index.html` e si modificano sul
telefono, anche senza rete.

**Richiesta 2:** la configurazione deve esportarsi da sola, per ritrovarla
ovunque si apra l'app.

**Fatto:** i menu si sincronizzano tramite il foglio "Configurazione", che li
conserva come testo senza interpretarli. Vince la modifica piu recente.

**Poi:** il workflow di pubblicazione non era mai partito, per un errore nel
file YAML. Ora e riparato e finisce verde anche senza secret, segnalando che
manca la configurazione. Nasce `DEPLOY.md`.

**Da ricordare:** l'URL `/exec` serve l'ultima *pubblicazione*, non l'ultimo
codice salvato. Dopo ogni modifica a `Code.gs` serve "Versione: Nuova".

## 22/09 - Ultimo input esercizio preconsigliato

**Richiesta:** scelti gruppo ed esercizio, vedere come suggerimento l'ultima
serie di quell'esercizio.

**Fatto:** ripetizioni, set, peso e mono si riempiono con l'ultima serie,
ricordata sul telefono. Un esercizio senza storico svuota i campi. Lo script
non andava toccato.

## 23/09 - Esercizi: sottocategorie e visualizzazione dati

**Richiesta:** quattro compiti, uno alla volta e poi una verifica d'insieme.

1. Sottocategorie degli esercizi, modificabili come gli esercizi e
   facoltative: ricordano l'attrezzo usato, ma l'esercizio resta lo stesso.
   Nel foglio una colonna in piu.
2. Una terza pagina a destra con peso, ripetizioni e set di ogni esercizio, e
   il dettaglio per sottocategoria. Nella prima pagina gli ultimi dati come
   placeholder.
3. Un bottone per le serie esplosive: una categoria a parte, che non compare
   nella terza pagina e non conta per i suggerimenti, dove si prende la serie
   precedente.
4. Grafica: la tastiera copriva il menu in basso. Tutto piu minimale, icone
   stilizzate, contrasti curati, un colore modificabile per ogni gruppo.
   "Mi piace molto l'estetica di Apple in app come Promemoria e Orologio."

**Fatto:** tutti e quattro, con le colonne `Sottocategoria` ed `Esplosiva` e
la schermata Progressi. La barra sale sopra la tastiera, l'aspetto segue
Orologio e Promemoria e ogni gruppo ha il suo colore. Un campo lasciato vuoto
vale il numero grigio.

**Scelte fatte senza chiedere:** solo tema scuro; i Progressi mostrano solo
gli esercizi fatti almeno una volta; la data torna a oggi se non scelta a
mano; nell'elenco predefinito "Curl" ha le sottocategorie.

## 23/09 - Elenco gruppi muscolari ed esercizi

**Domanda:** l'elenco dei gruppi e degli esercizi, e se un aggiornamento
dell'app cancella le modifiche fatte.

**Risposta:** l'elenco nel codice e solo quello di partenza. Le modifiche
stanno sul telefono e sul foglio, e un aggiornamento dell'app non le tocca.

## 23/09 - Pulsante stato pulizia movimento

**Richiesta:** accanto a Mono ed Esplosiva, un bottone uguale ai vicini per
la pulizia di esecuzione: pulita (verde, la base), sporca (arancione), non va
bene (rossa). Ogni tocco passa all'opzione successiva. "Se trovi nomi o
colori migliori fai pure."

**Fatto:** bottone Esecuzione e colonna `Esecuzione` nel foglio.
"Scorretta" al posto di "non va bene", piu corto; giallo al posto di
arancione per "Sporca", perche Esplosiva accesa e gia arancione.

## 05/10-08/10 - Livello pulizia esecuzione

**Richiesta 1:** la visualizzazione nell'app e perfetta, ma da errore. Se si
riesce senza stravolgere la struttura, un invio istantaneo. E dire se va
cambiato lo script del foglio.

**Fatto:** l'errore era lo script pubblicato ancora vecchio. Ora il
salvataggio e istantaneo: la serie va in una coda sul telefono e parte in
sottofondo, in ordine, senza doppioni, anche dopo un'assenza di rete.

**Poi:** l'avviso diceva ancora "versione 2". Il deploy usato dall'app era
rimasto indietro: e stato creato un deployment nuovo e l'app e passata da
sola al nuovo URL.

**Richiesta 2:** scegliendo l'esercizio, oltre all'ultimo peso, avere la
pulizia gia selezionata come l'ultima volta.

**Fatto:** Esecuzione riprende l'ultimo valore dell'esercizio. Le serie
esplosive contano a parte.

## 08/10 - Colori gruppi muscolari in Allenamenti

**Richiesta 1:** colorare la colonna "Gruppo muscolare" del foglio con i
colori dei gruppi scelti nell'app, senza toccare il resto. Commenti in
italiano, codice minimale, nessuna dipendenza nuova.

**Fatto:** `aggiornaColoriGruppi()` in `Code.gs` (versione 5).

**Richiesta 2:** mettere in pausa i colori. Nel foglio Mono ed Esplosiva sono
checkbox ed Esecuzione una tendina, preparate in anticipo, e le serie
finivano in fondo perche quelle righe sembravano occupate. "Forse conviene
rilevare come ultima immissione la data."

**Fatto:** la serie va sotto l'ultima riga con la data, cella per cella;
checkbox e tendine restano. Colori in pausa con `COLORA_GRUPPI = false`
(versione 6).

**Richiesta 3:** scrivere da qualche parte di mandare sempre su `main`: "non
revisiono il codice ma solo il feedback reale, e lo posso provare solo su
main".

**Fatto:** regola in `AGENTS.md`.

## 11/10 - Pulsante aumentare peso esercizio

**Fatto, in quattro passi:**

1. Bottone **Aumenta** e colonna `Aumenta`: il promemoria per alzare il peso
   la volta dopo. Si spegne con un'esecuzione sporca o scorretta (versione 7).
2. Aumenta acceso diventa lilla invece che blu.
3. I bottoni stanno sempre su una riga. Tolte la riga "Ultima serie del..." e
   il riquadro del promemoria: l'ultima serie ora si vede nei controlli. Mono,
   Esecuzione e Aumenta partono come l'ultima volta e il commento vecchio
   compare in grigio. `Code.gs` restituisce anche il commento (versione 8).
4. Accendendo Esplosiva tutto segue l'ultima serie esplosiva. Se il foglio
   risponde in ritardo i bottoni si riallineano, a meno che non siano stati
   cambiati a mano. Il campo Commento si allarga per mostrare tutto il testo.

**Rimasto aperto:** ripubblicare `Code.gs` alla versione 8. E una domanda:
mostrare l'ultimo commento scritto finche non se ne scrive uno nuovo, invece
del solo commento dell'ultima serie?

## 11/10 - Progetto palestra ClaudeCode

**Richiesta:** creare un progetto Claude Code che riunisca tutte le chat, con
una descrizione e degli obiettivi da usare come linee guida, per esempio di
UX o di efficienza.

**Fatto:** `CLAUDE.md`, che Claude Code legge a ogni sessione, e questo file.
