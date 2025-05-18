# MongoDB Development Setup

Questa guida spiega come è configurato MongoDB nell'ambiente di sviluppo di OvenPlatform.

## Configurazione

MongoDB è configurato come singolo nodo (non replica set) con autenticazione abilitata. I dati vengono persistiti in un volume Docker dedicato.

### Files chiave:

- `compose.dev.yaml`: Configurazione Docker Compose per l'ambiente di sviluppo
- `mongo.env.development`: Variabili d'ambiente per MongoDB
- `secrets/`: Directory contenente i secrets per l'autenticazione MongoDB

### Variabili d'ambiente

Le seguenti variabili sono configurate:

- `MONGO_INITDB_DATABASE`: Nome del database predefinito
- `MONGO_INITDB_ROOT_USERNAME`: Nome utente dell'amministratore di MongoDB
- `MONGO_INITDB_ROOT_PASSWORD`: Password dell'amministratore di MongoDB
- `MONGO_INITDB_AUTH`: Abilita l'autenticazione (true/false)

### Secrets

Per motivi di sicurezza, le credenziali vengono passate anche tramite Docker secrets:

- `mongo_root_username.txt`: Username dell'amministratore
- `mongo_root_password.txt`: Password dell'amministratore
- `mongo_db_name.txt`: Nome del database predefinito

## Accesso al database

### Da un container all'interno della rete Docker:

```
mongodb://azmin:Passw0rd!@ct-mongodb-dev:27017/ovenPlatform?authSource=admin
```

### Dall'host locale:

```
mongodb://azmin:Passw0rd!@localhost:27018/ovenPlatform?authSource=admin
```

## Verificare la configurazione

È disponibile uno script per verificare che la configurazione MongoDB sia corretta:

```bash
./check-mongo-config.sh
```

## Risolvere problemi comuni

1. **Errore di connessione**: Assicurati che il container MongoDB sia in esecuzione con `docker ps`
2. **Errore di autenticazione**: Verifica che le credenziali siano corrette in tutti i file
3. **Database non trovato**: Verifica che il nome del database sia corretto

Per ulteriori dettagli, consulta i logs con:

```bash
docker compose -f compose.dev.yaml logs ct-mongodb-dev
```
