# TGE-P4 : résultats (KarRmen, 07/11/2026)

Drone : KarRmen, SpeedyBee F405 Mini, carte en TRUEGLIDE (« BTFL version : 26.6.2 », firmware du 07/11/2026 13:51:02),
ESC BLS 35A en Bluejay 0.19 (J-H-40, 24 kHz, sens « Reversed », bip 40). Hélices retirées. Fait par Johann.
Version essayée : onglet ESC v16 de TrueGlide Configurator /test/, commit 29100f6.
Preuves : `esc-configurator-log.txt` (identifiant de carte masqué) et les deux sauvegardes automatiques de réglages.

| Point | Résultat | Preuve (journal) |
|---|---|---|
| Lecture des 4 ESC | réussi | 19:51:11-13 |
| Note « version validée » pour Bluejay 0.19.2 J-H-40 24 kHz | réussi | capture de Johann |
| Firmware pris sur la copie TrueGlide, SHA-256 vérifiée | réussi | 19:52:44 « Firmware taken from the TrueGlide copy », « SHA-256 checked » |
| Sauvegarde automatique avant le flash | réussi | 19:52:44, fichier `…19-52-44.json` |
| Flash des 4 ESC, sens des moteurs repris | réussi | 19:52:44 → 19:53:32, 4 × 10,9 s, « Migrated setting MOTOR_DIRECTION » |
| Refus du layout J-H-25 | **réussi pour l'ESC 1 seulement** | 20:06:42 : refus de l'ESC 1, puis arrêt (défaut 2) |
| Rechargement d'une sauvegarde | réussi | 20:11:04-06 « settings loaded from the backup » ×4 |
| Arrêt des moteurs en quittant l'onglet (menu Studio) | réussi | déclaré par Johann |

## Défauts trouvés (corrigés dans 6a2ba08, en ligne avec 26a57e3)

1. Au flash, `STARTUP_MELODY_WAIT_MS` n'était pas repris : 0 dans la sauvegarde de 19:52:44, 65535 dans celle de 20:06:42
   (journal : pas de « Migrated setting STARTUP_MELODY_WAIT_MS »). Effet : bips différents au branchement. Réglage remis
   par « Recharger des réglages sauvegardés » ; bips redevenus normaux (Johann).
2. Refus d'un mauvais layout : seul l'ESC 1 était contrôlé (aucune ligne pour les ESC 2 à 4 à 20:06:42).

## Remarques

- 20:15:17 : un rechargement a réécrit les ESC alors que 20:14:46 disait « aucun changement » : le fichier de 20:06:42
  (avec 65535) a probablement été choisi ; corrigé ensuite avec le fichier de 19:52:44.
- Les bips diffèrent selon l'ordre de branchement (USB puis batterie, ou batterie puis USB) : comportement normal de Bluejay.

## À refaire sur 26a57e3

- Flash avec « Migrer les paramètres » : pas de silence de 65 s après la mélodie.
- Mauvais layout : refus pour les 4 ESC.
