#!/bin/bash

echo "===== OvenPlatform Development Setup Validator ====="

# Verifico la presenza dei file necessari
echo -n "Controllo dei file di secrets... "
if [ -f ./secrets/mongo_root_username.txt ] && [ -f ./secrets/mongo_root_password.txt ] && [ -f ./secrets/mongo_db_name.txt ]; then
  echo "OK"
else
  echo "ERRORE: I file di secrets non sono tutti presenti!"
  exit 1
fi

# Verifico che i file di environment esistano
echo -n "Controllo dei file di environment... "
if [ -f ./mongo.env.development ]; then
  echo "OK"
else
  echo "ERRORE: Il file mongo.env.development non esiste!"
  exit 1
fi

# Verifico che i valori nei file di secrets corrispondano ai valori in mongo.env.development
echo -n "Controllo di coerenza tra secrets e variabili d'ambiente... "
DB_NAME_SECRET=$(cat ./secrets/mongo_db_name.txt)
DB_USERNAME_SECRET=$(cat ./secrets/mongo_root_username.txt)
DB_PASSWORD_SECRET=$(cat ./secrets/mongo_root_password.txt)

DB_NAME_ENV=$(grep MONGO_INITDB_DATABASE ./mongo.env.development | cut -d '=' -f2)
DB_USERNAME_ENV=$(grep MONGO_INITDB_ROOT_USERNAME ./mongo.env.development | cut -d '=' -f2)
DB_PASSWORD_ENV=$(grep MONGO_INITDB_ROOT_PASSWORD ./mongo.env.development | cut -d '=' -f2)

if [ "$DB_NAME_SECRET" == "$DB_NAME_ENV" ] && [ "$DB_USERNAME_SECRET" == "$DB_USERNAME_ENV" ] && [ "$DB_PASSWORD_SECRET" == "$DB_PASSWORD_ENV" ]; then
  echo "OK"
else
  echo "ERRORE: I valori nei secrets non corrispondono ai valori in mongo.env.development!"
  echo "DB_NAME_SECRET: $DB_NAME_SECRET vs DB_NAME_ENV: $DB_NAME_ENV"
  echo "DB_USERNAME_SECRET: $DB_USERNAME_SECRET vs DB_USERNAME_ENV: $DB_USERNAME_ENV"
  echo "DB_PASSWORD_SECRET: [NASCOSTA] vs DB_PASSWORD_ENV: [NASCOSTA]"
  exit 1
fi

echo -e "\nTutto sembra configurato correttamente!"
echo -e "Puoi avviare l'ambiente di sviluppo con:\n"
echo -e "    docker compose -f compose.dev.yaml up -d\n"
echo -e "Per monitorare i logs puoi usare:\n"
echo -e "    docker compose -f compose.dev.yaml logs -f\n"

exit 0
