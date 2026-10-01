# Expense API - Backend (.NET 8/11)

API REST backend développée en C# avec ASP.NET Core, Entity Framework Core (ORM), MySQL et authentification sécurisée par JWT.

---

## Prérequis

Avant de cloner et lancer le projet, assurez-vous d'avoir installé sur votre machine :

* Le [SDK .NET](https://dotnet.microsoft.com/) (version 8.0 ou 11.0 selon votre configuration).
* Un serveur **MySQL** (via XAMPP, Docker ou MySQL Server natif).
* (Optionnel) L'outil global EF Core CLI pour les migrations :
```bash
dotnet tool install --global dotnet-ef
```


---

## Installation et Lancement (Pas à pas)

### 1. Cloner le projet

```bash
git clone https://github.com/YulianGuinand/expense.git
cd expense/backend
```

### 2. Restaurer les packages NuGet

Téléchargez toutes les dépendances du projet :

```bash
dotnet restore
```

### 3. Configurer les variables d'environnement / Configuration

Créez ou dupliquez un fichier de configuration (`appsettings.Development.json` à la racine du dossier `backend/` et renommer le en `appsettings.json`) en vous basant sur la structure suivante. Pensez à y adapter vos identifiants MySQL et votre clé secrète JWT :

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=[DB_NAME];Uid=[DB_USER];Pwd=[DB_PASSWORD];"
  },
  "Jwt": {
    "Key": "votre_cle_secrete_ultra_securisee_et_assez_longue_pour_jwt"
  }
}
```

### 4. Créer la base de données MySQL

Connectez-vous à votre SGBD MySQL et créez une base vide nommée `expense` (ou autrement) :

```sql
CREATE DATABASE expense;
```

### 5. Appliquer les migrations EF Core

Générez les tables dans votre base de données MySQL à l'aide des migrations existantes :

```bash
dotnet dotnet-ef database update
```

*(Si vous utilisez l'outil global standard installé sur votre poste, la commande peut être simplement `dotnet ef database update`)*.

### 6. Lancer l'application

Démarrez le serveur en mode développement (avec rechargement à chaud) :

```bash
dotnet watch run
```

---

## Documentation et Tests (Swagger)

Une fois l'application lancée, l'URL du serveur s'affichera dans le terminal (par exemple `http://localhost:5256`).

* **Interface Swagger (UI) :** `http://localhost:<votre-port>/swagger`
* **Endpoints principaux :**
* `POST /api/Auth/register` : Inscription d'un nouvel utilisateur.
* `POST /api/Auth/login` : Connexion (génération du token JWT).
* `GET /api/User` : Récupération de la liste des utilisateurs (Protégé par JWT).
* `GET /api/User/admin-only` : Espace restreint aux administrateurs (Rôle `Admin`).



---

## Architecture du Projet

```text
backend/
├── Controllers/         # Contrôleurs API (AuthController, UserController, etc.)
├── Data/                # Contexte de base de données (AppDbContext)
├── DTOs/                # Objets de transfert de données (Data Transfer Objects)
├── Models/              # Entités de la base de données (User, etc.)
├── Services/            # Logique métier (AuthService pour le JWT)
├── Migrations/          # Fichiers de migration Entity Framework Core
├── Properties/          # Paramètres de lancement (launchSettings.json)
├── Program.cs           # Point d'entrée et configuration des services / middleware
└── backend.csproj       # Fichier projet et dépendances NuGet

```