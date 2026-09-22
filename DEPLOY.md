# Pubblicare Code.gs su Apps Script

L'app web (la cartella servita da GitHub Pages) si aggiorna da sola a ogni push.
Questo documento riguarda solo il backend, cioe `Code.gs`.

## Serve davvero?

Di solito no. `Code.gs` ormai fa due cose sole — scrive una riga nel foglio e
parcheggia la configurazione dei menu — quindi cambia di rado. Finche non lo
tocchi, non c'e niente da pubblicare.

Il workflow `Deploy Google Apps Script` resta spento finche non aggiungi i
secret: segnala che non e configurato e chiude senza errori.

## A mano (il modo piu rapido)

1. Apri il progetto Apps Script collegato al foglio.
2. Incolla il contenuto di `Code.gs`, salva.
3. **Distribuisci -> Gestisci deployment -> matita -> Versione: Nuova -> Distribuisci.**

Il terzo passo e quello che conta: senza di esso l'URL `/exec` continua a
servire la versione precedente, anche se il codice nell'editor e aggiornato.

## In automatico

Aggiungi i secret in *Settings -> Secrets and variables -> Actions*:

| Secret | Dove prenderlo | Obbligatorio |
|---|---|---|
| `CLASPRC_JSON` | contenuto di `~/.clasprc.json` dopo `npx @google/clasp@2.4.2 login` sul tuo computer | si |
| `SCRIPT_ID` | Apps Script -> Impostazioni progetto -> ID script | si, se `.clasp.json` ha ancora il segnaposto |
| `DEPLOYMENT_ID` | Distribuisci -> Gestisci deployment -> ID del deployment attivo | no, ma senza di esso resta da ripubblicare a mano |

Poi *Actions -> Deploy Google Apps Script -> Run workflow* per provarlo subito.

Due avvertenze:

- `CLASPRC_JSON` contiene un refresh token Google. Vale come una password: sta
  nei secret del repository, mai in un file committato. Se revochi l'accesso
  all'app dal tuo account Google, va rigenerato.
- `appsscript.json` viene pubblicato insieme al codice e imposta il fuso orario
  e le impostazioni dell'app web (esecuzione come proprietario, accesso a
  chiunque). Se il tuo progetto usa impostazioni diverse, modificalo prima.
