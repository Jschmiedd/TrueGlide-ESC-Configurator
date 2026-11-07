# Analyse des preuves de l'essai TGE-P4 (07/11/2026)

Preuves lues : branche `trueglide/preuves-p4` (`cf5da09`), dossier `docs/essais/TGE-P4/` (résultats, journal de 615 lignes avec identifiant de carte masqué, deux sauvegardes de réglages). Version essayée : `29100f6` (onglet v16 dans TrueGlide Configurator `/test/`).

## Points confirmés par le journal

| Point | Verdict | Preuve |
|---|---|---|
| Lecture des 4 ESC | **RÉUSSI** | 19:51:11-13 |
| Firmware pris sur la copie TrueGlide, empreinte vérifiée | **RÉUSSI** | 19:52:44 « Firmware taken from the TrueGlide copy », « SHA-256 checked » |
| Sauvegarde automatique avant flash | **RÉUSSI** | 19:52:44 et 20:06:42, fichiers joints |
| Flash des 4 ESC, 5 étapes de protection, sens moteur repris | **RÉUSSI** | 19:52:44 → 19:53:31, 4 × 10,9 s, « Migrated setting MOTOR_DIRECTION » ×4 ; sauvegardes : MOTOR_DIRECTION = 2 sur les 4 ESC |
| Avertissement « version non validée » (J-H-25) | **RÉUSSI** | 20:06:42 |
| Refus du mauvais layout | **ÉCHEC partiel** (défaut 2) | 20:06:42 : refus de l'ESC 1 seulement ; ESC 2-4 non traités (rien écrit) |
| Rechargement d'une sauvegarde | **RÉUSSI** | 20:11:04-06, 20:14:46 (« aucun changement »), 20:15:17-18 |
| Note « version validée » | preuve insuffisante | capture citée, non jointe |
| Arrêt des moteurs en quittant l'onglet | preuve insuffisante | déclaratif (le journal ne trace pas le test moteurs) ; à refaire avec vidéo dans Q2 |

Les deux sauvegardes ne diffèrent **que** par `STARTUP_MELODY_WAIT_MS` (0 à 19:52:44, 65535 à 20:06:42) : cela confirme le défaut 1.

## Point à corriger dans `resultats.md`

La remarque « le fichier de 20:06:42 a probablement été choisi [à 20:15:17] ; corrigé ensuite avec le fichier de 19:52:44 » ne correspond pas au journal :

- avant 20:11, les ESC valent 65535 (sauvegarde de 20:06:42) ;
- 20:11:04 : écriture → le fichier chargé contenait 0, donc celui de 19:52:44 ;
- 20:14:46 : « aucun changement » → même fichier (19:52:44) ;
- 20:15:17 : écriture → l'autre fichier, celui de **20:06:42 (65535)** ;
- **aucun rechargement après 20:15:18** dans le journal.

Les ESC ont donc très probablement fini avec **65535** (environ 65 s d'attente après la mélodie). C'est important pour la suite : avec la correction 26a57e3, un flash avec « Migrer les paramètres » **reprend** la valeur actuelle de l'ESC. Si les ESC sont encore à 65535, le prochain essai reproduira le silence de 65 s alors que la correction fonctionne.

## Avant de refaire l'essai sur 26a57e3

1. Lire les ESC, ouvrir la carte d'un ESC : noter l'attente après la mélodie (ou recharger directement la sauvegarde de **19:52:44**).
2. Si elle vaut 65535 : « Recharger des réglages sauvegardés » → fichier `trueglide-esc-reglages_2026-11-07_19-52-44.json`, relire.
3. Puis flash Bluejay 0.19.2 J-H-40 avec « Migrer les paramètres » : la nouvelle sauvegarde et la relecture doivent montrer 0, et le journal doit contenir « Migrated setting STARTUP_MELODY_WAIT_MS ».
4. Mauvais layout (J-H-25) : « non flashé : rien n'a été écrit » pour les **4** ESC.
