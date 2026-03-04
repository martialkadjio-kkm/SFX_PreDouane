# Migration du Projet SFX PreDouane vers Ubuntu

Ce document décrit les étapes nécessaires pour migrer le projet Next.js SFX PreDouane d'un environnement Windows vers Ubuntu Linux.

## Prérequis Système

### 1. Installation de Node.js

**Option A: Via NodeSource (recommandé)**
```bash
# Node.js v20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Option B: Via NVM (plus flexible)**
```bash
# Installation de NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recharger le shell
source ~/.bashrc

# Installer Node.js v20
nvm install 20
nvm use 20
nvm alias default 20
```

Vérifier l'installation:
```bash
node --version  # Devrait afficher v20.x.x
npm --version   # Devrait afficher 10.x.x ou supérieur
```

### 2. Installation de SQL Server pour Linux

```bash
# Ajouter le dépôt Microsoft
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -

# Ajouter le repository SQL Server 2022
sudo add-apt-repository "$(wget -qO- https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/mssql-server-2022.list)"

# Mettre à jour et installer
sudo apt-get update
sudo apt-get install -y mssql-server

# Configuration initiale
sudo /opt/mssql/bin/mssql-conf setup
```

Pendant la configuration:
- Choisir l'édition (Developer ou Express pour le développement)
- Définir le mot de passe SA (minimum 8 caractères, majuscules, minuscules, chiffres et symboles)

Vérifier l'installation:
```bash
systemctl status mssql-server
```

### 3. Installation des outils SQL Server (optionnel)

```bash
# Ajouter le repository des outils
sudo add-apt-repository "$(wget -qO- https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/prod.list)"

# Installer sqlcmd
sudo apt-get update
sudo apt-get install -y mssql-tools unixodbc-dev

# Ajouter au PATH
echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc
source ~/.bashrc
```

## Configuration du Projet

### 1. Cloner ou Copier le Projet

```bash
# Créer le répertoire de destination
sudo mkdir -p /opt/sfx-predouane
sudo chown $USER:$USER /opt/sfx-predouane

# Copier les fichiers du projet
cd /opt/sfx-predouane
# Utiliser git clone ou rsync pour transférer les fichiers
```

### 2. Gestion des Certificats HTTPS

**Option A: Copier les certificats existants**
```bash
# Créer le dossier certificates
mkdir -p /opt/sfx-predouane/certificates

# Copier le fichier .pfx depuis Windows
# (utiliser scp, sftp, ou tout autre moyen de transfert)
```

**Option B: Générer de nouveaux certificats**
```bash
# Installer OpenSSL (généralement déjà installé)
sudo apt-get install -y openssl

# Générer une clé privée et un certificat
cd /opt/sfx-predouane/certificates
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Créer un fichier PFX
openssl pkcs12 -export -out SFX-DEV-03.pfx -inkey key.pem -in cert.pem

# Définir les permissions appropriées
chmod 600 *.pfx *.pem
```

### 3. Configuration des Variables d'Environnement

Créer le fichier `.env.local`:
```bash
cd /opt/sfx-predouane
nano .env.local
```

Contenu du fichier:
```env
# Base de données SQL Server
DATABASE_URL="sqlserver://localhost:1433;database=SFX_PreDouane;user=sa;password=VotreMotDePasse;encrypt=true;trustServerCertificate=true"

# Certificat HTTPS
PFX_PASSPHRASE="votre_passphrase"

# Environnement
NODE_ENV=production
```

Sécuriser le fichier:
```bash
chmod 600 .env.local
```

### 4. Installation des Dépendances

```bash
cd /opt/sfx-predouane

# Installer les dépendances
npm install

# Générer le client Prisma
npx prisma generate

# Exécuter les migrations (si nécessaire)
npx prisma migrate deploy

# Seed de la base de données (si nécessaire)
npm run seed
```

## Configuration du Service Systemd

### 1. Créer le Fichier de Service

```bash
sudo nano /etc/systemd/system/sfx-predouane.service
```

Contenu:
```ini
[Unit]
Description=SFX PreDouane - Application de Pré-Dédouanement
After=network.target mssql-server.service
Wants=mssql-server.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/sfx-predouane
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/sfx-predouane/service-out.log
StandardError=append:/var/log/sfx-predouane/service-err.log

# Variables d'environnement
Environment=NODE_ENV=production
Environment=PORT=3000

# Limites de sécurité
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

### 2. Créer les Répertoires de Logs

```bash
sudo mkdir -p /var/log/sfx-predouane
sudo chown www-data:www-data /var/log/sfx-predouane
```

### 3. Ajuster les Permissions

```bash
# Changer le propriétaire du projet
sudo chown -R www-data:www-data /opt/sfx-predouane

# Permissions spécifiques
sudo chmod 755 /opt/sfx-predouane
sudo chmod 600 /opt/sfx-predouane/.env.local
sudo chmod 600 /opt/sfx-predouane/certificates/*.pfx
```

### 4. Activer et Démarrer le Service

```bash
# Recharger systemd
sudo systemctl daemon-reload

# Activer le service au démarrage
sudo systemctl enable sfx-predouane

# Démarrer le service
sudo systemctl start sfx-predouane

# Vérifier le statut
sudo systemctl status sfx-predouane
```

## Gestion du Service

### Commandes Utiles

```bash
# Démarrer le service
sudo systemctl start sfx-predouane

# Arrêter le service
sudo systemctl stop sfx-predouane

# Redémarrer le service
sudo systemctl restart sfx-predouane

# Voir le statut
sudo systemctl status sfx-predouane

# Voir les logs en temps réel
sudo journalctl -u sfx-predouane -f

# Voir les logs d'application
sudo tail -f /var/log/sfx-predouane/service-out.log
sudo tail -f /var/log/sfx-predouane/service-err.log
```

## Configuration du Pare-feu

```bash
# Autoriser le port 3000 (HTTPS)
sudo ufw allow 3000/tcp

# Vérifier les règles
sudo ufw status
```

## Configuration Nginx (Optionnel - Reverse Proxy)

Si vous souhaitez utiliser Nginx comme reverse proxy:

### 1. Installation de Nginx

```bash
sudo apt-get install -y nginx
```

### 2. Configuration

```bash
sudo nano /etc/nginx/sites-available/sfx-predouane
```

Contenu:
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    # Redirection vers HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate /opt/sfx-predouane/certificates/cert.pem;
    ssl_certificate_key /opt/sfx-predouane/certificates/key.pem;

    location / {
        proxy_pass https://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Activer la Configuration

```bash
# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/sfx-predouane /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

## Sauvegarde et Restauration

### Sauvegarde de la Base de Données

```bash
# Script de sauvegarde
sudo nano /opt/sfx-predouane/scripts/backup-db.sh
```

Contenu:
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/sfx-predouane"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'VotreMotDePasse' \
  -Q "BACKUP DATABASE [SFX_PreDouane] TO DISK = N'$BACKUP_DIR/backup_$DATE.bak' WITH NOFORMAT, NOINIT, NAME = 'Full Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10"
```

Rendre exécutable:
```bash
chmod +x /opt/sfx-predouane/scripts/backup-db.sh
```

### Automatiser les Sauvegardes (Cron)

```bash
# Éditer crontab
sudo crontab -e

# Ajouter une sauvegarde quotidienne à 2h du matin
0 2 * * * /opt/sfx-predouane/scripts/backup-db.sh
```

## Dépannage

### Le service ne démarre pas

```bash
# Vérifier les logs systemd
sudo journalctl -u sfx-predouane -n 50

# Vérifier les logs d'application
sudo tail -n 100 /var/log/sfx-predouane/service-err.log

# Vérifier les permissions
ls -la /opt/sfx-predouane
```

### Problèmes de connexion à la base de données

```bash
# Tester la connexion SQL Server
/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'VotreMotDePasse'

# Vérifier que SQL Server est actif
sudo systemctl status mssql-server

# Vérifier les logs SQL Server
sudo tail -f /var/opt/mssql/log/errorlog
```

### Problèmes de certificats

```bash
# Vérifier les permissions
ls -la /opt/sfx-predouane/certificates/

# Tester le certificat
openssl pkcs12 -info -in /opt/sfx-predouane/certificates/SFX-DEV-03.pfx
```

## Différences Windows vs Ubuntu

### Chemins de Fichiers
- Windows: `C:\PROJET NEXT JS\SFX_PreDouane`
- Ubuntu: `/opt/sfx-predouane`

### Service
- Windows: NSSM (Non-Sucking Service Manager)
- Ubuntu: systemd

### Logs
- Windows: `service_log/` dans le projet
- Ubuntu: `/var/log/sfx-predouane/` ou journalctl

### Permissions
- Ubuntu nécessite une gestion explicite des permissions (chmod/chown)
- Utiliser l'utilisateur `www-data` pour plus de sécurité

## Checklist de Migration

- [ ] Node.js installé (v20+)
- [ ] SQL Server installé et configuré
- [ ] Projet copié dans `/opt/sfx-predouane`
- [ ] Certificats HTTPS configurés
- [ ] Fichier `.env.local` créé et sécurisé
- [ ] Dépendances npm installées
- [ ] Base de données migrée et seedée
- [ ] Service systemd créé et activé
- [ ] Logs configurés
- [ ] Pare-feu configuré
- [ ] Sauvegardes automatiques configurées
- [ ] Tests de connexion réussis

## Support

Pour toute question ou problème, consulter:
- Documentation Next.js: https://nextjs.org/docs
- Documentation Prisma: https://www.prisma.io/docs
- Documentation SQL Server Linux: https://docs.microsoft.com/sql/linux/
