# Fiche d'essai au banc TGE-V28 : réglages communs et sens des moteurs

## Règle de décision (écrite avant l'essai)
- **OUI** si les étapes 6, 9, 10, 13 et 16 sont conformes, et que tous les ESC sont lus à chaque lecture.
- **NON** si une seule de ces étapes n'est pas conforme. On s'arrête alors, on fait la remise en état (étapes 14 à 16), puis on envoie le journal à Développement et à l'auditeur. Ni /app/, ni PR chez Chris.
- **Essai non valable** si un ESC n'est pas lu : relire, et ne jamais écrire tant qu'un ESC manque.
- **Le Mini Pouce ne revole pas** tant que les étapes 15 et 16 ne sont pas conformes à l'état de départ.

**Version testée :** onglet ESC v28, sur /test/. Le pied de page doit afficher « 0.33.0-dev · fe53a6f ». La fiche ne vaut qu'une fois /test/ publié et contrôlé par l'auditeur.

**Drone :** Mini Pouce, sans hélices, posé à plat sur le banc, batterie branchée. Garder les mains loin des moteurs pendant les tests moteurs.

**Ce qu'on vérifie :** changer un réglage commun ne recopie plus les réglages propres à chaque ESC, comme le sens, depuis l'ESC 1.

**Limite connue de la v28 :** la fréquence (PWM) fait partie des réglages communs. Quand on écrit, tous les ESC prennent donc la fréquence de l'ESC 1, comme les autres réglages communs. Cet essai ne la teste pas.

## A. Préparation
1. Ouvrir l'onglet ESC v28 sur /test/ et vérifier le pied de page (`fe53a6f`).
2. Se connecter, puis cliquer sur « Lire les paramètres ». **Si un ESC manque, relire avant toute écriture.** Faire ensuite une capture d'écran de tous les réglages (communs et de chaque ESC) : c'est l'**état de départ**.
3. Coller un petit bout de ruban adhésif sur chaque cloche de moteur. Faire tourner chaque moteur dans le « Contrôle des moteurs » de l'onglet ESC (sans changer d'onglet) : cocher « J'ai retiré toutes les hélices » et « Activer le contrôle des moteurs », puis utiliser le curseur « Moteur N » un moteur à la fois. Pour chaque moteur, noter le sens vu du dessus (horaire ou anti-horaire) et la **Direction des moteurs** affichée dans l'onglet ESC. Comparer avec le schéma Betaflight. ⚠ Comme l'écrit l'écran : débrancher la batterie avant de fermer la page ou de quitter l'onglet.

| Moteur / ESC | Direction affichée au départ | Sens vu du dessus au départ |
|---|---|---|
| 1 | | |
| 2 | | |
| 3 | | |
| 4 | | |

## B. Mettre des sens différents
4. Dans les panneaux individuels, passer les ESC **2 et 4** dans l'autre sens que celui de départ. Ne pas toucher aux ESC 1 et 3.
5. Cliquer sur « Écrire les paramètres ».
   - **Attendu :** une question sur le changement de sens, qui cite les **ESC 2 et 4**. Répondre OK.
6. Cliquer sur « Lire les paramètres » (tous les ESC doivent être lus).
   - **Attendu :** ESC 2 et 4 dans le nouveau sens, ESC 1 et 3 inchangés.

## C. Le parcours du défaut : « Restaurer les paramètres par défaut »
7. Changer la **Puissance du bip** (réglage commun), **sans écrire**.
8. Cliquer sur « Restaurer les paramètres par défaut », puis accepter la confirmation.
   - **Attendu :** un fichier de sauvegarde est proposé, puis l'écriture se fait. **Noter le nom du fichier de sauvegarde téléchargé.**
9. Cliquer sur « Lire les paramètres » (tous les ESC doivent être lus).
   - **Attendu :** **chaque ESC garde le sens de l'étape 6.** En v27, les 4 ESC prenaient le sens de l'ESC 1.
10. Faire tourner les moteurs dans le « Contrôle des moteurs » de l'onglet ESC (sans changer d'onglet) : cocher « J'ai retiré toutes les hélices » et « Activer le contrôle des moteurs », puis utiliser le curseur « Moteur N » un moteur à la fois, en regardant le ruban adhésif.
    - **Attendu :** les moteurs 2 et 4 tournent dans le sens **inverse** de celui noté à l'étape 3, et les moteurs 1 et 3 dans le **même** sens.

## D. La question sur le sens après un réglage commun
11. Dans le panneau de l'ESC 2, remettre son sens **de départ**, sans écrire.
12. **Ensuite seulement**, changer la Puissance du bip, sans écrire.
13. Cliquer sur « Écrire les paramètres ».
    - **Attendu :** une question sur le changement de sens, qui cite **seulement l'ESC 2**. Répondre **Annuler**.
    - **Attendu :** rien n'est écrit. Cliquer sur « Lire les paramètres » : l'ESC 2 a toujours le sens de l'étape 6.

## E. Remise en état
14. Cliquer sur « Recharger des réglages sauvegardés » et choisir le fichier noté à l'étape 8. ⚠ Le rechargement écrit tout de suite dans les ESC, sans poser de question sur le sens (défaut connu, relevé par la relecture du 18/11). Cliquer ensuite sur « Lire les paramètres ». Puis remettre la Puissance du bip de la capture de l'étape 2, et la Direction des moteurs de l'étape 3, ESC par ESC.
15. Cliquer sur « Écrire les paramètres » (confirmer la question sur le sens), puis sur « Lire les paramètres ». Tous les ESC doivent être lus. Comparer chaque réglage à la capture de l'étape 2 : **tout doit être identique**. Sinon, corriger, puis réécrire et relire. Faire une capture d'écran.

## F. Preuve du retour à l'état de départ
16. Faire tourner les moteurs dans le « Contrôle des moteurs » de l'onglet ESC (sans changer d'onglet) : cocher « J'ai retiré toutes les hélices » et « Activer le contrôle des moteurs », puis utiliser le curseur « Moteur N » un moteur à la fois, en regardant le ruban adhésif.
    - **Attendu :** chaque moteur tourne dans **le même sens qu'à l'étape 3**, conforme au schéma Betaflight. Le Mini Pouce revolera : ce sens doit être vu, pas seulement relu à l'écran.

## À envoyer après l'essai
- le journal complet, qui reste **privé**, entre toi et les discussions. Ne jamais publier la ligne « Unique device ID » ;
- les captures d'écran des étapes 2, 9, 13 et 15 ;
- le tableau de l'étape 3 rempli, et pour les étapes 6, 9, 10, 13 et 16 : OK, ou ce qui s'est passé.
