# Expense API - Backend (.NET 8/11)

API REST backend développée en C# avec ASP.NET Core, Entity Framework Core (ORM), MySQL et authentification sécurisée par JWT.

---

## Prérequis

Avant de cloner et lancer le projet, assurez-vous d'avoir installé sur votre machine :

- Le [SDK .NET](https://dotnet.microsoft.com/) (version 9.0).
- Avoir une source pour telecharger les nugets

```bash
dotnet nuget add source "https://api.nuget.org/v3/index.json" -n "nuget.org"
```

- Un serveur **MySQL** (via XAMPP, Docker ou MySQL Server natif).
- (Optionnel) L'outil global EF Core CLI pour les migrations :

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

Créez ou dupliquez un fichier de configuration (`appsettings.json.example` à la racine du dossier `backend/` et renommer le en `appsettings.json`) en vous basant sur la structure suivante. Pensez à y adapter vos identifiants MySQL et votre clé secrète JWT :

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

_(Si vous utilisez l'outil global standard installé sur votre poste, la commande peut être simplement `dotnet ef database update`)_.

### 6. Lancer l'application

Démarrez le serveur en mode développement (avec rechargement à chaud) :

```bash
dotnet watch run
```

---

## Documentation et Tests (Swagger)

Une fois l'application lancée, l'URL du serveur s'affichera dans le terminal (par exemple `http://localhost:5256`).

- **Interface Swagger (UI) :** `http://localhost:<votre-port>/swagger`
- **Endpoints principaux :**
- `POST /api/Auth/register` : Inscription d'un nouvel utilisateur (crée automatiquement son portefeuille `01. Personnel`).
- `POST /api/Auth/login` : Connexion (génération du token JWT).
- `GET /api/User` : Récupération de la liste des utilisateurs (Protégé par JWT).
- `GET /api/User/admin-only` : Espace restreint aux administrateurs (Rôle `Admin`).
- `GET /api/Wallet` : Liste des portefeuilles de l'utilisateur connecté (Protégé par JWT).
- `GET /api/Wallet/{id}` : Détail d'un portefeuille (Protégé par JWT).
- `POST /api/Wallet` : Création d'un portefeuille (`goal` optionnel, 201 Created, Protégé par JWT).
- `PUT /api/Wallet/{id}` : Mise à jour du nom et de l'objectif (`goal`, Protégé par JWT ; absent = objectif effacé).
- `DELETE /api/Wallet/{id}` : Suppression d'un portefeuille (Protégé par JWT, supprime aussi ses transactions).
- `GET /api/Transaction` : Liste des transactions de l'utilisateur connecté, filtrable (`?walletId&type&category&from&to&limit`, tri date décroissante, Protégé par JWT).
- `GET /api/Transaction/summary` : Agrégats (`totalIncome`, `totalExpenses`, `balance`), filtrables par période (`?from&to`, Protégé par JWT).
- `GET /api/Transaction/monthly` : Agrégats par mois sur les `N` derniers mois (`?walletId&months`, défaut 12, clampé 1..36) — renvoie `[{ period: "2026-10", income, expenses }]`, mois vides inclus à 0, ordre croissant (Protégé par JWT).
- `GET /api/Transaction/{id}` : Détail d'une transaction (Protégé par JWT).
- `POST /api/Transaction` : Création d'une transaction (201 Created, Protégé par JWT).
- `PUT /api/Transaction/{id}` : Modification d'une transaction (Protégé par JWT).
- `DELETE /api/Transaction/{id}` : Suppression d'une transaction (Protégé par JWT).

Tous les endpoints `Wallet` et `Transaction` sont isolés par utilisateur : une ressource appartenant à un autre compte renvoie `404 Not Found`.

Chaque création, modification ou suppression de transaction recalcule dans la même transaction SQL les agrégats du portefeuille concerné (`Amount`, `TotalIncome`, `TotalExpenses`). Le champ `type` est sérialisé en chaîne `"income"` / `"expense"`.

L'objectif (`Goal`) d'un portefeuille est optionnel et positif (`"L'objectif doit être supérieur à 0."` sinon) ; il est renvoyé dans tous les DTO `Wallet` et sert au calcul des pourcentages de la page Statistiques côté mobile.

---

## Architecture du Projet

```text
backend/
├── Controllers/         # Contrôleurs API (AuthController, UserController, WalletController, TransactionController)
├── Data/                # Contexte de base de données (AppDbContext)
├── DTOs/                # Objets de transfert de données (UserDto, WalletDto, TransactionDto)
├── Models/              # Entités de la base de données (User, Wallet, Transaction, enum TransactionType)
├── Services/            # Logique métier (AuthService pour le JWT, WalletService pour les portefeuilles, TransactionService pour les transactions et les agrégats)
├── Migrations/          # Fichiers de migration Entity Framework Core
├── Properties/          # Paramètres de lancement (launchSettings.json)
├── Program.cs           # Point d'entrée et configuration des services / middleware
└── backend.csproj       # Fichier projet et dépendances NuGet

```
