# Essai M6 du 10/11/2026 : flash coupé puis réparé

Logiciel : onglet ESC de TrueGlide Configurator, 0.33.0-dev · ebaaf7f.
Matériel : SpeedyBee F405 Mini neuve, ESC J-H-40 4 en 1 (Bluejay 0.19, 48 kHz), sortie 4 grillée côté puissance, sans moteur, batterie à travers un smoke stopper.

| Étape | Résultat |
|---|---|
| Lecture des 4 ESC | OK |
| Flash ESC 4 avec le fichier J_H_40_24_v0.19.2.hex (Bluejay 0.19.2, 24 kHz, SHA-256 vérifié), batterie débranchée en cours de flash | Sauvegarde des réglages faite avant le flash. Le flash s'arrête à l'étape 3 (11:27:53, cmd_DeviceRead sans réponse) |
| Retour du logiciel après la coupure | **DÉFAUT** : le logiciel reste bloqué sur « Flashage de l'ESC 4 » (boutons grisés) jusqu'au débranchement de l'USB (11:30:23) |
| Relecture après la coupure | ESC 4 lu « **FLASH*FAILED** » : le chargeur de démarrage est intact, la marque de sécurité est en place |
| Reflash de l'ESC 4 | OK en 10,9 s |
| Relecture | ESC 4 : J-H-40 - Bluejay, 0.19, 48kHz. Sens « Normal » (réglages d'usine : ceux d'un ESC FLASH*FAILED ne sont pas repris) |
| Rechargement de la sauvegarde de 11:27:37 | ESC 4 revenu en « Reversed », ESC 1 à 3 inchangés |

Conclusion : un ESC dont le flash est coupé se répare avec le logiciel. Le blocage est corrigé dans la branche trueglide/flash-coupe : un essai de vérification qui échoue fait maintenant abandonner le flash, avec le message habituel, au lieu d'attendre sans fin.

## Fréquence PWM : 24 kHz flashé, 48 kHz affiché

Les 4 ESC étaient lus « 48kHz » avant l'essai, et l'ESC 4 a été flashé avec le fichier **24 kHz** (celui de la fiche, le seul validé par TrueGlide). C'est une erreur de mode opératoire : la fiche aurait dû demander la même fréquence que celle lue. Ici sans conséquence, la sortie 4 est hors service.

Après le flash, l'ESC 4 est pourtant relu « 48kHz ». La raison :
- Dans Bluejay 0.19.2, la fréquence est fixée à la compilation : un fichier par fréquence. L'octet 0x0A de l'EEPROM n'est qu'un affichage (source Bluejay.asm v0.19.2 : `Eep_Pgm_Pwm_Freq: DB (24 SHL PWM_FREQ) ; Temporary method for display`). Le fichier 24 kHz l'initialise à 24 (vérifié dans le fichier .hex).
- Après le flash, le logiciel écrit les réglages (« Mise à jour de l'ESC 4 », 11:36:30). Il recopie alors tous les réglages du premier ESC, dont cet octet d'affichage (48).
- L'ESC 4 tourne donc en 24 kHz mais s'affiche « 48kHz ». C'est un défaut d'affichage, hérité du logiciel d'origine. Il est à corriger dans une modification séparée : ne jamais recopier cet octet d'un ESC à l'autre.

## Journal

esc-configurator-log.txt, identifiant de la carte masqué. Il réunit les 2 fichiers envoyés par Johann :
- de 11:24:49 à 11:30:50 : connexion, lecture, flash coupé, blocage, débranchement de l'USB ;
- de 11:32:17 à 11:40:38 : relectures, reflash, rechargement de la sauvegarde.

Rien n'a été enregistré entre 11:30:50 et 11:32:17. La ligne « MSP command failed: Timed out after 1000ms » de 11:32:55 suit une déconnexion faite alors que la carte était encore en passthrough. Elle est analysée à part.
