# Contrôle du mode d'emploi « Offline mode and safe settings restore » (pour Chris) — 22/11/2026

Texte reçu de la session d'essai v34 (session_01VvqUCrLN2GqDyQ4puww5Un), non commité. Vérifié contre le code de `739d256` (branche `trueglide/v34-hors-ligne`) et `src/translations/en/*.json`.

## Verdict : NON CONFORME — corrections simples, aucune erreur de fond sur la sécurité

Vérifié exact [CODE] : fonctions citées (`buildBackup`, `parseBackup` avec versions 1 et 2, `getRestoredSettings`, `getSettingChanges`, `isSameValue`, `getMismatchedSettings`, `handleOpenOffline` refusé si un port est ouvert ou en ouverture, `isOffline`, `handleSaveOffline`, `writeBackup`, `keepRotation` avec `MOTOR_DIRECTION`, `BIDIRECTIONAL_MODE`, `RC_CAR_REVERSING`) ; sauvegarde avant écriture et refus si elle échoue (`settingsRestoreNoBackup`) ; relecture et proposition de remise en état (`confirmRestoreAfterMismatch`) ; les trois corrections de 739d256 ; 651 tests [EXÉCUTÉ]. Aucune donnée privée, aucune mention d'IA, aucune référence à XPro ni aux dépôts privés.

## Corrections demandées

| § | Texte actuel | Texte corrigé | Raison |
|---|---|---|---|
| 1.2.3 | **Save ESC settings** | **Save the ESC settings** | libellé réel `escButtonSaveSettings` |
| 1.2.4 | *"Were the motor order and direction checked on the bench, props off?"* | *"Were the motor order and direction checked on the bench, propellers removed?"* | texte réel `confirmBenchChecked` |
| 1.3.4 | **Save file** | **Save the file** | `offlineSave` |
| 1.4.2 | **Restore saved settings** | **Load saved settings** | `escButtonRestoreBackup` |
| 1.4.3 | *"File edited offline on …: check every value"* | *"File edited offline on …: check each value"* | `restorePreviewEditedOffline` |
| 1.4.4 | *"Restore cancelled: nothing was written"* | *"Loading cancelled: nothing was written"* | `settingsRestoreCancelled` |
| 1.4 (ajout) | — | « If the file holds a different number of ESCs than are connected, or not all ESCs were read, nothing is written. » | `settingsRestoreCountMismatch`, `settingsRestoreEscNotRead` : comportement de sécurité non décrit |
| 1.4.3 (ajout) | — | « The preview may also show *Low voltage cut: … → …*: this TrueGlide build always writes the ESC low-voltage cut-off as disabled, whatever the file says. » | `restorePreviewLowVoltageRule` : valeur écrite qui ne vient pas du fichier ; Chris doit le savoir |
| 1.2 / 1.3 (ajout) | — | préciser que les noms de fichiers sont en français : `trueglide-esc-reglages_…json`, `…_hors-ligne.json` | clarté pour un lecteur anglophone |
| 2.1 | « `benchChecked` (+ date) and `editedOffline` (+ date) are top-level flags » (sous `buildBackup()`) | « … are top-level flags added by the app when saving (`handleSaveEscSettings`, `handleSaveOffline`) » | ils ne sont pas écrits par `buildBackup()` mais par `src/Containers/App/index.jsx` |
| 2.3 (dernière ligne) | **Restore settings from before the flash** | **Put back the settings from before the flash** | `escButtonRestoreBeforeFlash` |
| 2.1 | « (*damaged file refused*) » | « (*"This file is not a TrueGlide ESC Configurator settings backup: nothing was written"*) » | pas de message « damaged file » ; texte réel `settingsRestoreInvalid` |
| 2.5 (dernière ligne) | « Only BLHeli_S and Bluejay are covered by this proposal and its tests on real hardware. » | « This proposal covers BLHeli_S and Bluejay. On real hardware only Bluejay 0.19 (J-H-40) was tested; BLHeli_S is covered by the automated tests only. The code does not exclude AM32, which was not tested. » | BLHeli_S n'a jamais été essayé sur matériel |
| En-tête | « behind a Betaflight-based F405 flight controller, props off, 4S battery » | « behind an F405 flight controller running TRUEGLIDE (a Betaflight-based firmware), propellers removed[, 4S battery] » | préciser le firmware réellement utilisé ; « 4S » à confirmer par Johann (non prouvé ici) |
| 1.5 | « all key steps passed and every ESC was read at every read » | garder seulement si la fiche TGE-V34 le montre ; sinon « all steps listed below passed » | la fiche TGE-V34 n'est pas dans le dépôt : non vérifiable ici |
| 1.5 | « re-checked on the bench » (739d256) | « re-checked on the bench for these three points only; the full 21-step protocol was run on 7b156d4 » | exactitude |

## Remarques pour Johann
- Selon la session de développement, les règles de Chris excluent docs et essais des PR : ce texte sert à présenter le travail (issue citant #107), pas à être ajouté dans une PR.
- 739d256 n'a pas été écrit par la session de développement mais par la session d'essai v34 ; il a été contrôlé ici (`CONTROLE-739d256-2026-11-22.md`).

## Contrôle final (texte corrigé, 22/11/2026) — CONFORME
Toutes les corrections demandées sont appliquées (libellés, ajouts, § 2.1, § 2.5, en-tête, § 1.5). Les sections marquées « inchangé » ont été contrôlées au premier passage.
- « 4S » et « all 4 ESCs were read at every read » : attestés par la session d'essai v34 (captures et journaux vus par elle, non joints ici).
- Deux précisions facultatives :
  1. § 1.3.3 : « Restore defaults » → « Restore Default Settings » (libellé réel `resetDefaults`).
  2. § 2.5, dernière ligne : « to be fixed: stop only when the unplugged port is the open one » → « to be fixed: when another port is unplugged, keep the open connection; stop the motors before any disconnection » (formulation actuelle ambiguë).

## Version PDF avec captures (22/11/2026) — NON CONFORME (encadré à compléter)
- A « Why: the advantages » : conforme (précision facultative : valeurs hors limites « not written; the ESC keeps its own value »).
- B « Simplified decision for one ESC » : à compléter avec (1) contrôle du fichier entier : même nombre d'ESC que connectés et tous lus, sinon rien n'est écrit ; (2) ESC FLASH*FAILED ou BLHeli_32 : jamais écrit ; (3) « valid » = même description dans le fichier et dans ce firmware, et valeur dans les bornes. Note facultative : « Put back the settings from before the flash » accepte une autre révision et le sens (copie en mémoire du même ESC).
- C note d'en-tête, E métadonnées : conformes.
- D légendes : conformes ; images non vues par l'audit (PDF non transmis) — à déposer pour contrôle, ou mention « images contrôlées par la session d'essai ».
