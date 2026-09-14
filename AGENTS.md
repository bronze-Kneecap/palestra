# Istruzioni per gli agenti

## Repository pulito

Su GitHub devono rimanere solo i file sorgenti, gli asset necessari all'applicazione e le configurazioni utili al progetto.

Prima di agire:

- Verifica che `.gitignore` escluda dipendenze, cartelle temporanee, cache, log, file locali e output di build.
- Non aggiungere o committare `node_modules/`, `.pnpm-store/`, `dist/`, `build/`, `coverage/`, `.cache/`, `.vite/`, `tmp/`, `temp/`, file `.env` o log.
- Mantieni tracciati i file sorgente, gli asset necessari, `package.json` e i lockfile come `pnpm-lock.yaml`.
- Se una cartella temporanea o pesante e gia tracciata, rimuovila dall'indice Git con `git rm -r --cached <percorso>` senza cancellarla dal computer.
- Dopo ogni modifica controlla `git status`, `git check-ignore` e `git diff --check`.
- Non usare `git add -f` per aggirare `.gitignore` senza una motivazione esplicita.

L'obiettivo e mantenere il repository leggero, riproducibile e composto soltanto da sorgenti puliti e file necessari al funzionamento del progetto.
