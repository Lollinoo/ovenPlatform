# OvenPlatform Deployment

Questo è il repository di deployment per OvenPlatform, una piattaforma per la gestione e lo streaming di media utilizzando OvenMediaEngine.

## Componenti

- **Frontend**: UI React costruita con Vite
- **Backend**: API Express.js 
- **Proxy**: Server Nginx per reverse proxy

## Requisiti

- Docker e Docker Compose v2
- Accesso a un server OvenMediaEngine

## Setup di produzione

### 1. Configurazione delle variabili d'ambiente

Copia i file di esempio e configurali:

```bash
# Per il backend
cp ../ovenPlatform-be/.env.example ../ovenPlatform-be/.env.production
# Per il frontend
cp ../ovenPlatform-web/.env.example ../ovenPlatform-web/.env.production
# Per il deployment
cp .env.prod.example .env.prod
```

Modifica i file con i valori appropriati per il tuo ambiente di produzione.

### 2. Creazione dei certificati SSL (opzionale per HTTPS)

Per un ambiente di produzione, è consigliabile utilizzare HTTPS. Genera certificati SSL:

```bash
# Per i test locali, puoi usare certificati auto-firmati
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/ovenplatform.key \
  -out nginx/certs/ovenplatform.crt
```

In produzione, usa Let's Encrypt o certificati validi dal tuo provider.

### 3. Avvio dei servizi

```bash
# Costruisci e avvia tutti i servizi
docker compose --env-file .env.prod -f compose.prod.yaml up -d --build

# Per visualizzare i log
docker compose --env-file .env.prod -f compose.prod.yaml logs -f
```

### 4. Verifica del funzionamento

Accedi all'applicazione web:
- Frontend: http://ovenplatform.local
- API: http://ovenplatform.local/api/v1/streams

## Gestione in produzione

### Aggiornamento dei servizi

```bash
# Pull delle ultime modifiche
git pull

# Ricostruzione e riavvio dei servizi
docker compose --env-file .env.prod -f compose.prod.yaml up -d --build
```

### Arresto dei servizi

```bash
docker compose --env-file .env.prod -f compose.prod.yaml down
```

### Backup dei dati persistenti

```bash
# Crea una directory per i backup
mkdir -p backups

# Backup della configurazione
tar -czvf backups/nginx-config-$(date +%Y%m%d).tar.gz nginx/
```

## Risoluzione dei problemi

### Controllo dello stato dei container

```bash
docker compose --env-file .env.prod -f compose.prod.yaml ps
```

### Controllo dei log

```bash
# Tutti i servizi
docker compose --env-file .env.prod -f compose.prod.yaml logs

# Servizio specifico (ad esempio il backend)
docker compose --env-file .env.prod -f compose.prod.yaml logs oven-backend
```

## Struttura dei file

```
ovenPlatform-depl/
├── compose.prod.yaml      # Configurazione Docker Compose
├── .env.prod              # Variabili d'ambiente per il deployment
└── nginx/                 # Configurazione Nginx
    ├── nginx.conf         # Configurazione principale
    ├── conf.d/            # Configurazione dei virtual host
    ├── certs/             # Certificati SSL
    └── logs/              # Log di Nginx
```
