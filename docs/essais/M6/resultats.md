# Essai M6 du 10/11/2026 : flash coupé puis réparé

Logiciel : onglet ESC de TrueGlide Configurator, 0.33.0-dev · ebaaf7f.
Matériel : SpeedyBee F405 Mini neuve, ESC J-H-40 4 en 1 (Bluejay 0.19, 48 kHz), sortie 4 grillée côté puissance, sans moteur, batterie à travers un smoke stopper.

| Étape | Résultat |
|---|---|
| Lecture des 4 ESC | OK |
| Flash ESC 4 (Bluejay J-H-40 0.19.2 24 kHz, SHA-256 vérifié), batterie débranchée en cours de flash | Sauvegarde des réglages faite avant le flash. Le flash s'arrête à l'étape 3 (11:27:53, cmd_DeviceRead sans réponse) |
| Retour du logiciel après la coupure | **DÉFAUT** : le logiciel reste bloqué sur « Flashage de l'ESC 4 » (boutons grisés) jusqu'au débranchement de l'USB (11:30:23) |
| Relecture après la coupure | ESC 4 lu « **FLASH*FAILED** » : le chargeur de démarrage est intact, la marque de sécurité est en place |
| Reflash de l'ESC 4 | OK en 10,9 s |
| Relecture | ESC 4 : J-H-40 - Bluejay, 0.19, 48kHz. Sens « Normal » (réglages d'usine : ceux d'un ESC FLASH*FAILED ne sont pas repris) |
| Rechargement de la sauvegarde de 11:27:37 | ESC 4 revenu en « Reversed », ESC 1 à 3 inchangés |

Conclusion : un ESC dont le flash est coupé se répare avec le logiciel. Le blocage est corrigé dans la branche trueglide/flash-coupe : un essai de vérification qui échoue fait maintenant abandonner le flash, avec le message habituel, au lieu d'attendre sans fin.

Journal : esc-configurator-log.txt (identifiant de la carte masqué).
