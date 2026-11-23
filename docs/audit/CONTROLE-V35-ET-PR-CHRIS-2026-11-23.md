# Contrôle de la v35 et de la PR n°1 pour Chris — 23/11/2026

## B) v35 — `trueglide/v35-tglide8` (d590e38, fb03a60, 50690ba, 1ad4b5d sur 739d256) — CONFORME
[EXÉCUTÉ] tree f5755b43… identique à l'annoncé ; commits Jschmiedd noreply, sans Co-Authored-By ni lien de session ; 695/695 tests ; lint 0 erreur ; 32 des nouveaux tests échouent sur 739d256.
[CODE]
- Disposition AM32 4 : chaque offset comparé à AM32 `2a695a8` `Inc/eeprom.h` (téléchargé) : 0-4, 5-14, 17-30, 32-46, 47, 48-175 identiques ; 15-16, 31 et 176-191 non décrits et conservés ; 192 octets lus et réécrits.
- Flash AM32 : l'octet 0 est mis à 0 avant d'écrire les pages, pour toutes les dispositions, et remis à 1 seulement après vérification ; « FLASH FAIL »/« NOT READY » seulement sur les dispositions à nom. Le chargeur AM32 (v12+) ne démarre pas le firmware si l'octet 0 ≠ 1 (vérifié dans `bootloader/main.c`). Avertissement si chargeur < 12.
- Écriture : garde dans `FourWay.writeSettings` (`LayoutNotDescribedError`) + sauts explicites dans l'écriture, les valeurs par défaut, le rechargement, la migration au flash, la règle tension basse, les mélodies (via l'écriture).
- Tension basse : octet 36 forcé à 0 sur la disposition 4 (0 ne coupe jamais, `main.c` l.2341-2366).
- `isBootBlocked` : un ESC AM32 dont l'octet 0 ≠ 1 est affiché « FLASH FIRMWARE », jamais écrit, toujours flashable (récupération).
- TGlide_8 : nom « Bluejay (TG8 .1) » affiché « J-H-40 - TGlide_8 0.1 (Bluejay 0.21.0), 24kHz » ; détection et migration Bluejay inchangées.

Points à suivre : la fiche TGE-T8 v3 annonce le titre de la v34 (« J-H-40 - Bluejay, 0.21.0 TG8 .1, 24kHz ») ; sur la v35 le titre est « J-H-40 - TGlide_8 0.1 (Bluejay 0.21.0), 24kHz ». Partie AM32 non essayée au banc. Retour d'un ESC en disposition 4 vers un AM32 plus ancien : non étudié.

## A) PR n°1 pour Chris — `Jschmiedd/esc-configurator` `feat/settings-file` (1254255 sur 55e38f4) — CONFORME
[EXÉCUTÉ] tree 0c5d6925… identique ; auteur/committer noreply, message sans mention d'IA ; 487/487 tests ; lint 0 erreur ; 17 des nouveaux tests échouent sur 55e38f4.
[CODE] rechargement seulement si même nombre d'ESC (App) et, par ESC, même firmware, version (MAIN/SUB), révision et LAYOUT (`SettingsFile.js` l.124-125) ; `MOTOR_DIRECTION` jamais écrit (le 3D en fait partie pour BLHeli_S/Bluejay) ; 0xFFFF refusé ; aucun texte français ni règle TrueGlide ; logique dans `SettingsFile.js`.
