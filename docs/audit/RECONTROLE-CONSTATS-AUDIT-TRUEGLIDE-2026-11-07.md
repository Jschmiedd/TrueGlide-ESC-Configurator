# Recontrôle des constats transmis par l'audit TRUEGLIDE (07/11/2026)

Source : message de la session d'audit TRUEGLIDE (session_01VvqUCsD9iRLVMzii8FW6NM), transmis sur ordre écrit de Johann. Chaque point a été revérifié ici sur `master` `26a57e3` (en ligne : `gh-pages` `2522d4c`). Lecture du code uniquement [CODE].

| N° (audit TRUEGLIDE) | Constat | Recontrôle | Gravité retenue ici |
|---|---|---|---|
| B1 | « Valeurs par défaut » remet les 4 ESC aux réglages d'usine en un clic, sens moteur compris, sans confirmation ni sauvegarde | **Confirmé** : deux boutons (`src/Components/Buttonbar/index.jsx:101-105` et `:128-132`) appellent directement `handleResetDefaultls` (`src/Containers/App/index.jsx:579-609`) ; aucun `confirm` dans `src/` ; `MOTOR_DIRECTION` fait partie des valeurs par défaut Bluejay (`src/sources/Bluejay/settings.js:541`, valeur 1 = normal). Sur le KarRmen (sens « Reversed »), un clic inverse les 4 moteurs. Pas de sauvegarde automatique avant (seulement avant un flash). Ce point m'avait échappé lors des audits précédents. | **BLOQUANT pour la bêta** (aligné sur l'audit TRUEGLIDE) : un clic suffit pour qu'un drone se retourne au décollage. Correction simple : confirmation + sauvegarde automatique avant, et le sens moteur conservé par défaut. |
| M1 | Moteurs non arrêtés quand la page est seulement cachée | **Confirmé** : seuls `beforeunload` et `pagehide` (`src/Components/MotorControl/index.jsx:221-230`), pas de `visibilitychange`. | MAJEUR |
| M2 | v16 reconstruite sur place ; ancienne version possible en cache | **Confirmé** : `onglet/v16/` contient maintenant `main.36b29e0d.js` (26a57e3) alors qu'il contenait 29100f6 le 06/11. Un onglet « figé » ne doit plus changer : nouvelle adresse (v17) à chaque version. | MAJEUR |
| M3 | Sens, 3D, timing, puissance de démarrage écrits sans confirmation particulière | **Confirmé** (`handleWriteSettings`). Même comportement que l'outil d'origine et que BLHeliSuite. | MINEUR (recommandation : rappel « vérifiez le sens des moteurs » après écriture si `MOTOR_DIRECTION` change) |
| M4 | Firmwares hors liste validée via `cors.bubblesort.me` sans empreinte | **Confirmé** — déjà noté (M1 « partiel » de mes contre-audits). | MAJEUR |
| M5 | AM32 sans nom de fichier : seul le MCU est contrôlé, pas la cible | **Confirmé** (`src/utils/FourWay.js:393-395` : `if (force || !am32.fileName) return;`). Cas : ESC vide ou firmware AM32 < 1.93. | MAJEUR (AM32 reste « expérimental ») |
| M6 | Récupération jamais essayée sur matériel | **Confirmé** — déjà noté (B5, fiche Q5). | MAJEUR |
| mineur | Numéro d'ESC faux dans deux messages d'erreur | **Confirmé** : `index: i + 1` au lieu de `target + 1` (`src/Containers/App/index.jsx:604` et `:753`). | MINEUR |

## Point supplémentaire (analyse des preuves TGE-P4)

Les ESC du KarRmen ont probablement fini l'essai du 07/11 avec `STARTUP_MELODY_WAIT_MS` = 65535 (dernier rechargement à 20:15:17 = sauvegarde de 20:06:42). Avant l'essai suivant : recharger la sauvegarde de 19:52:44. Détail : `docs/audit/ANALYSE-PREUVES-TGE-P4-2026-11-07.md`.

## Verdict

Inchangé : **PAS PUBLIABLE**. Avant la bêta, en plus de ce qui était déjà listé : B1 (valeurs par défaut) corrigé, M1 (page cachée) et M2 (adresse figée v17) traités.
