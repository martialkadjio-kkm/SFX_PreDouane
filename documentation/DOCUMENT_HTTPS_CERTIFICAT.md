# Documentation HTTPS: `https://sfx-dev-03:3000`

## 1. Objectif

Cette documentation décrit comment l'application a été sécurisée en HTTPS avec un certificat pour exposer:

- `https://sfx-dev-03:3000/`

## 2. Principe retenu

L'application Next.js ne passe pas par IIS.  
Le serveur HTTPS est lancé directement par Node.js dans `server.js` avec:

- `https.createServer(...)`
- un certificat PFX (`.pfx`)
- une passphrase via variable d'environnement

## 3. Fichiers utilisés

## 3.1 Serveur HTTPS

Fichier: `server.js`

Points importants:

1. Chargement des variables:
```js
require('dotenv').config({ path: '.env.local' });
```

2. Chargement du certificat:
```js
pfx: fs.readFileSync(path.join(__dirname, 'certificates/SFX-DEV-03.pfx'))
```

3. Mot de passe du certificat:
```js
passphrase: process.env.PFX_PASSPHRASE || ''
```

4. Démarrage HTTPS:
```js
createServer(httpsOptions, async (req, res) => { ... }).listen(3000)
```

## 3.2 Certificat

Emplacement:

- `certificates/SFX-DEV-03.pfx`

## 3.3 Variable d'environnement

Fichier:

- `.env.local`

Variable attendue:

- `PFX_PASSPHRASE=...`

## 4. Pré-requis réseau / nom de machine

Pour que l'URL `https://sfx-dev-03:3000` fonctionne:

1. Le nom `sfx-dev-03` doit résoudre vers l'IP du serveur (DNS interne ou fichier `hosts`).
2. Le certificat doit contenir `sfx-dev-03` dans le `CN` ou le `SAN`.
3. Le port `3000` doit être autorisé dans le pare-feu Windows.

## 5. Mise en confiance du certificat (machines clientes)

Si le certificat est auto-signé ou interne:

1. Installer la chaîne (CA) dans `Trusted Root Certification Authorities` sur les clients.
2. Installer le certificat serveur si nécessaire.
3. Vérifier que le navigateur n'affiche plus d'alerte de sécurité.

## 6. Exécution de l'application

## 6.1 En dev (direct)
```powershell
npm run dev
```

## 6.2 En service Windows (recommandé client)
```powershell
.\install-service.ps1 -RunMode production
```

Le service démarre ensuite automatiquement en HTTPS avec `server.js`.

## 7. Vérifications

1. Vérifier URL:
- `https://sfx-dev-03:3000/`

2. Vérifier certificat présenté:
- Le certificat affiché doit être `SFX-DEV-03` (ou équivalent)
- Le nom doit correspondre à `sfx-dev-03`

3. Vérifier logs:
```powershell
Get-Content -Tail 100 .\service_log\service-err.log
Get-Content -Tail 100 .\service_log\service-out.log
```

## 8. Erreurs fréquentes

## 8.1 `ERR_CERT_COMMON_NAME_INVALID`

Cause:
- nom URL ne correspond pas au certificat.

Correctif:
- utiliser un certificat avec SAN `sfx-dev-03`.

## 8.2 `ERR_CERT_AUTHORITY_INVALID`

Cause:
- certificat non approuvé côté client.

Correctif:
- installer la CA dans le magasin de confiance.

## 8.3 Erreur de lecture du PFX

Cause:
- fichier absent/mauvais chemin/passphrase invalide.

Correctif:
- vérifier `certificates/SFX-DEV-03.pfx`
- vérifier `PFX_PASSPHRASE` dans `.env.local`

## 8.4 Port inaccessible

Cause:
- pare-feu ou service arrêté.

Correctif:
- vérifier service Windows (`sc query SFX_PreDouane`)
- ouvrir le port TCP 3000.

## 9. Résumé technique

La sécurisation HTTPS de `https://sfx-dev-03:3000/` repose sur:

1. Serveur Node HTTPS natif (`server.js`).
2. Certificat PFX local (`certificates/SFX-DEV-03.pfx`).
3. Passphrase en variable d'environnement (`PFX_PASSPHRASE`).
4. Résolution réseau du nom `sfx-dev-03`.
5. Confiance du certificat sur les postes clients.
