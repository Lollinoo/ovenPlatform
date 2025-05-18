# OvenPlatform Production Deployment

Questa guida illustra come eseguire il deployment dell'applicazione OvenPlatform in ambiente di produzione.

## Prerequisiti

- Docker e Docker Compose installati
- Certificati SSL per il dominio di produzione (da inserire in `nginx/certs/`)
- Configurazione nginx appropriata in `nginx/conf.d/`

## Struttura dell'ambiente

L'ambiente di produzione è composto da:

- **Frontend**: Interfaccia utente servita da Nginx
- **Backend**: API server Node.js
- **MongoDB**: Database in singolo nodo con autenticazione
- **Nginx**: Proxy inverso che gestisce SSL e routing

## Configurazione iniziale

1. **Preparare i file di environment**:

   Copiare i file di esempio e configurarli:

   ```bash
   cp ../frontend.env.example ../ovenPlatform-web/.env
   cp ../backend.env.example ../ovenPlatform-be/.env
   ```

   Modificare i file in base all'ambiente di produzione.

2. **Preparare i certificati SSL**:

   Inserire i certificati nella directory `nginx/certs/`:

   ```bash
   # Esempio con Let's Encrypt
   cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/certs/
   cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/certs/
   ```

3. **Verificare la configurazione di MongoDB**:

   ```bash
   # Controlla che i file dei secrets siano corretti
   cat secrets/prod/mongo_root_username.txt
   # Non stampare la password
   # cat secrets/prod/mongo_root_password.txt
   cat secrets/prod/mongo_db_name.txt
   ```

## Avvio dell'applicazione

Eseguire il deployment con:

```bash
docker compose -f compose.prod.yaml up -d
```

## Monitoraggio

Controllare i log dei container:

```bash
# Tutti i container
docker compose -f compose.prod.yaml logs -f

# Container specifici
docker compose -f compose.prod.yaml logs -f oven-backend-prod
docker compose -f compose.prod.yaml logs -f mongodb
```

## Manutenzione

### Backup del database

Eseguire un backup di MongoDB:

```bash
docker exec mongodb mongodump --host localhost --port 27017 -u $(cat secrets/prod/mongo_root_username.txt) -p $(cat secrets/prod/mongo_root_password.txt) --authenticationDatabase admin --db $(cat secrets/prod/mongo_db_name.txt) --out /data/backup/$(date +%Y%m%d)
```

### Aggiornamento dell'applicazione

Per aggiornare l'applicazione:

```bash
# Pull delle ultime modifiche
git pull origin main

# Ricostruzione e riavvio dei container
docker compose -f compose.prod.yaml build
docker compose -f compose.prod.yaml up -d
```

## Sicurezza

- Tutte le credenziali sono gestite tramite Docker secrets
- MongoDB utilizza l'autenticazione
- Le comunicazioni esterne passano attraverso Nginx con SSL/TLS
- Reti Docker separate per isolamento
