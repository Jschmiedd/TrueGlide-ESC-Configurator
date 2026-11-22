# Contrôle de la fiche d'essai TGE-T8 v1 (premier flash TGlide_8 0.1) — 22/11/2026

## Verdict : CORRECTIONS
1. Étape 7 : titre attendu réel, calculé avec la logique de `buildDisplayName` (v34) [EXÉCUTÉ] : « J-H-40 - Bluejay, 0.21.0 TG8 .1, 24kHz » (Bluejay officiel 0.21.0 : « J-H-40 - Bluejay, 0.21.0, 24kHz »). Retirer la mention d'une v35 inexistante.
2. Étapes 2/12/13 : le KarRmen est en Bluejay 0.19 ; le rechargement d'un fichier de réglages exige la même version (`getRestoredSettings`). Noter la version de départ, flasher avec « Migrer les paramètres », ne recharger le fichier A que sur la même version ; remise en état avec le Bluejay officiel de la version lue.
3. Étape 5 : libellés réels (« Installer le micrologiciel sur cet ESC », « Installer un microprogramme depuis le disque dur ») et confirmation « firmware non validé » attendue.
4. Recommandé : curseur au plus à 1100 µs ; batterie débranchée avant toute manipulation.
5. Recommandé : cible et fréquence lues sur chaque ESC avant de choisir le fichier.
