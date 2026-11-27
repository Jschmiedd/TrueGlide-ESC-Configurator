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

## Suite (27/11) : remarques traitées, chargeurs vérifiés par l'audit

Session TGlide (NON VÉRIFIÉ ici, hors dépôt) : L431 retiré de l'écriture (25 fichiers épinglés) ; « Success! » cherché dans les deux sorties, testé ; écriture **verrouillée** (`WRITING_ALLOWED = False`), 45 tests.

Vérification de l'audit sur le site officiel AM32 [EXÉCUTÉ] : la page de téléchargement `am32.ca/downloads` (liste `am32.ca/api/files`) publie les chargeurs v17, v18.0.0 et v19.0.0. Les 60 fichiers V17 non-CAN téléchargés depuis `am32.ca/api/file/bootloaders/v17/…hex`, convertis en binaire (trous remplis à 0x00), sont **identiques octet pour octet** aux 60 fichiers `.bin` d'AM32-unlocker `359ef46`. Les seules différences avant remplissage étaient les trous du fichier hex (0x00 dans le `.bin`).

Conclusion : les chargeurs V17 épinglés **sont** ceux publiés en téléchargement officiel. L'avertissement « development versions » de l'outil d'origine ne s'applique pas à ces fichiers. Des versions plus récentes (v18, v19) existent ; garder V17 est acceptable, car c'est le chargeur fourni par l'outil et publié par AM32.

**Verdict** : l'état actuel (écriture verrouillée) est conforme. L'écriture pourra être déverrouillée **après** l'essai en lecture seule réussi sur le SEQURE E70 G2 et un nouveau contrôle de l'audit, puis essayée sur un ESC AM32 sacrifiable.
