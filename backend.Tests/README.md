# Tests - Expense Backend

Ce projet contient la suite de tests (unitaires et d'intégration) pour l'API Web Backend du projet **Expense**, développée en .NET 9 avec xUnit et FluentAssertions.

## Prérequis

Avant de lancer les tests, assurez-vous d'avoir :
- Le SDK .NET (version 9.0) installé sur votre machine.
- Le projet principal (`backend`) configuré et fonctionnel.

---

## Structure des tests

Le projet de test est organisé de la manière suivante :
- **`UnitTests/`** : Tests isolés pour valider la logique métier (services, validateurs, etc.) sans dépendance externe lourde.
- **`IntegrationTests/`** : Tests fonctionnels de bout en bout utilisant `WebApplicationFactory` pour simuler le comportement de l'API (appels HTTP, contrôleurs, base de données).

---

## Lancer les tests

1. Ouvrez votre terminal et placez-vous dans le dossier du projet de test :
   ```bash
   cd backend.Tests


2. Restaurez les dépendances du projet de test :
```bash
dotnet restore

```


3. Exécutez la suite de tests :
```bash
dotnet test

```



### Options utiles pour `dotnet test` :

* **Afficher les détails de chaque test dans la console** :
```bash
dotnet test --logger "console;verbosity=detailed"

```


* **Lancer un test spécifique** :
```bash
dotnet test --filter "FullyQualifiedName~NomDeVotreTest"

```
