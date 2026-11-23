# Contrôle de la fiche d'essai TGE-T8 v1 (premier flash TGlide_8 0.1) — 22/11/2026

## Verdict : CORRECTIONS
1. Étape 7 : titre attendu réel, calculé avec la logique de `buildDisplayName` (v34) [EXÉCUTÉ] : « J-H-40 - Bluejay, 0.21.0 TG8 .1, 24kHz » (Bluejay officiel 0.21.0 : « J-H-40 - Bluejay, 0.21.0, 24kHz »). Retirer la mention d'une v35 inexistante.
2. Étapes 2/12/13 : le KarRmen est en Bluejay 0.19 ; le rechargement d'un fichier de réglages exige la même version (`getRestoredSettings`). Noter la version de départ, flasher avec « Migrer les paramètres », ne recharger le fichier A que sur la même version ; remise en état avec le Bluejay officiel de la version lue.
3. Étape 5 : libellés réels (« Installer le micrologiciel sur cet ESC », « Installer un microprogramme depuis le disque dur ») et confirmation « firmware non validé » attendue.
4. Recommandé : curseur au plus à 1100 µs ; batterie débranchée avant toute manipulation.
5. Recommandé : cible et fréquence lues sur chaque ESC avant de choisir le fichier.

## Résultat TGE-T8 (23/11, /test/ v35 1ad4b5d) et fiche TGE-T8b
- TGE-T8 : NON à l'étape 2.4, sans défaut de TGlide_8. Cause vérifiée dans le code : migration Bluejay vers la révision 208 (`getSkipSettings`, l.167-173) qui reprend les valeurs par défaut de 0.21 pour la protection de température, la puissance de démarrage min/max et le lissage PWM (`DEFAULTS['208']`). L'audit avait validé la fiche avec l'attente erronée « réglages identiques ». Remise en état faite et conforme (0.19.2 48 kHz + fichier A, « relu, identique »).
- TGE-T8b v1 : conforme après 2 corrections : lissage PWM absent en 0.21 (sinon faux NON en 2.4) ; avant tout vol, remettre la protection de surchauffe et régler Boost/Protection (0.21 désactive la surchauffe par défaut).
- Mineur à suivre : affichage « ??? » de la Surchauffe quand les versions des ESC sont mélangées.
