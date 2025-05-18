#!/bin/bash

echo "===== OvenPlatform Production Setup Validator ====="

# Verifico la presenza dei file necessari
echo -n "Controllo dei file di secrets di produzione... "
if [ -f ./secrets/prod/mongo_root_username.txt ] && [ -f ./secrets/prod/mongo_root_password.txt ] && [ -f ./secrets/prod/mongo_db_name.txt ]; then
  echo "OK"
else
  echo "ERRORE: I file di secrets di produzione non sono tutti presenti!"
  echo "Esegui il seguente comando per creare le directory necessarie:"
  echo "  mkdir -p ./secrets/prod"
  echo "Poi crea i seguenti file:"
  echo "  ./secrets/prod/mongo_root_username.txt"
  echo "  ./secrets/prod/mongo_root_password.txt"
  echo "  ./secrets/prod/mongo_db_name.txt"
  exit 1
fi

# Verifico che i file di environment esistano
echo -n "Controllo dei file di environment... "
if [ -f ./mongo.env ]; then
  echo "OK"
else
  echo "ERRORE: Il file mongo.env non esiste!"
  exit 1
fi

# Verifico che i valori nei file di secrets corrispondano ai valori in mongo.env
echo -n "Controllo di coerenza tra secrets e variabili d'ambiente... "
DB_NAME_SECRET=$(cat ./secrets/prod/mongo_db_name.txt)
DB_USERNAME_SECRET=$(cat ./secrets/prod/mongo_root_username.txt)
DB_PASSWORD_SECRET=$(cat ./secrets/prod/mongo_root_password.txt)

DB_NAME_ENV=$(grep MONGO_INITDB_DATABASE ./mongo.env | cut -d '=' -f2)
DB_USERNAME_ENV=$(grep MONGO_INITDB_ROOT_USERNAME ./mongo.env | cut -d '=' -f2)
DB_PASSWORD_ENV=$(grep MONGO_INITDB_ROOT_PASSWORD ./mongo.env | cut -d '=' -f2)

if [ "$DB_NAME_SECRET" == "$DB_NAME_ENV" ] && [ "$DB_USERNAME_SECRET" == "$DB_USERNAME_ENV" ] && [ "$DB_PASSWORD_SECRET" == "$DB_PASSWORD_ENV" ]; then
  echo "OK"
else
  echo "ERRORE: I valori nei secrets non corrispondono ai valori in mongo.env!"
  echo "DB_NAME_SECRET: $DB_NAME_SECRET vs DB_NAME_ENV: $DB_NAME_ENV"
  echo "DB_USERNAME_SECRET: $DB_USERNAME_SECRET vs DB_USERNAME_ENV: $DB_USERNAME_ENV"
  echo "DB_PASSWORD_SECRET: [NASCOSTA] vs DB_PASSWORD_ENV: [NASCOSTA]"
  echo "Assicurati che i valori nei secrets corrispondano ai valori in mongo.env!"
  exit 1
fi

# Controllo della configurazione nginx
echo -n "Controllo della configurazione nginx... "
if [ -d ./nginx/conf.d ] && [ -d ./nginx/certs ]; then
  echo "OK"
else
  echo "AVVISO: Le directory nginx/conf.d o nginx/certs non esistono."
  echo "Questo è necessario per la configurazione del proxy in produzione."
  echo "Esegui il seguente comando per crearle:"
  echo "  mkdir -p ./nginx/conf.d ./nginx/certs"
  echo "Poi inserisci la configurazione nginx e i certificati SSL nelle directory appropriate."
fi

# Controllo dei file .env del backend e frontend
echo -n "Controllo dei file .env di backend e frontend... "
if [ -f ../ovenPlatform-be/.env ] && [ -f ../ovenPlatform-web/.env ]; then
  echo "OK"
else
  echo "AVVISO: Uno o entrambi i file .env non esistono."
  echo "Assicurati di creare i file .env per backend e frontend prima di avviare l'applicazione in produzione."
  echo "Puoi copiarli dai file di esempio:"
  echo "  cp ../backend.env.example ../ovenPlatform-be/.env"
  echo "  cp ../frontend.env.example ../ovenPlatform-web/.env"
fi

echo -e "\nTutto sembra configurato correttamente (o sono stati forniti avvisi)!"
echo -e "Puoi avviare l'ambiente di produzione con:\n"
echo -e "    docker compose -f compose.prod.yaml up -d\n"
echo -e "Per monitorare i logs puoi usare:\n"
echo -e "    docker compose -f compose.prod.yaml logs -f\n"

exit 0
