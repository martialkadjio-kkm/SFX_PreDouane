# Guide Complet: Lancer SFX_PreDouane en Service Windows

## 1. Objectif

Ce document explique comment exécuter l'application Next.js `SFX_PreDouane` en tant que service Windows (démarrage automatique), avec NSSM.

Le projet contient déjà les scripts:

- `install-service.ps1`
- `uninstall-service.ps1`

## 2. Prérequis

Avant l'installation du service, vérifier:

1. Windows (machine locale ou client).
2. PowerShell lancé en **Administrateur**.
3. Node.js installé (`node -v`).
4. Dépendances installées dans le projet (`npm ci` ou `npm install`).
5. Build de production disponible (`npm run build`) si mode `production`.
6. Fichiers requis présents:
   - `.env.local`
   - `server.js`
   - `certificates/SFX-DEV-03.pfx`
7. NSSM présent dans:
   - `nssm-2.24\win64\nssm.exe`

## 3. Préparation du projet

Dans le dossier projet:

```powershell
cd "D:\PROJET NEXT JS\SFX_PreDouane"
npm ci
npm run build
```

Note:

- Si tu installes le service en `RunMode dev`, le build n'est pas obligatoire.
- Pour un usage client stable, privilégier `RunMode production`.

## 4. Installation du service Windows

### 4.1 Commande standard (mode dev)

```powershell
.\install-service.ps1
```

### 4.2 Commande recommandée (mode production)

```powershell
.\install-service.ps1 -RunMode production
```

Le script fait automatiquement:

1. Détection de NSSM win64 dans le projet.
2. Suppression du service existant s'il existe.
3. Création du service `SFX_PreDouane`.
4. Configuration:
   - Démarrage: `Automatic`
   - Environnement: `NODE_ENV=dev` ou `NODE_ENV=production`
   - Dossier d'exécution: racine du projet
   - Script Node: `server.js`
5. Configuration des logs:
   - `service_log/service-out.log`
   - `service_log/service-err.log`
6. Démarrage du service.

## 5. Vérifier l'état du service

```powershell
sc.exe query SFX_PreDouane
```

Tu dois voir `STATE : 4 RUNNING`.

Tu peux aussi vérifier dans `services.msc`:

- Nom: `SFX_PreDouane`
- Type de démarrage: `Automatique`

## 6. Consulter les logs

```powershell
Get-Content -Tail 100 .\service_log\service-err.log
Get-Content -Tail 100 .\service_log\service-out.log
```

## 7. Dépannage (erreurs fréquentes)

## 7.1 `Unexpected status SERVICE_PAUSED`

Cause fréquente: le processus Node plante immédiatement.

Action:

1. Lire `service_log/service-err.log`.
2. Corriger l'erreur applicative.
3. Réinstaller le service:

```powershell
.\install-service.ps1 -RunMode production
```

## 7.2 `Access is denied` pendant install/stop/remove

Cause: PowerShell non lancé en administrateur.

Action: relancer PowerShell en mode **Administrateur**.

## 7.3 `Build Next.js introuvable (.next\BUILD_ID)`

Cause: mode `production` sans build.

Action:

```powershell
npm run build
.\install-service.ps1 -RunMode production
```

## 7.4 Erreurs certificat HTTPS (`.pfx` / passphrase)

Cause: fichier certificat absent ou `PFX_PASSPHRASE` invalide dans `.env.local`.

Action:

1. Vérifier `certificates/SFX-DEV-03.pfx`.
2. Vérifier `.env.local`.
3. Redémarrer le service.

## 8. Redémarrer / arrêter le service

```powershell
sc.exe stop SFX_PreDouane
sc.exe start SFX_PreDouane
```

## 9. Désinstallation du service

```powershell
.\uninstall-service.ps1
```

## 10. Processus conseillé pour livraison client

1. Valider localement:
   - `npm run build` OK
   - service démarre en `production`
2. Copier le projet complet chez le client (ou installer dépendances sur place).
3. Vérifier les variables `.env.local` du client.
4. Installer:

```powershell
.\install-service.ps1 -RunMode production
```

5. Vérifier:
   - `sc.exe query SFX_PreDouane`
   - logs dans `service_log`

## 11. Checklist rapide

- [ ] PowerShell Administrateur
- [ ] `node -v` OK
- [ ] `npm ci` OK
- [ ] `npm run build` OK (si production)
- [ ] `.env.local` présent
- [ ] `.pfx` présent
- [ ] `.\install-service.ps1 -RunMode production`
- [ ] Service `RUNNING`
- [ ] Logs propres
