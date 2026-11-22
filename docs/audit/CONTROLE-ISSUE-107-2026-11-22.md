# Contrôle du texte d'issue pour stylesuxx/esc-configurator (suite de #107) — 22/11/2026

Brouillon v1 (SHA-256 b5fdd76d8496d8b8…), reçu de la session ESC public ; à poster par Johann.

Vérifié : faits sur #107 (page publique lue : ouverte par stylesuxx le 27/04/2021, export JSON demandé, fichier par ESC suggéré par un participant, fermée le 12/12/2022 avec le dump .hex) ; comportement de 739d256 (`SettingsBackup.js`, `Containers/App/index.jsx`) ; rien de privé, rien de XPro, pas de mention d'IA ; « bench quad with 4 Bluejay ESCs (props off) » exact selon TGE-V34.

## Verdict : CORRECTIONS
1. « the settings the UI shows » → « the settings read from the ESC » (`buildBackup` enregistre tous les réglages lus).
2. « the log says why » → « the log says so » (raison générique dans `settingsRestoreSkipped`).
3. « Anything else is skipped and listed in the log » → seules les valeurs hors limites sont listées ; les autres réglages restent tels quels.
4. Ajouter que le fork diffère sur deux points non proposés (sens moteur depuis un fichier vérifié au banc ; coupure tension basse toujours désactivée).
5. Facultatif : préciser « Bluejay 0.19 (J-H-40) ».
