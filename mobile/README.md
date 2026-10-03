# Expense - Application Mobile (Expo / React Native)

Ce document decrit l'architecture technique, les regles de developpement et la procedure de configuration et d'execution de l'application mobile **Expense**.

---

## 1. Specifications et Technologies

- **Framework** : Expo SDK 57 (~57.0.26)
- **Moteur Mobile** : React Native 0.86.3 (React 19.2.3)
- **Langage** : TypeScript 6.0.3 (typage statique strict)
- **Routage** : Expo Router v4 (~57.0.24, navigation basee sur l'arborescence de fichiers)
- **Client HTTP** : Axios (^1.20.0) avec intercepteurs de securite et session glissante
- **Cache Serveur** : TanStack Query (@tanstack/react-query, v5) — reponses gardees en memoire (staleTime 30s), re-actualisation en tache de fond, invalidation par cle apres chaque mutation
- **Stockage Securise** : Expo Secure Store (~57.0.4, Keychain iOS / Keystore Android)
- **Avatar System** : Blobatar (@blobatar/react-native 2.7.0, avatars geometriques deterministes)
- **Performances Listes** : @shopify/flash-list (2.0.2)
- **Animations** : React Native Reanimated (4.5.1) et React Native Worklets (0.10.1)
- **Icones** : phosphor-react-native (3.0.6)
- **Graphiques** : react-native-gifted-charts (^1.4.80, avec expo-linear-gradient ~57.0.2 et react-native-svg) — barres mensuelles de la page Statistiques
- **Onglets** : @react-native-segmented-control/segmented-control (2.5.7, module natif — impose une reconstruction du dev client, `npx expo run:android|ios`)

---

## 2. Configuration des Variables d'Environnement (.env)

L'application mobile utilise le systeme de variables d'environnement natif d'Expo. Toute variable exposee au code JavaScript client doit debuter par le prefixe `EXPO_PUBLIC_`.

### 2.1 Fichier .env.example
Un modele de configuration est disponible a la racine du module mobile : `mobile/.env.example` :

```ini
# URL de base de l'API Backend .NET
# ATTENTION : Ne pas utiliser localhost sur un smartphone reel ou un emulateur.
# Utilisez l'adresse IPv4 de votre machine sur le reseau local (ex: http://192.168.1.XX:5256/api)
EXPO_PUBLIC_API_URL=http://[ADRESSE_IP]:5256/api
```

### 2.2 Initialisation du fichier .env
Pour configurer votre environnement de developpement local :

1. Dupliquez le fichier exemple a la racine du dossier `mobile/` :
   ```powershell
   Copy-Item .env.example .env
   ```
2. Adaptez la variable `EXPO_PUBLIC_API_URL` avec l'adresse IP de votre machine hote executant le backend ASP.NET Core.

> Remarque technique : La variable `EXPO_PUBLIC_API_URL` fait l'objet d'une validation stricte au chargement du module client API (`apiClient.ts`). Si elle n'est pas fournie ou vide, une exception explicite est levee au demarrage pour eviter tout echec silencieux.

---

## 3. Architecture et Structure des Fichiers

```text
mobile/
├── .env                            # Variables d'environnement locales actives
├── .env.example                    # Gabarit de configuration documente
├── app.json                        # Configuration et plugins Expo
├── eslint.config.js                # Configuration ESLint 9
├── package.json                    # Dependances et scripts
├── tsconfig.json                   # Configuration TypeScript
└── src/
    ├── app/                        # Routes Expo Router (default export obligatoire ici)
    │   ├── (auth)/                 # login.tsx, register.tsx, welcome.tsx
    │   ├── (modals)/               # profileModal.tsx, transactionModal.tsx, transactionSearchModal.tsx, walletModal.tsx
    │   ├── (tabs)/                 # _layout.tsx, index.tsx, profile.tsx, statistics.tsx, wallet.tsx
    │   ├── _layout.tsx             # Configuration globale de navigation et Reanimated logger
    │   └── index.tsx               # Point d'entree d'aiguillage de session
    ├── components/                 # Composants d'interface (exports nommes exclusifs)
    │   ├── Avatar/
    │   │   └── BlobatarAvatar.tsx  # Avatar deterministe memoise via @blobatar/react-native
    │   ├── BackButton.tsx
    │   ├── Button.tsx
    │   ├── GoalCard.tsx             # Bloc objectif (progression, revenu %, depense %)
    │   ├── Header.tsx
    │   ├── HomeCard.tsx
    │   ├── Input.tsx
    │   ├── ScreenWrapper.tsx
    │   ├── StatsBarChart.tsx        # Graphique en barres mensuelles (gifted-charts)
    │   ├── TransactionList.tsx
    │   └── Typo.tsx
    ├── constants/                  # Theme, couleurs et dictionnaires de categories (labels, icones)
    ├── contexts/
    │   ├── authContext.tsx         # Gestion d'etat d'authentification et session utilisateur
    │   └── queryContext.tsx        # QueryClientProvider TanStack Query + focus AppState
    ├── hooks/
    │   └── useRefreshOnFocus.ts    # Re-actualise les requetes perimees au retour sur l'ecran
    ├── services/
    │   ├── api/
    │   │   ├── apiClient.ts        # Instance Axios, intercepteurs JWT et session glissante
    │   │   ├── authService.ts      # Appels REST typés (login, register, getMe, updateUsername)
    │   │   ├── transactionService.ts # Appels REST typés des transactions (filtres, recherche q, pagination offset, stats mensuelles, CRUD)
    │   │   └── walletService.ts    # Appels REST typés des portefeuilles (liste, création, modification, suppression)
    │   ├── query/
    │   │   ├── queryClient.ts      # Configuration du cache (staleTime, gcTime, politiques de re-tentative)
    │   │   └── queryKeys.ts        # Cles de cache centralisees (invalidation ciblee)
    │   └── storage/
    │       └── tokenStorage.ts     # Abstraction d'acces a Expo SecureStore
    ├── types.ts                    # Definitions des types transverses
    └── utils/                      # Fonctions d'echelle dynamique pour l'affichage
```

---

## 4. Regles de Developpement

1. **Exports Nommes** :
   Tous les composants partages (`src/components/`), services (`src/services/`), contextes (`src/contexts/`) et utilitaires utilisent des exports nommes (`export const ...`). Seuls les fichiers de routes sous `src/app/` utilisent un export par defaut conformement aux exigences techniques d'Expo Router.
2. **Gestion de la Session et Securite** :
   - Le token JWT est stocke dans le hardware securise via `expo-secure-store`.
   - L'instance Axios injecte automatiquement l'entete `Authorization: Bearer <token>`.
   - En cas d'en-tête de renouvellement `X-Renewed-Token` renvoye par le backend, le token local est mis a jour de maniere transparente (session glissante active).
   - En cas de statut 401 Unauthorized, la session locale est automatiquement purgee et l'utilisateur est redirige vers l'ecran d'accueil.
3. **Avatars Deterministes Blobatar** :
   L'avatar de l'utilisateur est genere dynamiquement a partir de son adresse email ou de son nom d'utilisateur a l'aide du composant `BlobatarAvatar`, garantissant une identite visuelle unique sans necessiter de stockage d'image lourd en base de donnees.
4. **Cache des Donnees Serveur (TanStack Query)** :
   - Les donnees serveur sont lues via `useQuery` (cles centrees dans `src/services/query/queryKeys.ts`) et ecrites via `useMutation`.
   - Toute mutation (creation, modification, suppression) appelle `queryClient.invalidateQueries(...)` pour re-actualiser les ecrans actifs.
   - Les mutations de transaction invalident `["transactions"]` (liste, détail, résultats de recherche, stats mensuelles) **et** `["wallets"]` (les soldes des portefeuilles sont recalcules cote API).
   - Une reponse de moins de 30 secondes est consideree fraiche : retour sur un ecran ou changement d'etat applicatif n'entraune alors aucune requete reseau supplementaire.
   - Le cache est entierement purge (`queryClient.clear()`) a la deconnexion et en cas de reponse 401, pour eviter toute fuite de donnees entre comptes.
5. **Page Statistiques** :
   - Deux onglets `Revenu` / `Dépense` (Segmented Control natif) selectionnent la serie affichee : barres vertes (`colors.green`) pour les revenus, rouges (`colors.rose`) pour les depenses ; le mois selectionne reste en opacite 1 (`highlightedBarIndex`), les autres sont attenues (`lowlightOpacity`).
   - Le graphique couvre les 6 derniers mois via `GET /api/Transaction/monthly?months=6` (cles `queryKeys.transactions.monthly(walletId, months)`).
   - Le selecteur de portefeuille inclut l'entree « Tous les wallets » (valeur `"all"` → `walletId` absent de la requete).
   - L'objectif s'affiche uniquement pour un portefeuille selectionne doté d'un `goal` : progression = `montant/objectif`, revenu % = `totalIncome/objectif`, depense % = `totalExpenses/objectif` — toutes les valeurs proviennent du cache `["wallets"]`, sans appel API supplementaire.
   - L'objectif se modifie dans le formulaire portefeuille (`walletModal`, champ optionnel numerique).
6. **Modal de Recherche de Transactions** :
   - `transactionSearchModal.tsx` s'ouvre depuis la loupe de l'accueil (`router.push("/(modals)/transactionSearchModal")`) et s'inscrit dans `_layout.tsx` avec `presentation: "modal"`.
   - La saisie est debouncée à 300 ms (lodash `debounce`, annulation via `cancel()` au démontage et à l'effacement ; aucun `setState` dans un `useEffect`).
   - La recherche `q` matche la description, la catégorie, le nom du portefeuille et les alias `income` / `expense` (champ unique, requête `GET /api/Transaction?q=...`).
   - Pagination infinie via `useInfiniteQuery` (clé `queryKeys.transactions.search(q)`, `PAGE_SIZE = 20`) : chaque page demande `limit = 21` et tronque à 20 entrées, `hasMore` = réponse de 21 entrées, `offset` incrémenté de 20.
   - Le rendu réutilise `TransactionList` (props optionnelles `onEndReached` / `fetchingMore` / `fill`) ; `fill` active `flexGrow` sur le conteneur pour occuper la hauteur disponible en contexte borné (modal), la chaîne `flex` doit être bornée jusqu'à `ModalWrapper` ; un appui sur une ligne ouvre `transactionModal` avec `params.id` (invalidation `["transactions"]` au retour).

---

## 5. Guide de Demarrage et Commandes

### 5.1 Installation des Dependances
```powershell
npm install
```

### 5.2 Verification de la Compatibilite Expo
```powershell
npx expo-doctor
```

### 5.3 Verification TypeScript et Linting
```powershell
# Verification du typage statique
npx tsc --noEmit

# Analyse de conformite ESLint
npx eslint .
```

### 5.4 Reconstruction du Development Client (dependances natives)
Apres l'ajout ou la mise a jour d'un paquet contenant du code natif (`@react-native-segmented-control/segmented-control`, `expo-linear-gradient`, ...), le dev client doit etre regenere :
```powershell
npx expo run:android
# ou
npx expo run:ios
```

### 5.5 Lancement du Serveur de Developpement Metro
```powershell
npx expo start
```

Raccourcis disponibles dans le terminal :
- `s` : Basculer entre Expo Go et Development Build.
- `a` : Lancer sur emulateur Android.
- `w` : Ouvrir dans le navigateur web.
- Scanner le QR Code affiche avec l'application Expo Go sur appareil physique.

### 5.6 Test de Compilation et Bundling
```powershell
npx expo export --no-bytecode
```
