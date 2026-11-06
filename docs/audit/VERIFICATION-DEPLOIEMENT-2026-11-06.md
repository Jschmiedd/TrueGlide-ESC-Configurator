# Vérification du déploiement du 06/11/2026 (soir)

Objet : contrôler ce qui est réellement en ligne après le déploiement annoncé par la session de développement, sur la demande écrite de Johann (« version corrigée sur test et app », « anciens onglets : oui, tu peux les retirer »).

Sources vérifiées : branche `master` `29100f6` (fusion de `trueglide/audit-corrections` `2707daa`, PR n° 15) ; branche `gh-pages` `c7d1e79` ; site en ligne `https://jschmiedd.github.io/TrueGlide-ESC-Configurator/`.

## Ce qui est vérifié

| Point | Résultat | Preuve |
|---|---|---|
| `master` = branche corrigée | oui : aucun écart entre `2707daa` et `29100f6` | [EXÉCUTÉ] `git diff` vide |
| `/app/`, `/test/`, `/onglet/v16/` compilés depuis `29100f6` | oui : le commit `29100f6` est inscrit dans les trois fichiers livrés | [EXÉCUTÉ] fichiers de `gh-pages` |
| Code v15 (broches PA0/PA15/PB2/PC6 « en essai ») absent de ces trois versions | oui (aucune trace du message « broche non essayée ») | [EXÉCUTÉ] |
| Google Tag Manager jamais démarré, pas de polices Google | oui dans le logiciel ; site principal et notices sans `fonts.googleapis.com` (polices hébergées dans `fonts/`, licences OFL jointes) | [EXÉCUTÉ] |
| Aucune trace « XPro » | oui | [EXÉCUTÉ] |
| Copie du firmware validé | `firmwares/bluejay/v0.19.2/J_H_40_24_v0.19.2.hex` en ligne (200), SHA-256 `0fbfc678…db0ff4c2`, identique au fichier officiel Bluejay | [EXÉCUTÉ] |
| Page de récupération | `doc/recuperation.html` en ligne (200), claire, avec les cas BLHeli_S/Bluejay, AM32, ESC muet, demande d'aide ; elle indique honnêtement qu'elle n'a pas encore été essayée en coupant un vrai flash | [EXÉCUTÉ] lecture |
| Page confidentialité et mentions légales | `doc/confidentialite.html` en ligne (200) ; éditeur « Talk True FPV », e-mail ; pays et éventuelle adresse postale à fournir par Johann | [EXÉCUTÉ] |
| Notices corrigées | `doc/flash.html` : plus de « désactive ces contrôles » ni « avec la case de forçage » ; `doc/moteurs.html` : paragraphe « Câble USB débranché pendant le test » ; accueil : « préversion 0.33 », « tests automatiques : 496 / 496 » | [EXÉCUTÉ] |
| Anciens onglets retirés | `onglet/v13/` et `onglet/essai/` : 404 ; seuls `v14`, `v15`, `v16` restent | [EXÉCUTÉ] |

## Ce qui reste

| N° | Gravité | Point | Pourquoi |
|---|---|---|---|
| B3 | **BLOQUANT** | `/onglet/v15/` est toujours en ligne et **chargé par TrueGlide Configurator `/app/`** (selon la session de développement ; son `/test/` charge v14). Le passage à v16 se fait dans TrueGlide Configurator : il attend l'accord écrit de Johann à cette session. | Fonction non essayée (broches AM32) dans la version publique. |
| B4 | **BLOQUANT jusqu'à preuve** | Arrêt des moteurs de la version en ligne jamais essayé au banc. | Fiche Q2. |
| B2 | à prouver | Comportement du chargeur AM32 en « FLASH FAIL ». La page de récupération le dit « non vérifié » : c'est honnête. | Fiche Q8 (si ESC AM32 sacrifiable). |
| B5 | **CORRIGÉ (documentation)**, à confirmer au banc | Page publiée ; elle décrit le dernier recours (programmateur C2 / ST-Link). | Fiche Q5 pour la confirmer. |
| N7 | **risque accepté par Johann** | Test moteurs en 3D gardé disponible « comme Betaflight » (1350-1650 µs). Selon la règle de Johann, une fonction non validée reste bloquante pour le verdict « PUBLIABLE » : il faut l'essai 3D au banc pour lever ce point. | Décision de Johann du 06/11. |
| M10 | **CORRIGÉ** | Pas de confirmation tapée, « comme Betaflight » : case en réglages avancés + avertissement. | Décision de Johann du 06/11. |
| M5 | partiel | Pays (et adresse postale si vente) à fournir par Johann. | — |
| Tests | NON VÉRIFIÉ ici | Résultat avec la vraie dépendance `web-serial-polyfill` : voir la vérification GitHub de `master`. | codeload bloqué ici |

## Verdict

**PAS PUBLIABLE** au sens strict, mais la version en ligne est maintenant **la version corrigée** : elle est nettement plus sûre que la v14 qui était en ligne.

Pour passer en **PUBLIABLE EN BÊTA** :

1. Johann écrit à la session TrueGlide Configurator : « passer l'onglet ESC en v16 » ; puis retrait de `onglet/v15/`.
2. Johann réussit **Q1** (Bluejay, flash et retour) et **Q2** (arrêt des moteurs) sur la version en ligne `29100f6`, puis retrait de `onglet/v14/`.
3. Johann réussit **Q5** (coupure USB et batterie pendant un flash, ESC sacrifiable) pour confirmer la page de récupération.

Le verdict **PUBLIABLE** demandera en plus l'essai du mode 3D au banc (N7) et, si AM32 est annoncé, la fiche Q8.
