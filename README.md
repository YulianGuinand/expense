# Expense - Plateforme de Gestion Financiere Personnelle

Ce document constitue la specification technique et le guide d'exploitation de reference pour l'ensemble du monorepo **Expense**. Il decrit l'architecture globale, les principes de conception logicielle, les modeles de donnees, les flux de securite et les procedures d'installation et de test pour chaque brique de la solution.

---

## 1. Presentation du Projet

### 1.1 Finalite Metier
La solution **Expense** est un ecosysteme complet dedie au suivi, a l'analyse et a la maitrise des finances personnelles et multi-portefeuilles. Elle repond a plusieurs imperatifs de gestion :
- **Agregation multi-comptes et multi-portefeuilles** : Suivi distinct des liquidites, comptes courants, epargnes et investissements.
- **Tracabilite fine des flux financiers** : Categorisation normalisee des depenses et revenus (alimentation, loyer, transport, sante, loisirs, etc.) avec horodatage et attribution a des portefeuilles cibles.
- **Gouvernance et securite des acces** : Cloisonnement strict des donnees par utilisateur et controle d'acces base sur les roles (RBAC - Role-Based Access Control) permettant d'isoler les fonctions d'administration systeme des fonctions clients.

### 1.2 Architecture Monorepo
Le projet est organise sous la forme d'un monorepo multi-projets compose de quatre modules autonomes :
- **backend** : API RESTful developpee avec ASP.NET Core (.NET 9) et Entity Framework Core. Elle expose les services metier, assure l'authentification securisee via jetons JWT et gere la persistance relationnelle sur MySQL.
- **backend.Tests** : Suite d'assurance qualite logicielle combinant des tests unitaires et des tests d'integration fonctionnels (.NET 11, xUnit, FluentAssertions, WebApplicationFactory).
- **mobile** : Application mobile multiplateforme (iOS / Android / Web) realisee avec React Native, TypeScript et le framework Expo (SDK 57), integrant la navigation par fichiers (Expo Router) et le stockage chiffre sur l'appareil.
- **web** : Interface web interactive basee sur Next.js 15 (React 19, TypeScript), concue avec Tailwind CSS et le design system headless Shadcn UI pour offrir un tableau de bord analytique aux utilisateurs sur poste de travail.

```text
                               +----------------------------------------+
                               |              Base MySQL                |
                               |          (Laragon / Port 3306)         |
                               +----------------------------------------+
                                                   ^
                                                   | Pomelo EF Core MySql
                                                   v
                               +----------------------------------------+
                               |           Backend .NET 9 API           |
                               |    (HTTP: 5256 / HTTPS: 7231 / Swagger) |
                               +----------------------------------------+
                                      ^                          ^
                                      | REST (JSON / JWT Bearer) | REST (JSON / JWT Bearer)
                                      v                          v
               +----------------------------------+   +----------------------------------+
               |        Application Mobile        |   |          Interface Web           |
               |        Expo / React Native       |   |      Next.js 15 / Shadcn UI      |
               |       (Metro / Port 8081)        |   |       (Node / Port 3000)         |
               +----------------------------------+   +----------------------------------+
```

### 1.3 Matrice Technologique

| Composant | Technologie | Version / Package Cle | Role et Caracteristiques |
| :--- | :--- | :--- | :--- |
| **Backend Runtime** | .NET SDK | 9.0 (`net9.0`) | Environnement d'execution haute performance, C# 13 |
| **Backend Web Framework** | ASP.NET Core Web API | 9.0.0 | Routage d'API, injection de dependances native, middleware HTTP |
| **Backend ORM** | Entity Framework Core | 9.0.0 | Mappage objet-relationnel, migrations schema, LINQ |
| **Fournisseur MySQL** | Pomelo EF Core MySql | 9.0.0-preview.3 | Pilote relationnel adapte a MySQL 8.x avec auto-detection |
| **Securite Mots de Passe** | BCrypt.Net-Next | 4.0.3 | Hachage cryptographique robuste avec sel unique integre |
| **Jeton d'Authentification** | System.IdentityModel.Tokens.Jwt | 8.2.1 | Generation et parsing de jetons JSON Web Tokens (HMAC-SHA256) |
| **Documentation API** | Swashbuckle / OpenAPI | 6.6.2 | Generation de contrats OpenAPI v1 et interface Swagger UI |
| **Backend Tests** | xUnit & FluentAssertions | 2.9.3 / 8.11.0 | Framework d'assertion et d'execution sous .NET 11 |
| **Integration Testing** | WebApplicationFactory | 10.0.12 | Instanciation de pipeline HTTP ASP.NET Core in-memory |
| **Mobile Framework** | Expo SDK | ~57.0.26 | Outils d'abstraction React Native et builds multiplateformes |
| **Mobile Core** | React Native | 0.86.3 (React 19.2.3) | Composants d'interface utilisateur natifs |
| **Mobile Navigation** | Expo Router | ~57.0.24 | Routage base sur l'arborescence de fichiers (`src/app`) |
| **Mobile Secure Storage** | Expo Secure Store | ~57.0.4 | Chiffrement hardware (Keychain iOS / Keystore Android) |
| **Mobile Performance** | @shopify/flash-list | 2.0.2 | Remplacement performant de FlatList pour de gros volumes |
| **Mobile Animations** | React Native Reanimated | 4.5.1 | Calculs cinetiques deportes sur le thread UI natif |
| **Mobile Iconographie** | phosphor-react-native | 3.0.6 | Icones vectorielles modulaires a charge legere |
| **Web Framework** | Next.js | 15.x (React 19) | Architecture App Router, Server Components & Client Hydration |
| **Web Styling** | Tailwind CSS & Shadcn UI | 3.4+ / Radix UI | Moteur de styles atomique et composants headless accessibles |
| **SGBD Relationnel** | MySQL Community Server | 8.x (Port 3306) | Moteur de persistance sous environnement local Laragon |

---

## 2. Architecture et Organisation des Dossiers

### 2.1 Cartographie Globale du Monorepo

```text
expense/
├── .gitignore                      # Exclusions Git globales (.NET, Node, Expo, IDEs)
├── backend/                        # API Web ASP.NET Core 9
│   ├── Controllers/                # Points d'entree HTTP REST
│   │   ├── AuthController.cs       # Endpoints register (wallet par defaut "01. Personnel") et login
│   │   ├── TransactionController.cs # Endpoints CRUD transactions, filtres et resume (proteges JWT)
│   │   ├── UserController.cs       # Endpoints utilisateurs proteges et admin
│   │   └── WalletController.cs     # Endpoints CRUD des portefeuilles (proteges JWT)
│   ├── Data/                       # Couche d'acces aux donnees
│   │   └── AppDbContext.cs         # Contexte EF Core et declaration des DbSets
│   ├── DTOs/                       # Objets de transfert de donnees immuables
│   │   ├── TransactionDto.cs       # Records C# TransactionCreateDto, TransactionUpdateDto, TransactionResponseDto, TransactionSummaryDto
│   │   ├── UserDto.cs              # Records C# UserRegisterDto et UserLoginDto
│   │   └── WalletDto.cs            # Records C# WalletCreateDto, WalletUpdateDto, WalletResponseDto
│   ├── Migrations/                 # Historique des migrations relationnelles EF Core
│   │   ├── 20261001183053_InitialCreate.cs
│   │   ├── 20261001183408_AddRoleToUser.cs
│   │   ├── 20261002213657_AddWallet.cs
│   │   ├── 20261002220728_AddWalletUserId.cs
│   │   ├── 20261003103841_AddTransaction.cs
│   │   └── AppDbContextModelSnapshot.cs
│   ├── Models/                     # Modeles de domaine / Entites de base de donnees
│   │   ├── Transaction.cs          # Entite Transaction (Id, UserId, WalletId, Type, Amount, Category, Date, Description)
│   │   ├── TransactionType.cs      # Enum TransactionType (Income, Expense)
│   │   ├── User.cs                 # Entite User (Id, Username, Email, PasswordHash, Role)
│   │   └── Wallet.cs               # Entite Wallet (Id, UserId, Name, Amount, TotalIncome, TotalExpenses)
│   ├── Properties/
│   │   └── launchSettings.json     # Profils de lancement HTTP (5256) et HTTPS (7231)
│   ├── Services/                   # Logique metier et cryptographie applicative
│   │   ├── AuthService.cs          # Fabrication des jetons JWT et claims
│   │   ├── TransactionService.cs   # Regles metier transactions (validation, filtres, recalcul des totaux de portefeuille)
│   │   └── WalletService.cs        # Regles metier portefeuilles (validation, isolation par utilisateur)
│   ├── appsettings.json            # Configuration active locale (BDD, JWT)
│   ├── appsettings.json.example    # Gabarit de configuration distribue sur Git
│   ├── backend.csproj              # Definition du projet .NET et paquets NuGet
│   ├── backend.http                # Fichier de requetes HTTP interactives
│   └── Program.cs                  # Configuration de l'hote, middleware et pipeline
├── backend.Tests/                  # Suite de tests d'assurance qualite
│   ├── IntegrationTests/           # Tests d'API complets sur WebApplicationFactory
│   │   ├── AuthControllerIntegrationTests.cs
│   │   ├── ExpenseApiFactory.cs    # Fabrique hermetique (EF Core InMemory)
│   │   ├── TestAuthHelper.cs       # Helpers d'inscription et de client authentifie
│   │   ├── TransactionControllerIntegrationTests.cs
│   │   ├── UserControllerIntegrationTests.cs
│   │   └── WalletControllerIntegrationTests.cs
│   ├── UnitTests/                  # Tests unitaires purs (sans infrastructure externe)
│   │   ├── AuthServiceTests.cs     # Validation de signature et claims des tokens
│   │   ├── TransactionServiceTests.cs # Validations, filtres et recalcul des totaux
│   │   └── WalletServiceTests.cs   # Regles metier portefeuilles
│   └── backend.Tests.csproj        # Configuration xUnit et dependances de test
├── mobile/                         # Application cliente mobile Expo / React Native
│   ├── .expo/                      # Cache de resolution du compilateur Expo
│   ├── app.json                    # Manifeste d'application Expo (nom, icones, splash)
│   ├── assets/                     # Polices, images d'accueil et icones natives
│   ├── package.json                # Dependances JavaScript et scripts d'execution
│   ├── src/
│   │   ├── app/                    # Arborescence de navigation Expo Router
│   │   │   ├── (auth)/             # Groupe de routes non-authentifiees
│   │   │   │   ├── login.tsx       # Ecran de connexion
│   │   │   │   ├── register.tsx    # Ecran d'inscription
│   │   │   │   └── welcome.tsx     # Ecran d'onboarding
│   │   │   ├── (modals)/           # Ecrans modaux de superposition
│   │   │   │   ├── profileModal.tsx
│   │   │   │   ├── transactionModal.tsx
│   │   │   │   └── walletModal.tsx
│   │   │   ├── (tabs)/             # Navigation principale a onglets inferieurs
│   │   │   │   ├── _layout.tsx     # Barre de navigation inferieure
│   │   │   │   ├── index.tsx       # Tableau de bord principal (Home)
│   │   │   │   ├── profile.tsx     # Gestion de compte utilisateur
│   │   │   │   ├── statistics.tsx  # Analyse graphique des flux
│   │   │   │   └── wallet.tsx      # Vue detaillee des portefeuilles
│   │   │   ├── _layout.tsx         # Layout racine (Fournisseurs de contexte globaux)
│   │   │   └── index.tsx           # Routeur d'aiguillage initial
│   │   ├── components/             # Composants d'interface reutilisables
│   │   ├── constants/              # Theme sombre et dictionnaires de categories
│   │   ├── contexts/               # Contexte React d'authentification et session
│   │   │   └── authContext.tsx     # Abstraction de session reliee a SecureStore
│   │   ├── services/               # Couche d'appels API et stockage securise
│   │   │   ├── api/
│   │   │   │   ├── apiClient.ts    # Instance Axios, intercepteurs JWT et session glissante
│   │   │   │   ├── authService.ts  # Appels REST types (login, register, getMe)
│   │   │   │   ├── transactionService.ts # Appels REST types des transactions (filtres, resume, CRUD)
│   │   │   │   └── walletService.ts # Appels REST types des portefeuilles (CRUD)
│   │   │   ├── query/
│   │   │   │   ├── queryClient.ts  # Configuration du cache TanStack Query
│   │   │   │   └── queryKeys.ts    # Cles de cache centralisees
│   │   │   └── storage/
│   │   │       └── tokenStorage.ts # Abstraction d'acces a Expo SecureStore
│   │   ├── types.ts                # Definitions des interfaces et types TypeScript
│   │   └── utils/                  # Fonctions utilitaires de mise a l'echelle ecran
│   └── tsconfig.json               # Options du compilateur TypeScript pour Expo
└── web/                            # Interface d'administration et dashboard Web Next.js
    └── (architecture cible Next.js 15 App Router avec Tailwind CSS et Shadcn UI)
```

### 2.2 Flux de Donnees et Securite Transverse

L'architecture implemente une separation hermetique entre le client de restitution et la persistance physique :

1. **Cycle de Vie d'un Appel Client** :
   - Le client (mobile ou web) emet une requete HTTPS/HTTP vers l'API .NET.
   - Si la route est restreinte (`[Authorize]`), l'entete HTTP standard `Authorization: Bearer <token_jwt>` doit etre inclus.
   - Le middleware ASP.NET Core `UseAuthentication` intercepte la requete et valide la signature cryptographique a l'aide de la cle symetrique (`Jwt:Key`).
   - Le middleware `UseAuthorization` verifie ensuite que les claims extraits du jeton concordent avec les roles requis (`Role = "Admin"` sur `[Authorize(Roles = "Admin")]`).

2. **Strategie de Stockage des Identifiants** :
   - **Sur Mobile** : Le jeton JWT est conserve dans le stockage securise materiel via `Expo Secure Store`. Sur iOS, les secrets sont stockes dans le *Keychain* chiffre. Sur Android, ils sont confies au *Keystore* chiffre en AES-256. Ce procede empeche toute lecture en clair par inspection de memoire ou extraction physique non-autorisee.
   - **Sur Web** : La recommandation d'architecture cible consiste a stocker le jeton d'authentification dans un cookie HTTP avec les drapeaux `httpOnly` (protection absolue contre les failles XSS), `Secure` (transmission exclusive via TLS) et `SameSite=Strict` (attenuation drastique des attaques CSRF).

3. **Protection contre la Sur-Assignation (Mass-Assignment)** :
   - Le backend s'interdit d'accepter directement l'entite de base de donnees `User` au sein des parametres de controleur. Les donnees entrantes sont filtrees a travers des records C# (`UserRegisterDto`, `UserLoginDto`). Ainsi, un utilisateur ne peut en aucun cas s'auto-attribuer le role `Admin` lors de la creation de son compte : le role est assigne systematiquement a `"User"` au niveau de l'entite metier.

---

## 3. Specifications Techniques et Apprentissages

### 3.1 Analyse Approfondie du Backend (.NET 9)

#### Conception en Couches
Le backend est concu suivant les principes de la separation des responsabilites :
- **Couche Presentation (Controllers)** : Exposee sous forme de controleurs derivant de `ControllerBase`. Elle recoit les DTOs, declenche les regles metier et retourne des statuts HTTP conformes a la norme REST (200 OK, 401 Unauthorized, etc.).
- **Couche Metier (Services)** : Isolee dans `AuthService.cs`. Elle encapsule la complexite de la generation des jetons d'authentification sans dependre du protocole HTTP direct.
- **Couche de Persistance (Data)** : `AppDbContext` herite de `DbContext`. Elle gere le cycle de vie des entites, le suivi des modifications (*change tracking*) et la traduction des requetes LINQ en requetes SQL natives pour MySQL.

#### Gestion des Mots de Passe et Securite JWT
- **BCrypt** : L'algorithme de hachage utilise `BCrypt.Net-Next`. Contrairement a SHA-256 ou MD5 qui sont des fonctions de hachage rapides concues pour l'integrite de donnees, BCrypt est deliberement couteux en temps CPU grace a son facteur de travail parametrable (*work factor*). Il inclut automatiquement un sel cryptographique aleatoire de 128 bits dans le hash genere, neutralisant totalement les attaques par tables arc-en-ciel (*rainbow tables*).
- **Structure du Jeton JWT** :
  - **Header** : Indique l'algorithme de signature (`HMAC-SHA256`).
  - **Payload** : Transporte les claims standards (`ClaimTypes.Name`, `ClaimTypes.Email`, `ClaimTypes.Role`).
  - **Signature** : Produite a l'aide d'une cle symetrique d'au moins 256 bits (`SymmetricSecurityKey`). La duree de validite emise est fixee a 24 heures (`DateTime.UtcNow.AddDays(1)`).

#### Entity Framework Core et Migrations
- Le pilote MySQL Pomelo est initialise dans `Program.cs` via l'instruction :
  ```csharp
  var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
  builder.Services.AddDbContext<AppDbContext>(options =>
      options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
  ```
  L'utilisation de `ServerVersion.AutoDetect` interroge dynamiquement le serveur MySQL cible lors de la premiere connexion pour adapter le dialecte SQL genere (gestion des types de colonnes JSON, encodage `utf8mb4`, optimisations de jointures).
- **Historique des Migrations** :
  - `20261001183053_InitialCreate` : Installe la table de base `Users` (Id, Username, Email, PasswordHash).
  - `20261001183408_AddRoleToUser` : Ajoute de maniere non-destructive la colonne `Role` avec valeur par defaut.

---

### 3.2 Analyse Approfondie de l'Application Mobile (Expo SDK 57)

#### File-Based Routing avec Expo Router
L'application exploite l'architecture moderne d'Expo Router basee sur la topologie du systeme de fichiers sous `src/app/` :
- **Groupes de Routes (Route Groups)** : Les dossiers entre parentheses comme `(auth)`, `(tabs)` et `(modals)` permettent d'organiser logiquement les ecrans sans alterer le segment d'URL de l'ecran.
- **Modales Natives** : Le dossier `(modals)` utilise la presentation de modalite de l'OS hote, declaree dans `_layout.tsx` avec `presentation: "modal"`.
- **Ecrans Proteges** : La navigation est synchronisee avec l'etat de session (`user`, `token`). Le point d'entree `index.tsx` redirige automatiquement les utilisateurs non authentifies vers `(auth)/welcome` et les utilisateurs connectes vers `(tabs)`.

#### Performance et Confort Visuel
- **FlashList (@shopify/flash-list)** : Utilise pour le rendu des transactions dans `TransactionList.tsx`. FlashList recycle les vues d'elements existantes au lieu de detruire et recreer les composants lors du defilement, assurant un maintien strict du taux de 60 ou 120 images par seconde, meme sur de longues listes de depenses.
- **Reanimated (v4)** : Gere les micro-interactions et transitions complexes sans bloquer le moteur JavaScript grace au traitement asynchrone par `Worklets` sur le thread natif.
- **Design System Adaptatif** : Les utilitaires `src/utils/styling.ts` calculent dynamiquement la taille des typographies et espacements en fonction de la hauteur et de la largeur physique de l'ecran cible (`verticalScale`, `scale`).

---

### 3.3 Analyse Approfondie de l'Interface Web (Next.js 15)

L'architecture cible de l'application Web repose sur le modele d'application d'entreprise suivant :
- **React Server Components (RSC)** : Les pages statiques et les squelettes de tableaux de bord sont rendus sur le serveur Node.js, garantissant un score Time-To-Interactive minimal et reduisant drastiquement le volume de JavaScript transmis au navigateur.
- **Client Components ("use client")** : Reserves aux composants interactifs necessitant la capture d'evenements utilisateur (formulaires de saisie de depenses, graphiques dynamiques Recharts, selecteurs de filtres temporels).
- **Shadcn UI et Accessibilite** : Composants construits au-dessus des primitives Radix UI (WAI-ARIA compliant), stylises avec des classes utilitaires Tailwind CSS. Cette approche permet de conserver la propriete totale du code source des composants dans le dossier `components/ui/` sans dependance externe opacifiante.
- **Appels API et Abstraction HTTP** : Utilisation d'une instance Axios ou d'un wrapper `fetch` configure avec un intercepteur de requetes pour injecter le token JWT dans l'entete `Authorization`, couplee a TanStack Query (React Query) pour le cache local, l'invalidation automatique lors des mutations et la re-tentative transparente en cas de micro-coupure reseau.

---

## 4. Guide de Demarrage et d'Installation en Developpement Local

### 4.1 Pre-requis Systeme Indispensables

Avant de debuter, verifiez que les logiciels et environnements suivants sont installes sur votre station Windows :

1. **SDK .NET** : Version 9.0 installee.
   ```powershell
   dotnet --version
   ```
2. **Node.js** : Version 20 LTS ou 22 LTS recommandee.
   ```powershell
   node --version
   npm --version
   ```
3. **Laragon** : Environnement WAMP moderne incluant MySQL 8.x en ecoute sur le port local `3306`.
4. **Git** : Gestionnaire de versions officiel.
5. **Expo Go** : Installe sur smartphone physique (disponible sur Google Play Store ou Apple App Store) ou via un emulateur Android Studio configure.

---

### 4.2 Etape 1 : Clonage et Configuration Globale du Depot

Ouvrez un terminal PowerShell et clonez le depot du projet :

```powershell
git clone https://github.com/YulianGuinand/expense.git
cd expense
```

---

### 4.3 Etape 2 : Configuration et Lancement du Backend (.NET)

#### A. Demarrer MySQL sous Laragon
1. Lancez l'application **Laragon** sur votre machine.
2. Cliquez sur **Start All** (ou demarrez specifiquement le service **MySQL**).
3. Verifiez que le port `3306` est actif.

#### B. Creer la Base de Donnees
Ouvrez le terminal integre de Laragon ou l'outil **Database** (HeidiSQL integre) et executez l'instruction SQL suivante :

```sql
CREATE DATABASE IF NOT EXISTS expense CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### C. Configurer appsettings.json
Placez-vous dans le dossier `backend` :

```powershell
cd backend
```

Si le fichier `appsettings.json` n'existe pas, dupliquez le fichier exemple :

```powershell
Copy-Item appsettings.json.example appsettings.json
```

Verifiez le contenu de `appsettings.json`. Par defaut sur Laragon, le compte root ne possede pas de mot de passe :

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
    "DefaultConnection": "Server=localhost;Port=3306;Database=expense;Uid=root;Pwd=;"
  },
  "Jwt": {
    "Key": "votre_cle_secrete_ultra_securisee_et_assez_longue_pour_jwt"
  }
}
```

#### D. Restaurer les Dependances et Configurer la Source NuGet
Assurez-vous que la source officielle NuGet est configuree :

```powershell
dotnet nuget add source "https://api.nuget.org/v3/index.json" -n "nuget.org" --valid-authentication-types "basic"
```
*(Si la source est deja enregistree, ignorez l'avertissement).*

Restaurez les paquets du projet backend :

```powershell
dotnet restore
```

#### E. Appliquer les Migrations Entity Framework Core
Pour installer l'outil EF Core CLI localement (ou globalement) :

```powershell
dotnet tool install --global dotnet-ef
```

Appliquez les migrations existantes afin de generer les tables `Users` et `__EFMigrationsHistory` dans MySQL :

```powershell
dotnet ef database update
```

#### F. Lancer le Serveur Backend
Demarrez l'API en mode rechargement a chaud (*Hot Reload*) :

```powershell
dotnet watch run
```

L'application demarre et affiche les URLs d'ecoute :
- **HTTP Endpoint** : `http://localhost:5256`
- **HTTPS Endpoint** : `https://localhost:7231`
- **Documentation Swagger UI** : `http://localhost:5256/swagger`

Accedez a `http://localhost:5256/swagger` depuis votre navigateur web pour verifier le fonctionnement et tester interactivement les endpoints d'inscription et de connexion.

---

### 4.4 Etape 3 : Configuration et Lancement de l'Interface Web (Next.js)

L'interface web se situe dans le dossier `web/`.

#### A. Initialisation ou Installation des Dependances
Ouvrez un nouveau terminal et naviguez dans le sous-dossier :

```powershell
cd expense/web
```

Si le repertoire est vierge, initialisez le scaffold standard Next.js 15 avec TypeScript et Tailwind CSS :

```powershell
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Puis installez les primitives de composants Shadcn UI :

```powershell
npx shadcn@latest init
```

Si le repertoire contient deja un `package.json`, installez simplement les dependances :

```powershell
npm install
```

#### B. Variables d'Environnement Web
Creez un fichier `.env.local` a la racine du dossier `web/` pour definir l'URL de base vers l'API .NET locale :

```ini
NEXT_PUBLIC_API_URL=http://localhost:5256/api
```

#### C. Lancement du Serveur de Developpement Web
Executez la commande :

```powershell
npm run dev
```

L'interface web est accessible sur : `http://localhost:3000`.

---

### 4.5 Etape 4 : Configuration et Lancement de l'Application Mobile (Expo)

#### A. Navigation et Installation des Dependances
Ouvrez un troisieme terminal et entrez dans le dossier `mobile/` :

```powershell
cd expense/mobile
```

Installez l'ensemble des paquets verifies conformes au SDK Expo :

```powershell
npm install
```

#### B. Configuration des Variables d'Environnement (.env)
L'application mobile utilise le gestionnaire natif de variables d'environnement d'Expo avec la variable `EXPO_PUBLIC_API_URL`.

**Regle Reseau Fondamentale pour le Mobile** : Lorsque vous testez l'application sur un smartphone reel via **Expo Go** ou un emulateur, l'adresse `localhost` ou `127.0.0.1` pointe vers l'appareil mobile lui-meme et ne peut pas joindre votre machine Windows.

1. Identifiez l'adresse IPv4 locale de votre machine de developpement :
   ```powershell
   ipconfig
   ```
   Relevez votre adresse IPv4 sur la carte reseau Wi-Fi active (exemple : `192.168.25.105`).
2. Dupliquez le fichier d'exemple `.env.example` a la racine du dossier `mobile/` :
   ```powershell
   Copy-Item .env.example .env
   ```
3. Renseignez l'URL de votre API dans `.env` :
   ```ini
   EXPO_PUBLIC_API_URL=http://[ADRESSE_IP]:5256/api
   ```
   *(Veillez a ce que votre profil reseau Wi-Fi sous Windows soit defini sur 'Prive' et que votre pare-feu autorise les connexions entrantes sur le port 5256).*

> Remarque : La variable `EXPO_PUBLIC_API_URL` est strictement requise. Si elle est omise, le client mobile refuse de s'initialiser et levee une exception explicite indiquant le fichier manquant.

#### C. Lancement du Serveur Metro Bundler
Demarrez le compilateur Expo :

```powershell
npx expo start
```

Des raccourcis clavier sont disponibles dans le terminal :
- Appuyez sur `s` pour basculer entre le mode Expo Go et le mode Development Build.
- Appuyez sur `a` pour lancer l'application sur un emulateur Android ouvert.
- Appuyez sur `w` pour tester rapidement le rendu dans votre navigateur Web.
- Scannez le **QR Code** affiche a l'ecran directement depuis l'application mobile **Expo Go** (sur Android) ou via l'application **Appareil Photo** standard (sur iOS).

---

## 5. Guide des Tests et de la Validation

Le projet **backend.Tests** garantit la fiabilite de la couche serveur via deux niveaux d'epreuve.

### 5.1 Structure de la Suite de Tests

```text
backend.Tests/
├── UnitTests/
│   ├── AuthServiceTests.cs             # Test de generation unitaire du token JWT
│   └── WalletServiceTests.cs           # Tests unitaires de la logique metier des portefeuilles
└── IntegrationTests/
    ├── ExpenseApiFactory.cs            # Fabrique hermétique (EF Core InMemory, sans MySQL)
    ├── TestAuthHelper.cs               # Inscription et creation de clients HttpClient authentifiés
    ├── AuthControllerIntegrationTests.cs   # Validation du rejet en cas d'identifiants invalides
    ├── UserControllerIntegrationTests.cs   # Validation du statut 401 sur routes protegees
    └── WalletControllerIntegrationTests.cs # Validation du CRUD des portefeuilles (401/201/400/404)
```

#### 1. Tests Unitaires (`UnitTests/`)
- `AuthServiceTests.cs` : instancient directement `AuthService` en lui injectant une configuration memoire (`AddInMemoryCollection`).
- Valident de maniere isolee que la methode `GenerateJwtToken(user)` produit un jeton valide et que les claims (`name`, `email`, `role`) concordent fidelement avec l'entite sans faire appel au reseau ni a la base de donnees.
- `TransactionServiceTests.cs` : couvrent les validations (montant, type, date, longueurs), les filtres, l'isolation multi-utilisateurs et le recalcul des agrégats de portefeuille (`Amount`, `TotalIncome`, `TotalExpenses`) apres chaque création, modification ou suppression.

#### 2. Tests d'Integration (`IntegrationTests/`)
- Exploitent la classe `WebApplicationFactory<Program>` fournie par le paquet `Microsoft.AspNetCore.Mvc.Testing`.
- Cette fabrique demarre reellement l'hote Web en memoire avec tous ses middlewares (routage, authentification, injection de dependances).
- La concretion `ExpenseApiFactory` remplace le fournisseur MySQL par le fournisseur **EF Core InMemory** : la suite est hermétique et ne requiert aucun serveur de base de donnees.
- Un client HTTP virtuel (`HttpClient`) soumet des requetes REELLES vers les controleurs et valide :
  - Que l'appel a `/api/Auth/login` avec des identifiants errones declenche un code de reponse `401 Unauthorized`.
  - Que les appels a `/api/User` ou `/api/User/admin-only` sans entete Authorization retournent immediatement un code de refus `401 Unauthorized`.
  - Que le CRUD `/api/Wallet` exige un jeton (`401`), accepte un portefeuille valide (`201`), refuse un nom vide (`400`) et isole strictement les portefeuilles entre utilisateurs (`404`).
  - Que le CRUD `/api/Transaction` exige un jeton (`401`), sérialise `type` sous forme de chaine (`"income"` / `"expense"`), refuse un montant nul (`400`), met a jour les totaux du portefeuille apres chaque ecriture et isole strictement les transactions entre utilisateurs (`404`).

### 5.2 Execution des Tests

Ouvrez un terminal dans le dossier `backend.Tests/` :

```powershell
cd expense/backend.Tests
```

#### Commande d'execution globale :
```powershell
dotnet test
```

#### Execution avec niveau de verbosite detaille :
```powershell
dotnet test --logger "console;verbosity=detailed"
```

#### Execution ciblee d'un test specifique :
```powershell
dotnet test --filter "FullyQualifiedName~AuthServiceTests"
```

---

## 6. Resolution des Problemes Frequents (Troubleshooting)

### 6.1 Echec de Connexion MySQL (MySqlConnector.MySqlException)
- **Symptome** : Lors de `dotnet ef database update` ou lors de l'appel a l'API, l'erreur suivante apparait : `Unable to connect to any of the specified MySQL hosts`.
- **Diagnostic et Resolution** :
  1. Ouvrez Laragon et confirmez que le voyant du service MySQL est vert sur le port `3306`.
  2. Verifiez qu'aucune autre instance de base de donnees (service Windows `MySQL80`, WampServer ou MariaDB) n'occupe deja le port `3306` :
     ```powershell
     Get-NetTCPConnection -LocalPort 3306
     ```
  3. Verifiez que la base de donnees `expense` a bien ete creee dans MySQL. Si non, recreez-la via votre client SQL.
  4. Verifiez votre fichier `appsettings.json` : assurez-vous que `Uid=root` et `Pwd=` (mot de passe vide par defaut sous Laragon).

---

### 6.2 Echec de Requete Reseau depuis l'Application Mobile (Network Request Failed)
- **Symptome** : Sur l'application mobile, les actions de connexion ou d'inscription affichent une alerte reseau `Network request failed` ou `ERR_CONNECTION_REFUSED`.
- **Cause** : Votre code mobile tente de requeter `http://localhost:5256` ou `http://127.0.0.1:5256`. Sur un appareil mobile, `localhost` represente le telephone et non votre ordinateur.
- **Resolution** :
  1. Identifiez l'adresse IP de votre PC sur votre reseau local (`ipconfig`).
  2. Remplacez `localhost` par cette IP locale (ex: `http://192.168.1.45:5256`).
  3. Assurez-vous que votre smartphone et votre PC sont connectes au **meme point d'acces Wi-Fi**.
  4. Verifiez les regles de votre pare-feu Windows pour autoriser le port 5256 en entree :
     ```powershell
     New-NetFirewallRule -DisplayName "Autoriser Backend Expense" -Direction Inbound -LocalPort 5256 -Protocol TCP -Action Allow
     ```

---

### 6.3 Erreurs de Certificat SSL Local (UntrustedRoot / SSL Handshake Failed)
- **Symptome** : Rejet de requete lors de l'utilisation de l'endpoint HTTPS `https://localhost:7231`.
- **Cause** : Le certificat de developpement local d'ASP.NET Core n'est pas installe dans le magasin de certificats racine de confiance de Windows.
- **Resolution** :
  - Regenerez et approuvez le certificat HTTPS de developpement avec la commande officielle :
    ```powershell
    dotnet dev-certs https --clean
    dotnet dev-certs https --trust
    ```
  - Pour les tests rapides sur mobile et Expo Go, privilegiez systematiquement le port HTTP simple (`http://<VOTRE_IP_LOCALE>:5256`), car les terminaux mobiles rejettent nativement les autorites de certification locales privees.

---

### 6.4 Conflit de Ports Systemes (Ports 5256, 3000 ou 8081 deja occupes)
- **Symptome** : `System.IO.IOException: Failed to bind to address http://localhost:5256: address already in use` ou `Port 8081 already in use`.
- **Resolution** :
  - Identifiez le PID (identifiant de processus) qui bloque le port :
    ```powershell
    Get-Process -Id (Get-NetTCPConnection -LocalPort 5256).OwningProcess
    ```
  - Terminez le processus responsable :
    ```powershell
    Stop-Process -Id <PID> -Force
    ```

---

### 6.5 Commande dotnet-ef Introuvable
- **Symptome** : Le terminal repond `dotnet : Le terme 'dotnet-ef' n'est pas reconnu`.
- **Resolution** :
  - Installez l'outil de maniere globale sur votre machine :
    ```powershell
    dotnet tool install --global dotnet-ef
    ```
  - Si l'outil est deja installe mais non detectable, ajoutez le dossier des outils globaux a votre variable d'environnement PATH :
    `%USERPROFILE%\.dotnet\tools`
  - Vous pouvez egalement lancer la commande via l'outil local du projet :
    ```powershell
    dotnet tool run dotnet-ef database update
    ```

---

### 6.6 Anomalies de Dependances Expo / React Native
- **Symptome** : Des avertissements ou erreurs d'incompatibilite de versions apparaissent lors du lancement d'Expo (`Some dependencies are incompatible with the installed expo version`).
- **Resolution** :
  - Lancez l'outil de diagnostic officiel d'Expo :
    ```powershell
    npx expo-doctor
    ```
  - Reparez automatiquement les versions de paquets non alignees :
    ```powershell
    npx expo install --fix
    ```
