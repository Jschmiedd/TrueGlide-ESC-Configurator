# Contrôle du document d'étude TGlide_32 v0.1 — 22/11/2026

Document reçu de la session TGlide_32 (SHA-256 d9058220…), non commité. Contrôle des affirmations portant sur le configurateur public (`9fcf308`) et sur la disposition EEPROM d'AM32 (branche `main` lue en ligne, sans commit figé).

Vérifié : dispositions AM32 '0'/'1'/'2' seulement ; `LAYOUT_SIZE` 0xB0 ; NAME 0x05-0x10 ; `layoutNotSupported` ; signatures Arm 1F06 et 3506 seulement ; broches PA2/PB4/PA6 ; coupure tension basse forcée à 0 (octet 0x24). AM32 `main` : bloc 192 octets, 5-14 = réglages (max_ramp…demag_comp), 36 = low_voltage_cut_off, 37 = low_cell_volt_cutoff, 47 = auto_advance, 176-191 CAN/réservé, nom du firmware en flash. `EEPROM_VERSION` = 4 non vérifié.

## Verdict : CORRECTIONS
1. Constat c : mentionner « AM32-PIN » (PA0/PA15/PB2/PC6 reconnus, non lus) et la leçon B3 (v15 retirée : risque BLHeli_32 pris pour AM32).
2. Constat b / § 4 : `layoutNotSupported` ne bloque pas l'écriture ; proposer le blocage (écriture, migration, rechargement) quand la disposition n'est pas décrite. Constat de l'audit : l'écriture actuelle ne devrait pas corrompre un ESC v4 (octet 0x24 identique, octets 5-16 conservés), non essayé au banc.
3. Licences : écrire les obligations GPL v3 (source avec chaque binaire, copyright AM32, modifications marquées, nom distinct) ; pilotes fabricants non audités = pas de distribution.
4. Recommandé : vérifier que `absolute_voltage_cutoff` (octet 8) et `low_cell_volt_cutoff` (37) ne coupent pas les moteurs quand l'octet 36 vaut 0 — concerne aussi le configurateur public.
5. Recommandé : étape « refus d'un autre MCU/cible » et ESC sacrifiable avant P3.

## v0.2 (SHA-256 88c27d35…) — ACCORD pour remise à Johann
Corrections 1-3 et recommandations 4-5 reprises. Vérifié par l'audit dans AM32 `2a695a8` (`Src/main.c` téléchargé en entier) : le compteur de tension basse n'augmente que si `low_voltage_cut_off` vaut 1 ou 2 (l.2341-2357) ; arrêt complet après 10 000 incréments, 100 en mode sinus (l.2359-2366) ; `cell_count` seulement si 1 (l.1542) ; `EEPROM_VERSION 4` (`Inc/version.h`). À 0 : aucune coupure. Le configurateur public, qui écrit 0, garantit donc la règle « jamais de coupure tension basse en vol » pour AM32 v2.22.
Précision demandée : option de compilation `VOLTAGE_BASED_RAMP` (l.1645), qui limite la montée des gaz selon la tension ; vérifier qu'aucune cible ne la définit, ou écrire que TGlide_32 ne l'active pas.
