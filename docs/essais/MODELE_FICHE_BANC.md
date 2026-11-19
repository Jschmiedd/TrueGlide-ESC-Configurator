# Modèle de fiche d'essai au banc (onglet ESC)

Modèle tiré de l'essai TGE-V28 du 19/11 (voir `TGE-V28_fiche.md`), validé par l'auditeur.

## Ordre de la fiche
1. **Règle de décision, écrite avant l'essai** : OUI / NON / essai non valable, avec les numéros des étapes qui comptent.
2. **En-tête** : version testée (pied de page « 0.33.0-dev · commit »), drone, carte et firmware de vol, firmware des ESC, ce qu'on vérifie, limites connues.
3. **A. Préparation** : lecture, capture de l'état de départ (réglages communs + chaque ESC), sens des moteurs vus du dessus.
4. **B, C, D… Le parcours à prouver**, une action par étape, avec un « Attendu » précis.
5. **Remise en état complète** : recharger la sauvegarde, remettre à la main ce qui diffère, écrire, relire, comparer à la capture de départ.
6. **Preuve du retour à l'état de départ** au test moteurs : le drone ne revole pas avant.
7. **À envoyer** : journal complet (privé), captures des étapes clés, tableau rempli.

## Règles pratiques apprises au banc
- **Batterie branchée avant toute lecture** : sans elle, « Échec de la lecture de l'ESC 1 à 4 ». Relire, ne jamais écrire avec un ESC manquant.
- **Après chaque reconnexion, cliquer sur « Lire les paramètres »** avant de modifier quoi que ce soit : l'écran peut montrer une lecture plus ancienne.
- **Ne jamais cliquer sur « Lire » entre une modification et « Écrire »** : la lecture efface les modifications.
- **Test moteurs dans l'onglet ESC** : « Déconnecter » puis « Connecter », sans « Lire » ; cocher « J'ai retiré toutes les hélices » et « Activer le contrôle des moteurs » ; un moteur à la fois, 1050-1100 ; ne pas changer d'onglet. Un ruban adhésif sur chaque cloche ; noter le sens vu du dessus (ou in/out).
- **Décocher les cases du contrôle des moteurs** avant de relire.
- **VTX** : pauses batterie débranchée, USB branché ; rebrancher, attendre les bips, relire.
- **Batterie vue en 1S** après un rebranchement avec l'USB branché : comptage du contrôleur de vol, sans effet ; revient à 4S après débranchement complet.
- **Le rechargement d'une sauvegarde écrit tout de suite**, sans question sur le sens.
- **Masquer le journal** avant les captures et ne jamais publier la ligne « ID unique du périphérique ».
- **Questions du navigateur** (changement de sens) : capture avant de répondre, et vérifier les numéros d'ESC cités.
- Une modification de matériel (autre drone, autre carte) repasse par l'auditeur avant la première écriture.
