# Guida all'utilizzo del sistema di autenticazione di OvenPlatform

Questa guida fornisce istruzioni dettagliate su come utilizzare il sistema di autenticazione implementato in OvenPlatform, sia per gli sviluppatori frontend che per gli utenti dell'API.

## Panoramica

Il sistema di autenticazione di OvenPlatform fornisce un meccanismo completo per:
- Registrazione utenti
- Login e autenticazione
- Verifica email
- Recupero password
- Protezione delle rotte sensibili

## Prerequisiti

Prima di iniziare, assicurati di avere:
- Un account email per la registrazione
- Un client HTTP (browser, Postman, cURL) per interagire con l'API
- Le credenziali di accesso al sistema (se già registrato)

## Flusso di autenticazione

### 1. Registrazione (Signup)

Per creare un nuovo account:

```
POST /v1/auth/signup
```

**Corpo della richiesta:**
```json
{
  "name": "Nome Utente",
  "email": "utente@esempio.com",
  "password": "password-sicura"
}
```

**Risposta di successo:**
```json
{
  "success": true,
  "message": "Utente registrato. Controlla la tua email per verificare l'account."
}
```

### 2. Verifica Email

Dopo la registrazione, riceverai un'email con un link o un token di verifica:

```
POST /v1/auth/verify-email
```

**Corpo della richiesta:**
```json
{
  "token": "token-di-verifica-ricevuto-via-email"
}
```

**Risposta di successo:**
```json
{
  "success": true,
  "message": "Email verificata con successo. Ora puoi effettuare il login."
}
```

### 3. Login

Per accedere al sistema:

```
POST /v1/auth/login
```

**Corpo della richiesta:**
```json
{
  "email": "utente@esempio.com",
  "password": "password-sicura"
}
```

**Risposta di successo:**
```json
{
  "success": true,
  "message": "Login effettuato con successo",
  "user": {
    "id": "user-id",
    "name": "Nome Utente",
    "email": "utente@esempio.com"
  }
}
```

**Nota importante:** Il token JWT viene automaticamente salvato come cookie HTTP-only e non è accessibile tramite JavaScript. Non è necessario gestire manualmente il token.

### 4. Accesso alle rotte protette

Tutte le rotte sotto `/v1/ome/streams` sono protette e richiedono l'autenticazione:

```
GET /v1/ome/streams
GET /v1/ome/streams/active
GET /v1/ome/streams/:streamName/stats
POST /v1/ome/streams/generate-signed-url
GET /v1/ome/streams/:streamName/thumb.jpg
```

Per accedere a queste rotte, il client deve:
1. Aver effettuato il login con successo
2. Includere i cookie nelle richieste (credentials: 'include')

**Esempio di richiesta autenticata (JavaScript):**
```javascript
const response = await fetch('/v1/ome/streams', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include' // IMPORTANTE: include i cookie nella richiesta
});

const data = await response.json();
```

**Risposta se non autenticati:**
```json
{
  "success": false,
  "message": "Non autenticato. Effettua il login."
}
```

### 5. Recupero password

Se hai dimenticato la password:

```
POST /v1/auth/forgot-password
```

**Corpo della richiesta:**
```json
{
  "email": "utente@esempio.com"
}
```

**Risposta di successo:**
```json
{
  "success": true,
  "message": "Se questo indirizzo email è registrato, riceverai una email con le istruzioni per il reset della password."
}
```

Successivamente, riceverai un'email con un token o un link per il reset della password:

```
POST /v1/auth/reset-password/:token
```

**Corpo della richiesta:**
```json
{
  "password": "nuova-password-sicura"
}
```

**Risposta di successo:**
```json
{
  "success": true,
  "message": "La password è stata reimpostata con successo. Ora puoi effettuare il login."
}
```

### 6. Logout

Per terminare la sessione:

```
POST /v1/auth/logout
```

**Risposta di successo:**
```json
{
  "success": true,
  "message": "Logout effettuato con successo"
}
```

## Gestione degli errori

Il sistema di autenticazione restituisce messaggi di errore dettagliati:

- **401 Unauthorized**: Non autenticato o sessione scaduta
- **403 Forbidden**: Autenticato ma non autorizzato ad accedere alla risorsa
- **400 Bad Request**: Dati mancanti o non validi
- **422 Unprocessable Entity**: Validazione fallita (es. password troppo breve)

## Implementazione nel frontend

### Esempio con React

```jsx
import { useState } from 'react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Errore durante il login');
      }
      
      // Reindirizza o aggiorna lo stato dell'app
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h1>Login</h1>
      {error && <div className="error">{error}</div>}
      <div>
        <label>Email:</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
      </div>
      <div>
        <label>Password:</label>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
      </div>
      <button type="submit">Accedi</button>
      <p>
        <a href="/forgot-password">Password dimenticata?</a> | 
        <a href="/signup">Registrati</a>
      </p>
    </form>
  );
}
```

## Considerazioni sulla sicurezza

- Utilizza sempre HTTPS in produzione
- Non memorizzare informazioni sensibili nel localStorage o sessionStorage
- Gestisci sempre correttamente gli errori e fornisci feedback agli utenti
- Implementa un sistema di rate limiting per prevenire attacchi brute force
- Utilizza password complesse e uniche
