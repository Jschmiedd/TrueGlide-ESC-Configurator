# TGE-P1 : résultats (KarRmen, 31/10 et 01/11/2026)

Drone : KarRmen, SpeedyBee F405 Mini, carte en TRUEGLIDE (« BTFL version : 26.6.2 », firmware du 31/10/2026 14:44:31),
ESC BLS 35A en **Bluejay** (J-H-40, 0.19, 24 kHz, sens « Reversed », bip 40). Hélices retirées.
Fait par Johann. Sources : fiche remplie, journal de débogage (31/10 21:24 → 01/11 12:25), captures et échanges.

| N° | Question | Résultat | Preuve / remarque |
|---|---|---|---|
| 1.1 | Logo, français, contact TalkTrueFPV | **oui** | captures |
| 1.2 | Journal : version et carte | **oui** | « BTFL version : 26.6.2 », « Carte : F405 » |
| 1.3 | Avertissements affichés | **oui** | captures |
| 1.4 | 4 ESC lus | **oui** | « J-H-40 - Bluejay, 0.19, 24kHz » (pas BLHeli_S : le drone est en Bluejay) |
| 1.5 | Lecture sans attente | **oui** | 4 ESC lus en 2 s |
| 2.1 | Puissance du bip conservée | **oui** | écriture 21:37:02, relecture 21:37:09 |
| 2.2 | Seul l'ESC changé | **oui** | 21:37:59 et 21:38:21 : seul l'ESC 1 écrit, les autres « Aucun changement » |
| 3.1 | Flash des 4 ESC | **oui** | Bluejay 0.19.2 J-H-40 24 kHz, 4 × 10,9 s (21:47) ; au lieu de « passer en Bluejay » : reflash du même firmware, « Migrer les paramètres » |
| 3.2 | Toujours Bluejay | **oui** | relecture 21:48:32 |
| 3.3 | Sens des moteurs conservé | **oui** | « Migrated setting MOTOR_DIRECTION », sens « Reversed » |
| 3.4 | Mélodie au rebranchement | **oui** | confirmé par Johann (fiche du 01/11) |
| 4.1 | Refus du mauvais layout | **oui** | 01/11 11:08 : « Layout mismatch… aborted » ×4, 0,1 s, rien écrit |
| 4.2 | ESC intacts | **oui** | relecture 11:11:03 |
| 5.1 | Mélodies | **oui** | fait par Johann : nouvelle mélodie jouée, les 4 ESC finissent ensemble |
| 6.1 | Case grisée, texte batterie | **oui** | capture 01/11 |
| 6.2 | Moteur 1 seul, max 1300 | **oui** | |
| 6.3 | 4 moteurs, max 1300 | **oui** | |
| 6.4 | Arrêt, curseurs à 1000 | **oui** | |
| 6.5 | Arrêt par la case | **oui** | |
| 6.6 | Arrêt par la lecture | **oui** | lecture 11:27:49 |
| 6.7 | Pas de « Masquer les avertissements » | **oui** | capture des paramètres |
| 6.8 | Mode 3D | **non** | pas de mode 3D sur ce drone |
| 7.x | Retour en BLHeli_S, réglages d'usine | **non (pas fait, retiré)** | on garde Bluejay et les réglages de vol |
| 8.1 | Onglet ESC, 4 ESC lus | **oui** | |
| 8.2 | Changement d'onglet refusé pendant le flash | **oui** | flash 12:21, resté sur l'onglet ESC |
| 8.3 | Moteur arrêté en quittant l'onglet | **NON puis oui** | **1er essai (onglet v12) : les moteurs sont restés en marche** (défaut de sécurité). Corrigé (commit 01933a2, onglet v13 sur /test/) ; **2e essai : moteur arrêté** |
| 8.4 | Reconnexion de TrueGlide Configurator | **oui** | capture 01/11 : « Déconnecter » affiché, carte reconnue |
| 9.1 | Journal de débogage enregistré | **oui** | esc-configurator-log.txt |
| 9.2 | État final | **oui** | Bluejay 0.19.2, J-H-40, 24 kHz, sens Reversed, bip 40 (réécrit 12:24:25) |

## Défauts trouvés pendant l'essai

1. **Sécurité (corrigé)** : en quittant l'onglet ESC moteur en marche, les moteurs continuaient de tourner (8.3,
   1er essai). Corrigé sur /test/ pendant l'essai, puis sur /app/ (gh-pages 868e306).
2. Les deux cases du test moteurs étaient mal alignées (corrigé, sur /test/).
3. Libellés « PWM Frequency » et « Migration » en anglais (corrigé dans le code, pas en ligne).
4. Après un refus de flash, le journal disait « ESC n flashé - 0.1 s » (corrigé dans le code, pas en ligne).
5. Saisie au clavier : « 1024,914509037616 » au lieu de 1025 (affichage seulement, à corriger).
6. Messages techniques après la fermeture de la prise (« cmd_InterfaceExit failed… », « MSP command failed ») : sans
   effet, à nettoyer.
7. 31/10 21:42 : une écriture sur l'ESC 1 a échoué (batterie sans doute débranchée), refaite avec succès à 21:42:45.
