# Contrôle de la procédure « écrire le chargeur AM32 sur un ESC » (26/11/2026)

Contrôlé : la description du brouillon `PROCEDURE_CHARGEUR.md` envoyée par la session TGlide (le document lui-même n'est dans aucun dépôt). Source : AM32-unlocker `359ef46` (v1.0.8, GPL-3). Rien n'a été exécuté, ni ici ni par la session.

## Vérifié par l'audit

- `MCU/F421/openocd-lock.cfg` ligne 2 charge bien `target/at32f415xx.cfg` (fichier lu ici à `359ef46`) [EXÉCUTÉ]. Le défaut signalé est réel. Il peut être sans effet (puces proches), mais ce n'est pas prouvé.

## Réponses

**(a) Lire le code d'AM32-unlocker : oui, bien fait.** C'est un outil public sous GPL-3 du projet AM32, pas du code BLHeli_32, et Johann l'a autorisé par écrit. Ce qui attend l'avis juridique, c'est **l'utilisation** de l'outil sur un ESC BLHeli_32 (retrait de sa protection), pas la lecture du code.

**(b) Procédure : bonne base, mais pas encore complète.** À ajouter :
1. **Alimentation** : une alimentation de labo limitée en courant (par exemple 12 V, 0,3 A) vaut mieux qu'un Smoke Stopper seul. Ne jamais alimenter la carte par la sonde en plus de la batterie ; la broche 3,3 V de la sonde reste débranchée ou sert seulement de référence.
2. **F421 interdit** tant que le défaut du fichier n'est pas levé (preuve que la cible F415 convient, ou correction).
3. **Arrêt d'urgence écrit** : l'outil relance sans fin. Écrire : Ctrl+C, puis débrancher l'alimentation, puis la sonde.
4. **Contrôleur de vol et récepteur débranchés** de l'ESC (fils signal compris).
5. **Électricité statique** : bracelet antistatique relié à la masse.
6. **ESC 4 en 1** : 4 puces, chacune traitée et notée à part.
7. **Avant de commencer** : photo de la puce et du marquage, gardée dans le journal ; écrire que le firmware d'origine est **perdu pour toujours** (pas de sauvegarde possible).
8. **Après** : refaire la lecture des octets d'option (niveau de protection 0 attendu) et le noter.

**(c) Améliorations de l'outil.** Un dérivé GPL-3 est permis par la licence, à condition de publier le code source si l'outil est diffusé. Les améliorations de sécurité (identification de la puce, refus si elle est différente, essai à blanc, délai maximal, journal) servent aussi à réparer un ESC **AM32** abîmé, ce qui ne pose pas de question juridique. **Avis** : elles peuvent être écrites maintenant. Leur emploi sur un ESC BLHeli_32 reste interdit jusqu'à l'avis juridique, et cela doit être écrit en tête de l'outil comme du document. Elles devront être contrôlées par l'audit avant tout essai.

## Verdict

**Brouillon recevable, PAS PRÊT pour un essai** : il faut d'abord les 8 ajouts. Premier essai sur un ESC AM32 sacrifiable (pas BLHeli_32).
