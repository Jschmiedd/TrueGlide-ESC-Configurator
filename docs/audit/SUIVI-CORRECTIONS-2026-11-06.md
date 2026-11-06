# Suivi des corrections de l'audit du 06/11/2026

Rapport d'audit : branche `audit/publication-public`, `docs/audit/CONTROLE-PUBLICATION-2026-11-06.md`.
Corrections : branche `trueglide/audit-corrections` (partie de `master` ab3a994). Rien n'est publié tant que Johann
n'a pas écrit l'adresse (/test/, /app/).

Contrôle sur le dernier commit : `yarn lint` 0 erreur ; `yarn test` 496 tests réussis sur 496 ; `yarn build` réussi ;
Node 22 sans contournement. Couverture : `src/utils/FourWay.js` 45 % → 72 % des lignes ; `src/Containers/App` 36 % → 39 %.
Chaque correction a un test, montré en échec sur l'ancien code (fichier remis à l'ancienne version, test lancé, puis
remis à jour).

## Bloquants

| N° | Correction | Commit | Preuve |
|---|---|---|---|
| B1 | ESC mélangés : flash, copie et écriture décidés ESC par ESC ; BLHeli_32 jamais lu ni écrit | c8afd30 | `Containers/App` « App flash » |
| B2 | Interface jamais bloquée après un refus de flash | c8afd30 | « should unlock the interface when a flash is refused » |
| B3 | Onglet v15 (broches AM32 non essayées) dans TrueGlide /app/ | — | **Décision de Johann** : nouvel onglet construit sur cette branche, sans les broches non essayées |
| B4 | Arrêt des moteurs envoyé directement à la déconnexion, avant de fermer la prise | c8afd30 | « App disconnect » |
| B5 | Page « Récupérer un ESC après un flash raté » (site d'essai, `site-test/doc/recuperation.html`) ; lien dans le journal après un flash raté ; phrase « avec la case de forçage » corrigée | 46c49c5 (logiciel), gh-pages local 9a7dfb2 (site) | Test : un ESC « **FLASH*FAILED** » se relit et se reflashe sans forçage (`FourWaySiLabsFlash.test.js`). Essai réel (P5) encore à faire |

## Majeurs

| N° | Correction | Commit | Preuve |
|---|---|---|---|
| M1 | Liste des firmwares validés avec SHA-256 (Bluejay 0.19.2 J_H_40 24 kHz, empreinte calculée sur le fichier de GitHub) ; copie sur le site TrueGlide d'abord (sans relais), relais en secours ; refus si l'empreinte diffère ; avertissement pour les autres versions | 70bfc1e | `FirmwareIntegrity.test.js`, « App firmware integrity » (4 échouent sans le contrôle) |
| M2 | Voir B2 | c8afd30 | |
| M3 | Google Tag Manager retiré | 46b620c | |
| M4 | Anciens onglets v1 à v13 et `essai` en ligne | — | **Décision de Johann** (retrait de gh-pages) |
| M5 | Avis de non-responsabilité dans le logiciel avant le flash ; page « Confidentialité et mentions légales » (site d'essai) | 46b620c ; gh-pages local 9a7dfb2 | Mentions légales : adresse postale de l'éditeur à fournir par Johann |
| M6 | Textes du logiciel corrigés ; site d'essai : version, nombre de tests, liste des ESC validés, forçage, sauvegarde, contrôle du fichier, polices hébergées sur le site | 46b620c ; gh-pages local 9a7dfb2 | Pages contrôlées à 1280 et 375 px : aucun débordement, aucune requête externe, liens internes valides |
| M7 | Réglages téléchargés dans un fichier avant chaque flash ; « Recharger des réglages sauvegardés » (même position, firmware, layout ; valeurs d'identité jamais reprises) | 309710e | `SettingsBackup.test.js`, « App settings backup » |
| M8 | Risque « câble USB débranché pendant le test moteurs » écrit dans le logiciel et la page moteurs | 46b620c ; gh-pages local 9a7dfb2 | Délai de sécurité côté firmware TRUEGLIDE : hors de ce dépôt |
| M9 | ESC SiLabs simulé (mémoire flash, effacement par page matérielle) : flash complet, ordre des protections, échec à chaque étape, refus MCU et fichier invalide ; flash raté et fichier introuvable côté application | 06e893d | Retirer le saut LJMP ou le nom de sécurité du code fait échouer 3 et 4 tests |
| M10 | Case de forçage du layout seulement en mode avancé | 46b620c | Confirmation tapée : **décision de Johann** |

## Mineurs

| N° | Correction | Commit |
|---|---|---|
| m1 | Le choix du firmware dit si le fichier précis est validé par TrueGlide ou non | 168ddf6 |
| m2 | Nom de fichier AM32 retenu seulement s'il est complet ; corrige aussi la perte du dernier caractère d'un nom de 16 caractères | 25cf6d4 |
| m3 | Vitesse bornée juste avant l'envoi | 46b620c |
| m4 | Barre d'état : version et lien vers le commit exact | 45538b3 |
| m5 | README et journal des modifications TrueGlide | c1db98c |
| m6 | `sleep` retiré, Node 18 à 22, vérification GitHub sous Node 22 | 7728764 |
| m7 | `semver` et `ua-parser-js` mis à jour ; tri des alertes : `docs/audit/TRI-DEPENDANCES-2026-11-06.md` | 66a6a65 |
| m8 | Layout EEPROM Bluejay comparé à la source officielle 0.19.2 : identique | f9f5d71 |
| m9 | Coupure tension basse forcée à « désactivée » après tout flash | 46b620c |

## Contre-audits n° 1 et 2 (06/11)

| N° | Correction | Commit |
|---|---|---|
| N1 | Écritures (réglages, mélodies, valeurs par défaut) : ESC BLHeli_32 sautés explicitement | d8bd2e9 |
| N2 | Trois messages : refusé avant d'écrire / raté pendant l'écriture / flashé mais réglages non repris | d8bd2e9 |
| N3 | Atmel ou interface inconnue : message, rien d'écrit, ESC suivant | d8bd2e9 |
| N5 | Forçage remis à faux et ignoré quand la case est cachée | d8bd2e9 |
| N6 | Texte d'accueil : seul Bluejay essayé sur un drone | d8bd2e9 |
| N8 | Résultats TGE-P1 à jour | d8bd2e9 |
| R3 | Rechargement : seulement les réglages de l'écran, dans ses limites | d8bd2e9 |
| R4 | react-gtm-module retiré | d8bd2e9 |
| B2 (notice) | Récupération AM32 « FLASH FAIL » marquée non vérifiée sur le site d'essai | gh-pages local 1bd0b21 |
| N7 | Blocage du test moteurs en mode 3D : **contredit la décision de Johann** (option A, 1350-1650 µs) ; non fait, question posée | — |
| N4, R1, R5, B3, M4 | Publication : attend l'accord écrit de Johann | — |

## Ce qui attend Johann

1. B3 : construire un nouvel onglet depuis cette branche pour remplacer v15 dans TrueGlide /app/.
2. M4 : retirer `onglet/v1` à `v13` et `onglet/essai` de gh-pages.
3. Publier sur /test/ (puis /app/) cette branche, le site d'essai et la copie du firmware validé (`firmwares/`).
4. N7 : bloquer le test moteurs en 3D jusqu'à l'essai, ou garder l'option A.
5. M5 : adresse de l'éditeur pour les mentions légales. M10 : confirmation tapée ou non.
6. Essais matériel : P5 (coupure pendant un flash, pour vérifier la page de récupération), AM32, retour BLHeli_S, mode 3D.
