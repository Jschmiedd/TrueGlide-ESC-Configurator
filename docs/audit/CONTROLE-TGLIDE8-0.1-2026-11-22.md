# Contrôle de TGlide_8 0.1 — 22/11/2026

Reçu de la session TGlide_8 : Bluejay v0.21.0 officiel dont seul le nom (16 octets à 0x1A60) est remplacé.

## Vérifié par l'audit [EXÉCUTÉ]
- Fichiers officiels `J_H_40_{24,48,96}_v0.21.0.hex` téléchargés chez bird-sanctuary/bluejay : SHA-256 identiques aux valeurs annoncées.
- Remplacement de l'unique enregistrement `:101A6000…5B` par `:101A6000…66` (somme de contrôle valide, « TGlide_8 (0.1)  ») : SHA-256 obtenus identiques à ceux annoncés (f737df90…, 183129c2…, 0f5a77ef…).

## Verdict : CORRECTIONS — 1 BLOQUANT
1. **BLOQUANT — nom** : le configurateur ne lit un ESC SiLabs comme Bluejay que si le nom correspond à `/Bluejay( \(.*\))?/` (`src/utils/FourWay.js:527`, `src/sources/Bluejay/index.js:89-99`). « TGlide_8 (0.1) » serait lu comme BLHeli_S (mauvaise disposition, 0x70 au lieu de 0xFF octets), révision 208 non prise en charge, écriture non bloquée. Même problème dans le configurateur d'origine. Correction : garder « Bluejay » dans le nom (ex. « Bluejay (TG8 .1) »), avec un test.
2. GPL : acceptable si la source correspondante (Bluejay v0.21.0 + outil de patch + instructions) accompagne chaque binaire ; licences des fichiers `.inc` SiLabs et du chargeur à vérifier avant distribution.
3. Dire clairement que 0.1 = Bluejay 0.21.0 renommé, sans changement de code.
4. Information : les journaux TGE-P1 et TGE-P4 confirment « J-H-40 - Bluejay, 0.19, 24kHz » sur les ESC BLS 35A du KarRmen.
