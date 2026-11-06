# Tri des alertes de dépendances (audit du 06/11/2026, point m7)

Méthode : `yarn audit --groups dependencies` (1345 paquets), croisé avec la liste des paquets réellement présents dans la
page livrée (cartes de sources de `yarn build`, 95 paquets). Une alerte sur un outil de compilation ou de test
(`react-scripts`, `jest`, `eslint`…) ne touche pas l'utilisateur : ces paquets ne sont pas dans la page.

## Corrigé (06/11/2026)

| Paquet | Avant | Après | Pourquoi |
|---|---|---|---|
| `semver` (utilisé par notre code pour comparer les versions Bluejay et AM32 lues sur GitHub) | 7.3.8 | 7.5.4 | ReDoS corrigé en 7.5.2 ; 7.5.4 date de 2023 (pas de version toute neuve) |
| `ua-parser-js` (utilisé par notre code pour reconnaître le navigateur) | 1.0.2 | 1.0.41 | ReDoS corrigé en 1.0.33 ; branche 1.x, licence MIT |

`yarn.lock` modifié à la main (version, adresse, empreinte sha512 du registre, vérifiée sur l'archive téléchargée) :
l'environnement de travail ne joignait pas `codeload.github.com` (dépendance `web-serial-polyfill`), donc `yarn upgrade`
était impossible. Le contrôle `yarn install --frozen-lockfile` passe l'étape de résolution ; 490 tests et la compilation
réussissent.

## Restant dans la page livrée, jugé sans risque pour l'utilisateur

| Paquet (chemin) | Alerte | Pourquoi sans risque ici | À faire |
|---|---|---|---|
| `ua-parser-js` 0.7.31 (`draft-js > fbjs`) | ReDoS | N'analyse que le navigateur de l'utilisateur lui-même | Remplacer l'éditeur de mélodies `draft-js` (abandonné) à terme |
| `lodash` 4.17.21 (`rc-slider > … > rc-align`) | `_.template`, `_.unset` | Ces fonctions ne sont pas appelées avec des données extérieures | Mise à jour avec `rc-slider` |
| `@babel/runtime` 7.x (redux, i18next, rc-slider) | RegExp lente avec groupes nommés | Concerne du code compilé avec `.replace` et des groupes nommés, absent ici | Mettre à jour au prochain `yarn upgrade` sur un PC avec accès complet |

## Hors page livrée

Toutes les autres alertes (dont les 35 « critiques ») viennent de `react-scripts` et de ses outils (compilation, tests,
lint). Elles concernent seulement la machine qui compile. À traiter en passant de `react-scripts` 5 à un outil maintenu
(par exemple Vite), chantier à part.
