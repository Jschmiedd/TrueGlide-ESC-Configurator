# Contrôle de l'outil « chargeur », étape 2 : écriture gardée (27/11/2026)

Contrôlé : la description d'`esc_write.py` et des ajouts à `esc_inspect.py` envoyée par la session TGlide (fichiers hors dépôt ; empreintes et 38 tests NON VÉRIFIÉS ici). Références lues ici [EXÉCUTÉ] : AM32-unlocker `359ef46` (cloné) et le code source d'OpenOCD (`stm32l4x.c`, `stm32f1x.c`).

## Les trois points demandés

**(a) Suffixes de taille.**
- G071 : le fichier `_64K` correspond au choix « G071_64K » de `MCU_LIST`, et le nom sans suffixe au choix « G071 ». OpenOCD donne 128 Ko au plus pour les G07x. Règle 64 Ko → `_64K`, 128 Ko → sans suffixe : **cohérente**.
- L431 : les fichiers `_128K` existent, mais `MCU_LIST` ne propose pas « L431_128K » : l'outil d'origine ne s'en sert **jamais**. Rien ne prouve quel fichier convient à une L431 de 128 Ko. **Retirer L431** de l'outil pour l'instant.

**(b) Registre de taille mémoire.** 0x1FFFF7CC (F0) et 0x1FFF75E0 (G0, G4, L4) : **justes**, identiques à OpenOCD. Lisible en niveau 1 : NON VÉRIFIÉ. Si la lecture échoue, l'outil refuse (G071) : c'est sans danger.

**(c) Critère de succès.** Dans les 5 scripts, `echo "Success!"` vient après `flash verify_bank` ; si une commande échoue, OpenOCD s'arrête avant, avec un code d'erreur. « Code 0 et Success! » est donc **juste**, et plus strict que l'outil d'origine (code 0 seul). **Attention** : OpenOCD écrit ses `echo` sur la **sortie d'erreur**. Il faut chercher « Success! » dans les deux sorties, et le tester.

## Problème trouvé

L'outil d'origine affiche : « The included bootloaders are the latest **development** versions. For the stable bootloaders please download from am32.ca/downloads » (`esc_unlocker.py` l.410-413). Les 35 fichiers V17 épinglés sont donc des **versions de développement**. **À corriger avant tout essai** : épingler les chargeurs **stables** publiés par AM32, avec leur empreinte et leur source, ou justifier par écrit le choix de V17.

## Le reste

- Séquence (inspection, nom calculé d'après la mesure, fichier épinglé, deux confirmations tapées, une seule exécution, relecture) : **bonne**.
- Plus de relance en boucle : **bien**.
- Question « ESC AM32 ? » déclarative : à dire tel quel à Johann, comme prévu.

## Verdict

**PAS ENCORE prêt pour un essai d'écriture.** À faire : chargeurs stables, L431 retiré, recherche de « Success! » dans les deux sorties. L'essai en lecture seule (`esc_inspect`) reste autorisé.
