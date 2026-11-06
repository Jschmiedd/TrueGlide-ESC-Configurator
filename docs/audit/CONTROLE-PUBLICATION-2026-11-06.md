# Contrôle avant publication publique — TrueGlide ESC Configurator

Date du contrôle : 6 novembre 2026
Versions contrôlées :

- **v14** = branche `master`, commit `ab3a994` (en ligne sur `/app/` et `/onglet/v14/`)
- **v15** = branche `trueglide/test-am32`, commit `2282c46` (en ligne sur `/test/` et `/onglet/v15/`)
- site de présentation et documentation (branche `gh-pages` : racine, `/doc/`, `/site-test/`)

Ce rapport constate, prouve et recommande. Il ne modifie pas le code. La décision de publier reste celle de Johann, par écrit.

Légende des preuves utilisées dans tout le rapport :

- **[EXÉCUTÉ]** : vérifié en faisant tourner le logiciel ou ses tests ici ;
- **[CODE]** : vérifié en lisant le code ;
- **[MATÉRIEL]** : ne peut être vérifié qu'au banc, par Johann ;
- **NON VÉRIFIÉ** : rien ne permet de conclure ici ; ce qu'il faudrait est indiqué.

---

## 0. Ce que j'ai reçu, ce qui manque

### Reçu

| Élément | État |
|---|---|
| Code source (dépôt public, branches `master`, `trueglide/test-am32`, `gh-pages`) | lu |
| Licence AGPL v3 (`LICENSE`), fichier des marques (`MARQUES.md`) | lus |
| Versions en ligne (`/app/`, `/test/`, `/onglet/v1` à `v15`, `/onglet/essai/`) | lues dans la branche `gh-pages` (fichiers publiés), pas ouvertes dans un navigateur |
| Site et documentation (`/`, `/doc/`, `/site-test/`) | lus |
| Compte rendu de l'essai TGE-P1 (31/10 et 01/11) | reçu sous forme de résumé |
| Liste de ce qui n'a jamais été essayé, matériel disponible, décisions déjà prises | reçus |

### Manquant

| Élément | Conséquence |
|---|---|
| Fiche TGE-P1 détaillée (étapes, captures, journaux enregistrés) | je ne peux citer que le résumé ; les résultats « validés » sont repris tels quels, **sans preuve jointe** |
| Avis juridique BLHeli_32 | la règle « ni lecture ni écriture BLHeli_32 » reste la seule protection ; voir constat B1 |
| Dossier de publication formel (périmètre, liste des ESC validés, notes de version) | à créer ; la section 4 et la checklist (section 6) peuvent servir de base |
| Politique de confidentialité, mentions légales | absentes (constat M5) |
| Dépendance `web-serial-polyfill` (dépôt GitHub de stylesuxx) | téléchargement bloqué ici (codeload : refus 403) ; voir ci-dessous |
| Exécutable signé | sans objet : c'est une page web, rien ne s'installe (voir point 7) |

### Ce qui a été exécuté ici

| Action | Résultat | Remarque |
|---|---|---|
| Installation des dépendances (`yarn install --frozen-lockfile`) | **échec** : `web-serial-polyfill` refusé (403) par codeload.github.com | conforme à la consigne : non contourné dans le dépôt |
| Tests automatiques v14 | **444 / 444 réussis**, 43 fichiers | [EXÉCUTÉ] dans une copie de travail séparée, où la seule dépendance `web-serial-polyfill` est remplacée par un bouchon vide. Elle ne sert qu'à la liaison USB sur Android ; aucun test ne s'en sert. **Le résultat officiel avec la vraie dépendance reste NON VÉRIFIÉ ici** : à confirmer par la vérification GitHub (Actions) ou sur le PC de Johann. |
| Tests automatiques v15 | **445 / 445 réussis** | même réserve |
| Lint (`eslint`) v14 et v15 | **0 erreur**, 29 avertissements de style | [EXÉCUTÉ] |
| Compilation (`react-scripts build`) v14 | réussie (avertissements de style) | [EXÉCUTÉ], même réserve sur la dépendance |
| Couverture des tests v14 | 78,9 % au total, mais **`utils/FourWay.js` (flash et lecture des ESC) : 44,7 %** ; `Containers/App` : 36 % | [EXÉCUTÉ] |
| Audit des dépendances (`yarn audit`) | 602 alertes (35 critiques, 349 hautes), presque toutes dans l'outil de compilation `react-scripts`, pas dans ce qui tourne chez l'utilisateur | [EXÉCUTÉ] |
| 2 essais ciblés écrits pour ce contrôle | voir constats B1 et M2 ; fichier : `docs/audit/essais-controle.test.jsx.txt` | [EXÉCUTÉ] |

Remarque d'installation : le paquet `sleep` (module natif, inutile pour une page web, jamais utilisé dans `src/`) ne se compile pas avec Node 22. Il faut installer avec `--ignore-scripts` (constat m6).

---

## 1. VERDICT

### **PAS PUBLIABLE** en l'état.

En clair :

1. **Ce qui marche est réel, mais étroit.** Une seule configuration a été essayée en vrai : un drone (KarRmen, SpeedyBee F405 Mini sous TRUEGLIDE) avec 4 ESC BLS 35A en Bluejay 0.19.2. Tout le reste (BLHeli_S, AM32, mode 3D, coupure pendant un flash, ESC inconnu) n'a jamais touché de matériel.
2. **Trois défauts peuvent abîmer ou bloquer un ESC chez un inconnu** (constats B1 à B3) : dans un drone qui mélange un ESC BLHeli_32 et un ESC AM32, le bouton de flash reste actif sur l'ESC BLHeli_32 ; un flash AM32 mal écrit est annoncé comme réussi ; la v15 risque de prendre un ESC BLHeli_32 pour un ESC AM32.
3. **La sécurité moteurs telle qu'elle est en ligne (v14) n'a pas été réessayée** après la dernière modification de l'arrêt des moteurs (constat B4).
4. **Il n'existe aucune procédure de récupération publiée** pour un flash interrompu, et la documentation en ligne contient des informations fausses ou périmées (constats B5 et M6).
5. Côté légal : un script Google peut être chargé sans raison, les firmwares passent par un serveur tiers que TalkTrueFPV ne contrôle pas, et il n'y a pas de politique de confidentialité (constats M3 et M5).

### Ce qui pourrait le rendre publiable en BÊTA

**PUBLIABLE EN BÊTA**, avec ces réserves, si :

- les 5 constats BLOQUANTS sont corrigés et revérifiés ;
- les fiches P2, P4, P5 et P7 sont RÉUSSIES ;
- le périmètre est limité comme en section 4 : **Bluejay et BLHeli_S seulement en « validé »**, AM32 en « expérimental », mode 3D et BLHeli_32 → AM32 hors de la publication.

---

## 2. Constats triés par gravité

Gravité : **BLOQUANT** = risque de démarrage moteur, de destruction ou de blocage d'ESC sans récupération documentée. **MAJEUR** = à corriger avant toute publication publique. **MINEUR** = à corriger, sans empêcher une bêta.

### 2.1 BLOQUANTS

| N° | Problème en langage simple | Risque concret pour l'utilisateur | Emplacement | Correction recommandée |
|---|---|---|---|---|
| **B1** | Le droit de flasher est décidé **sur le premier ESC seulement**. Si l'ESC 1 est AM32 et l'ESC 2 est BLHeli_32 (drone réparé avec un ESC d'une autre marque), les boutons « Flasher » et « Copie du firmware » (mode avancé) restent actifs **sur l'ESC BLHeli_32**, et « Installer sur tous les ESC » l'inclut. **[EXÉCUTÉ]** : avec ESC 1 = AM32 et ESC 2 = BLHeli_32, l'autorisation de flasher vaut « oui ». | Tentative d'écrire AM32 à travers un chargeur BLHeli_32 : ESC BLHeli_32 abîmé, sans retour possible (BLHeli_32 n'est plus distribué). La copie du firmware lirait du code BLHeli_32, ce qui est contraire à la décision « ni lecture ni écriture BLHeli_32 ». | `src/Containers/App/stateSlice.js:70-71` (`selectCanFlash` regarde `master.NAME`) ; `src/utils/helpers/Settings.js:90` (le « maître » est le premier ESC disponible) ; boutons `src/Components/Flash/Escs/Esc/index.jsx:143` et `:153` ; boucle de flash `src/Containers/App/index.jsx` (`flash`, l. 420 et suivantes) | Décider **ESC par ESC** : bouton désactivé pour tout ESC `BLHeli_32` ou `AM32-PIN` ; dans `flash()`, sauter (avec une ligne au journal) tout ESC non pris en charge ; idem pour la copie du firmware. Ajouter un test automatique « ESC mélangés ». |
| **B2** | Flash AM32 : si la relecture après écriture montre une erreur, le logiciel **écrit quand même** « NOT READY », redémarre l'ESC et annonce « ESC n flashé en x s ». Seule une ligne discrète du journal signale l'échec. **[CODE]** | ESC qui démarre un firmware partiellement faux : comportement moteur imprévisible, risque de court-circuit des transistors (ESC ou moteur brûlé). L'utilisateur croit que tout va bien et va voler. | `src/utils/FourWay.js:1173-1185` (`flashArm` : l'erreur de `verifyPages` est attrapée puis ignorée) | En cas d'échec de vérification : **ne pas** écrire « NOT READY », ne pas redémarrer, laisser « FLASH FAIL », journal en rouge « ESC n : flash raté, ne pas utiliser, reflasher », et compter le flash comme raté. Ajouter le test correspondant. |
| **B3** | **v15 seulement.** Pour savoir si un ESC ARM est AM32 ou BLHeli_32, le logiciel regarde un seul octet renvoyé par le chargeur (le « numéro de broche »). La v15 accepte 4 valeurs de plus, dont **0**. Aucune preuve qu'un chargeur BLHeli_32 ne renvoie jamais 0, 0x0F, 0x12 ou 0x26. **[CODE]**, **NON VÉRIFIÉ** sur matériel (Johann n'a pas d'ESC BLHeli_32). | Un ESC BLHeli_32 pris pour un AM32 : ses réglages seraient lus, puis le flash AM32 autorisé (même mécanisme qu'en B1). Même conséquence que B1. | `src/sources/AM32/eeprom.js` (branche `trueglide/test-am32`, l. 7-15) ; test de reconnaissance `src/utils/FourWay.js:458` (v15) | Ne pas publier la v15 hors du site d'essai. Avant de l'accepter : relever l'octet réel sur au moins 2 ESC BLHeli_32 différents (fiche P9) et sur un ESC AM32 de chaque broche. Ajouter un second indice (par ex. la version du chargeur, ou la présence du nom de fichier AM32) avant de traiter un ESC comme AM32. |
| **B4** | L'arrêt des moteurs à la déconnexion a été **modifié après l'essai** (finitions `6d12f98`) : il ne s'envoie plus directement, il passe maintenant par une question à la carte (« le mode 3D est-il actif ? ») et ne part que si le logiciel croit les moteurs lancés. C'est cette version qui est en ligne sur `/app/` et `/onglet/v14/`, et **elle n'a pas été réessayée sur le drone**. **[CODE]**, **[MATÉRIEL]** | Si la question à la carte échoue ou tarde, l'arrêt n'est pas envoyé : moteurs qui continuent de tourner en quittant l'onglet ESC, exactement le défaut trouvé le 01/11. | `src/Containers/App/index.jsx:376-387` (`handleDisconnect`) ; `src/utils/Msp.js:620-628` (`stopAllMotors`) | Refaire la fiche P2 sur v14 avant toute publication. Idéalement, revenir à un arrêt envoyé directement (valeur connue depuis la connexion), sans question préalable à la carte. |
| **B5** | **Aucune procédure de récupération** n'est publiée pour un flash interrompu. La seule phrase existante est inexacte : « reste reconnu comme FLASH*FAILED et peut être reflashé (avec la case de forçage) ». En réalité la case de forçage n'est normalement pas nécessaire, et rien n'est dit pour AM32 (« FLASH FAIL ») ni pour le cas où l'ESC ne répond plus du tout. **[CODE]** + lecture de `doc/flash.html` | Un débutant dont le flash est coupé ne sait pas quoi faire ; il risque de forcer un mauvais layout ou de jeter un ESC récupérable. | `gh-pages` : `doc/flash.html` et `site-test/doc/flash.html`, section « Flash interrompu » | Écrire une page « Récupérer un ESC après un flash raté », **après** les fiches P5 et P6 (pour décrire ce qui se passe vraiment) : BLHeli_S/Bluejay, AM32, ESC qui ne répond plus, quand demander de l'aide. Lien depuis le journal quand un flash échoue. |

### 2.2 MAJEURS

| N° | Problème en langage simple | Risque concret | Emplacement | Correction recommandée |
|---|---|---|---|---|
| **M1** | **Tous les fichiers firmware** (BLHeli_S, Bluejay, AM32) sont téléchargés **à travers un serveur relais tiers** (`cors.bubblesort.me`, celui du projet d'origine), jamais directement, et **sans aucune empreinte de contrôle**. Le fichier est ensuite gardé un an dans le navigateur. **[CODE]** | Si ce serveur est piraté, modifié ou fermé : firmware falsifié flashé chez tous les utilisateurs, ou plus aucun flash en ligne. Il voit aussi l'adresse IP et le firmware choisi par chaque utilisateur. | `src/settings.json:2` ; `src/utils/Fetch.js:14-16` et `:87-98` (`fetchAndCacheHexResponse` passe toujours par le relais) | Héberger soi-même (par ex. sur le site `gh-pages`) les fichiers des versions **validées**, avec une liste d'empreintes SHA-256 vérifiée avant flash ; supprimer le relais tiers ou le limiter à un secours explicite. |
| **M2** | Quand un flash AM32 est **refusé** (mauvais processeur, mauvaise carte), l'interface reste bloquée en « flash en cours » : tous les boutons, y compris « Déconnecter », restent grisés. Seul un rechargement de la page débloque. Même chose pour un ESC Atmel. **[EXÉCUTÉ]** : refus simulé → l'erreur remonte sans être traitée, l'état « flash en cours » reste à « vrai ». | L'utilisateur recharge la page avec la carte encore en mode passthrough ; dans TrueGlide Configurator, l'onglet ESC refuse de libérer le port (« occupé »). Pas dangereux pour le matériel, mais déroutant au pire moment. | `src/Containers/App/index.jsx:727-764` (`handleFlashUrl` : `await this.flash(...)` sans protection, l. 760) ; `flash()` l. 420-461 | Entourer l'appel d'une protection qui remet l'état à « pas en flash » et écrit au journal « ESC n : flash refusé, rien n'a été écrit ». Ajouter le test correspondant. |
| **M3** | Après « Tout accepter » dans la bannière cookies, le logiciel charge le script **Google Tag Manager avec un identifiant vide**. La bannière parle d'une « politique sur les cookies » qui n'existe pas et propose « Statistiques » et « Marketing » alors que rien n'est mesuré. Le site de présentation charge aussi les **polices Google** (adresse IP envoyée à Google sans consentement). **[CODE]** + lecture du site publié | Non-conformité LPD / RGPD (transfert d'adresse IP à Google sans utilité ni information). Si un identifiant est ajouté un jour, chaque modèle d'ESC, chaque flash et chaque carte de vol de l'utilisateur partiraient chez Google. | `src/Components/CookieConsent/cookieSlice.js:13-14` ; appels `TagManager.dataLayer` dans `src/Containers/App/index.jsx` ; `gh-pages/index.html` (lien `fonts.googleapis.com`) | Retirer Google Tag Manager et la bannière, ou au minimum ne rien charger sans identifiant. Héberger les polices sur le site. Rédiger une courte page « Confidentialité » (voir M5). |
| **M4** | Les anciennes versions **`/onglet/v1` à `/onglet/v13`** restent en ligne. `v1` à `v12` n'ont **pas** la correction « arrêt des moteurs avant de fermer la prise USB ». La page de test `/onglet/essai/` (qui charge `v2`) est aussi publique. **[CODE]** (fichiers de `gh-pages`) | Un lien ancien, un favori ou une version mise en cache par TrueGlide Configurator peut faire tourner un ancien onglet : moteurs qui continuent de tourner en quittant l'onglet. | `gh-pages` : `onglet/v1/` … `onglet/v13/`, `onglet/essai/` | Retirer `v1` à `v13` et `essai` de `gh-pages` (ou les remplacer par une page « version retirée »). Ne garder en ligne que les versions soutenues. |
| **M5** | Pas de politique de confidentialité, pas de mentions légales (éditeur, adresse de contact en dehors d'un Gmail), pas d'avis de non-responsabilité **dans le logiciel** (il n'est que dans le pied de page du site : « fourni sans garantie »). **[CODE]** | Responsabilité de TalkTrueFPV mal encadrée en cas d'ESC détruit ; non-conformité LPD/RGPD (point M3). | `src/translations/fr/common.json` (bloc « Avertissement », l. 64-70) ; site `gh-pages` | Page « Confidentialité » : quelles données partent où (GitHub pour la liste des versions, serveur des firmwares, rien d'autre). Avis de non-responsabilité visible dans le logiciel avant le premier flash (« à vos risques, sans garantie, hélices retirées »). |
| **M6** | Documentation et textes publics **faux ou périmés** : le site principal annonce encore « version 0.32.1, 375 tests, essais sur carte : pas encore faits », « aucun chiffre vérifié sur carte » ; `doc/flash.html` dit que la case de forçage « désactive ces contrôles » (le processeur n'est en réalité **jamais** forçable) ; l'avertissement du logiciel annonce « BLHeli pour Atmel » (le flash Atmel n'existe pas) ; deux adresses différentes pour le chargeur AM32 (`AlkaMotors/AM32_Bootloader_F051` et `am32-firmware/AM32-bootloader`) ; « Répondre à d'autres utilisateurs sur le forum » (il n'y a pas de forum). **[CODE]** + lecture du site | L'utilisateur se fie à un texte faux, par exemple en cochant le forçage en croyant qu'il contourne un contrôle de processeur. | `gh-pages/index.html`, `doc/flash.html`, `site-test/doc/flash.html` ; `src/translations/fr/common.json` l. 59, 65, 121, 208 | Relire tout le site avec le tableau de la section 3 ; publier la liste des ESC **validés** (aujourd'hui : BLS 35A J-H-40 en Bluejay 0.19.2, 24 kHz) et les limites connues. |
| **M7** | **Aucune sauvegarde automatique** avant un flash : ni des réglages (fichier à recharger), ni du firmware d'origine. La copie du firmware existe, mais seulement en mode avancé, à la main, ESC par ESC. Entre deux firmwares différents, les réglages ne sont pas repris par défaut. **[CODE]** | Après BLHeli_S → Bluejay, sens de rotation perdu : un moteur tourne à l'envers, le drone se retourne au décollage. Pas de retour à l'état exact d'avant. | `src/Containers/App/index.jsx` (`flash`, `handleFirmwareDump`) ; `src/Components/Flash/Escs/Esc/index.jsx:150-157` | Avant chaque flash, enregistrer automatiquement un fichier des réglages de chaque ESC (et proposer la copie du firmware pour BLHeli_S/Bluejay) ; bouton « Recharger des réglages ». |
| **M8** | **Débrancher l'USB pendant un test moteur** peut laisser la carte à la dernière vitesse reçue (relève du firmware de la carte). Ce risque connu **n'est pas écrit** dans la documentation publique : la page moteurs parle seulement de débrancher la batterie avant de fermer la page. **[CODE]** + lecture de `doc/moteurs.html` | Câble arraché ou mauvais contact pendant le test : moteurs qui continuent de tourner jusqu'à 30 % des gaz. | `gh-pages` : `doc/moteurs.html` ; firmware TRUEGLIDE (hors de ce dépôt) | Écrire le risque en clair dans le logiciel et la notice (« si le câble se débranche, les moteurs peuvent continuer : débranchez la batterie »). Côté firmware TRUEGLIDE : délai de sécurité qui coupe les moteurs sans nouvel ordre (à traiter dans la discussion du firmware). Mesurer le comportement réel avec la fiche P8. |
| **M9** | Le cœur du flash est **peu couvert par les tests** : 44,7 % de `FourWay.js`. Les étapes d'effacement, d'écriture, de vérification et de protection (« LJMP », « FLASH*FAILED ») ne sont jamais testées automatiquement ; `Containers/App` (enchaînement connexion, lecture, flash, déconnexion) : 36 %. **[EXÉCUTÉ]** | Une modification future peut casser la protection contre le blocage sans qu'aucun test ne le signale. | `src/utils/FourWay.js` lignes non couvertes 1082-1149 et 1331-1503 ; `src/Containers/App/index.jsx` | Tests avec un faux ESC qui simule écriture, relecture fausse et coupure à chaque étape ; tests de `flash()` et `handleFlashUrl()` (refus, échec, ESC mélangés). |
| **M10** | La case « Autoriser un layout différent » (forçage) est accessible à tous, sans mode avancé. Le texte d'aide prévient bien, mais un mauvais layout BLHeli_S/Bluejay peut inverser des sorties. **[CODE]** | Débutant qui coche pour « débloquer » un refus : ESC ou moteur détruit dès le premier démarrage. | `src/Components/FirmwareSelector/index.jsx:308-325` | Dans la version publique : cacher la case derrière « Réglages avancés », plus une confirmation tapée (« je sais que ce layout convient »). Décision de Johann. |

### 2.3 MINEURS

| N° | Problème en langage simple | Risque concret | Emplacement | Correction recommandée |
|---|---|---|---|---|
| m1 | Les nouvelles versions Bluejay et AM32 publiées par leurs auteurs sont **proposées automatiquement**, sans validation TrueGlide. | Une version neuve avec un défaut est flashée chez tout le monde. | `src/sources/GithubSource.js:22`, `src/sources/AM32/index.js:16` | Marquer « validée TrueGlide » les versions essayées au banc ; proposer celles-là par défaut. |
| m2 | Le nom de fichier AM32 lu dans l'ESC est accepté dès qu'il contient **un seul** caractère valide. Un nom finissant par « _ » donne un type de processeur vide, que le contrôle laisse passer. | Cas rare : contrôle du processeur affaibli sur un ESC à mémoire abîmée. | `src/utils/FourWay.js:515` | Exiger un nom complet du type `NOM_MCU` (lettres, chiffres, « _ », MCU non vide) ; sinon utiliser la signature du chargeur. |
| m3 | Les vitesses envoyées aux moteurs ne sont limitées **que par les curseurs** de l'écran ; le programme qui envoie l'ordre ne revérifie pas la plage. | Une erreur future dans l'écran pourrait envoyer plus de 1300 µs. | `src/Containers/App/index.jsx` (`handleAllMotorSpeed`, `handleSingleMotorSpeed`) | Borner aussi la valeur juste avant l'envoi (1000-1300, ou 1350-1650 en 3D). |
| m4 | Chaque version en ligne ne montre pas de quel commit elle vient ; le lien « code source » pointe vers `master` même pour `/test/` (v15). | Obligation AGPL (fournir le code exact de ce qui tourne) remplie de façon fragile si une branche est supprimée. | `src/translations/fr/common.json:68` | Afficher version + commit dans le logiciel, avec un lien vers ce commit. |
| m5 | `README.md` et le journal des modifications affiché dans le logiciel sont **ceux du projet d'origine** (Discord, esc-configurator.com, liste « Unreleased » d'origine). | Confusion : l'utilisateur signale ses problèmes au mauvais projet. | `README.md` ; `src/changelog.json` | README TrueGlide (ce que c'est, licence, origine, comment signaler) ; journal des modifications TrueGlide. |
| m6 | Dépendance `sleep` (module natif, jamais utilisée) : l'installation échoue avec Node 22. La vérification GitHub tourne avec Node 18, en fin de support. | Impossible de reconstruire facilement le logiciel sur un PC récent. | `package.json` ; `.github/workflows/test.yml` | Retirer `sleep` ; passer la vérification GitHub sur Node 20 ou 22. |
| m7 | 602 alertes de sécurité dans les dépendances, presque toutes dans l'outil de compilation (pas dans la page livrée) ; `draft-js` / `immutable` (éditeur de mélodies) en fait partie. | Faible pour l'utilisateur ; dette à suivre. | `package.json`, `yarn.lock` | Trier les alertes qui touchent la page livrée ; mettre à jour au fil de l'eau. |
| m8 | Un seul « TODO » dans le code : `src/sources/Bluejay/eeprom.js:23` (« not final ») — repris du projet d'origine. | Aucun constaté. | idem | À vérifier au prochain passage Bluejay. |
| m9 | Après un flash BLHeli_32 → AM32 (ESC vide), aucun réglage n'est écrit : la règle « coupure tension basse toujours désactivée » dépend alors de la valeur par défaut d'AM32. | **NON VÉRIFIÉ** : si la valeur par défaut du firmware était « activée », un ESC pourrait couper en vol. | `src/utils/FourWay.js` (`flashTarget`, migration) ; `src/utils/LowVoltage.js` | Après tout flash AM32, relire et forcer la coupure à « désactivée » ; contrôle dans la fiche P6. |

### 2.4 Points vérifiés et trouvés corrects

| Point | Preuve |
|---|---|
| Test moteurs : case « hélices retirées » obligatoire avant « activer », curseurs bornés à 1000-1300 µs (1350-1650 en 3D), arrêt en décochant, en lisant les ESC, en fermant la page | [CODE] `src/Components/MotorControl/index.jsx` ; [EXÉCUTÉ] tests réussis ; [MATÉRIEL] validé par Johann (sauf finitions, B4) |
| Aucun moteur commandé par la connexion, la lecture, l'écriture ou le flash (seul l'onglet moteurs envoie des vitesses) | [CODE] : `spinMotor`/`spinAllMotors` appelés seulement depuis l'onglet moteurs |
| Lecture refusée si la radio semble allumée | [CODE] `handleReadEscs` |
| BLHeli_S/Bluejay : layout et processeur comparés avant d'écrire ; processeur jamais forçable ; ESC à mémoire vide bloqué ; refus sans rien effacer | [CODE] `src/utils/FourWay.js:1046-1081` ; [MATÉRIEL] refus de mauvais layout validé par Johann |
| BLHeli_S/Bluejay : protection contre un flash coupé (« FLASH*FAILED », saut vers le chargeur écrit en premier) | [CODE] l. 1084-1150 (repris du projet d'origine) ; **NON VÉRIFIÉ** sur matériel (fiche P5) |
| AM32 : type de processeur toujours vérifié ; famille seulement pour ARM64K, avec une ligne au journal | [CODE] `src/utils/FourWay.js:356-404` (conforme à la décision) |
| Coupure tension basse verrouillée à « désactivée » à chaque écriture (AM32, BLHeli rév. 19) | [CODE] `src/utils/LowVoltage.js`, `writeSettings` ; [EXÉCUTÉ] tests réussis |
| BLHeli_32 (drone homogène) : reconnu, rien lu ni écrit, flash et écriture désactivés | [CODE] `src/utils/FourWay.js:445-461` ; [EXÉCUTÉ] tests ; voir B1 pour le cas mélangé |
| Aucun fichier BLHeli_32 dans le dépôt ; aucun firmware embarqué (seulement 3 petits fichiers d'essai) | [CODE] recherche des `.hex` / `.bin` |
| Fichiers BLHeli_S fixés sur des commits précis du dépôt officiel (le contenu ne peut pas changer à la source) | [CODE] `src/sources/Blheli/Silabs/versions.json` |
| Licence : AGPL v3 conservée, origine et auteurs cités dans le logiciel et le site, code source public et lié ; marques TrueGlide hors licence, ce que l'AGPL permet (article 7 e) | [CODE] `LICENSE`, `MARQUES.md`, `homeAttributionText` |
| Mise à jour : le logiciel prévient quand une nouvelle version est prête et demande de recharger | [CODE] `src/serviceWorkerRegistration.js:102-127` |
| Signaler un bug : lien vers les tickets GitHub (actifs, 0 ticket ouvert à ce jour) + « Enregistrer le journal » | [CODE], vérifié sur GitHub |

---

## 3. Tableau d'état corrigé (annoncé / réel)

| Fonction | Annoncé (site, notice, logiciel) | Réel au 06/11/2026 |
|---|---|---|
| Connexion à la carte (Betaflight / TRUEGLIDE) | oui | **Validé** sur SpeedyBee F405 Mini sous TRUEGLIDE (« BTFL 26.6.2 »). Betaflight officiel : **jamais essayé**. |
| Lecture / écriture des réglages Bluejay | oui | **Validé** (BLS 35A, Bluejay 0.19.2, J-H-40). Autres versions Bluejay : non essayées. |
| Lecture / écriture BLHeli_S | oui | **Jamais essayé sur matériel.** Code du projet d'origine. |
| Lecture / écriture AM32 | oui | **Jamais essayé sur matériel.** |
| Flash Bluejay → Bluejay avec reprise des réglages | oui | **Validé** (une configuration). Retour vers une version plus ancienne : non essayé. |
| Flash BLHeli_S → Bluejay (et retour) | « passer à Bluejay » mis en avant | **Jamais essayé sur matériel.** |
| Flash AM32 | oui | **Jamais essayé** ; défaut B2 (vérification ignorée) et M2 (interface bloquée après refus). |
| Refus d'un mauvais layout / processeur | « refuse, sauf forçage » | BLHeli_S/Bluejay : **validé** (layout). Processeur : jamais forçable, contrairement à `doc/flash.html`. AM32 : **non essayé**. |
| Protection contre un flash interrompu | « protection contre un flash interrompu » | **Jamais essayé** (coupure USB ni batterie). Aucune procédure de récupération publiée (B5). |
| Mélodies de démarrage | oui | **Validé** (Bluejay). AM32 : non essayé. |
| Test moteurs, plafond environ 30 % | 1000-1300 µs | **Validé** (mode normal), sauf la dernière version de l'arrêt (B4). |
| Test moteurs en mode 3D | 1350-1650 µs | **Jamais essayé.** |
| Onglet ESC dans TrueGlide Configurator | oui | **Validé** ; arrêt des moteurs en quittant corrigé puis revérifié (v13) ; v14 à réessayer (B4). |
| BLHeli_32 reconnu sans être lu | oui | **Jamais essayé sur matériel** ; faux dans un drone mélangé (B1) ; risque v15 (B3). |
| Guide BLHeli_32 → AM32 au ST-Link | site d'essai | **Jamais essayé** ; procédure irréversible ; à garder hors publication. |
| Broches AM32 PA0, PA15, PB2, PC6 (v15) | « en essai » | **Jamais essayé** ; risque B3. |
| ESC inconnu | « signalé » | ESC illisible : sauté avec « lecture ESC n impossible » [CODE]. **Jamais essayé.** |
| BLHeli pour Atmel | annoncé dans l'avertissement du logiciel | **Faux** : le flash Atmel n'existe pas (et bloque l'interface, M2). |
| Tests automatiques | site : « 375 / 375 » | **444 / 444 (v14), 445 / 445 (v15)** [EXÉCUTÉ, avec bouchon], couverture du flash 44,7 %. |
| Essais sur carte | site : « pas encore faits » | Faits le 31/10 et le 01/11 (TGE-P1) ; le site n'est pas à jour. |
| Hors ligne | non annoncé | L'application s'ouvre hors ligne après une première visite (cache) ; flash en ligne impossible sans Internet, sauf fichier déjà en cache ou fichier local. **NON VÉRIFIÉ** dans un navigateur (fiche P1). |

---

## 4. Périmètre de publication recommandé

### Publiable maintenant
**Rien au public**, tant que B1 à B5 ne sont pas traités. Le site d'essai peut rester accessible tel quel à des testeurs choisis, avec la mention « préversion, à vos risques ».

### Après correction des BLOQUANTS et fiches P2, P4, P5, P7 réussies : bêta publique
| Statut | Contenu |
|---|---|
| **Validé** (affiché comme tel) | Bluejay : lecture, écriture, flash entre versions, mélodies ; BLHeli_S → Bluejay et retour (si P4 réussie) ; test moteurs en mode normal ; onglet ESC dans TrueGlide Configurator. Liste exacte des ESC essayés. |
| **Expérimental** (bandeau orange dans le logiciel et la notice) | AM32 sur broches PA2, PB4, PA6 (après fiche P6 sur SEQURE) ; ESC jamais essayés par TrueGlide ; versions de firmware non validées (m1). |
| **Désactivé ou caché** | Mode 3D du test moteurs (bloquer le test si la carte est en 3D, tant que P3 n'est pas faite) ; broches AM32 PA0, PA15, PB2, PC6 (v15) ; case de forçage du layout hors mode avancé (M10) ; copie du firmware hors mode avancé ; anciennes versions `/onglet/v1`–`v13` et `/onglet/essai/` ; Google Tag Manager. |
| **Hors publication** | Guide BLHeli_32 → AM32 au ST-Link (irréversible, jamais essayé, avis juridique absent). Le texte peut rester sur le site d'essai. |

---

## 5. Tests à faire par Johann (fiches)

Règles communes à **toutes** les fiches :

- **SANS HÉLICES. Toujours.** Drone posé sur un support stable, moteurs dégagés.
- Batterie branchée seulement quand la fiche le demande ; main près de la prise de batterie pour pouvoir la débrancher.
- Radio éteinte sauf indication contraire.
- Avant chaque fiche : noter la version (`/app/` = v14, `/test/` = v15) et l'heure.
- Après chaque fiche : cliquer **« Enregistrer le journal de débogage »** et garder le fichier.
- Un ESC « sacrifiable » = un ESC que vous acceptez de perdre (pas sur le KarRmen).

À me renvoyer pour **chaque** fiche : RÉUSSI / ÉCHEC pour chaque étape, le fichier journal, une photo ou capture des écrans demandés, et tout ce qui a surpris.

---

### P1 — Ouverture sur un PC « vierge » et hors ligne
- **Matériel** : un PC Windows qui n'a jamais ouvert le site (ou un nouveau profil Chrome), si possible un Mac et un PC Linux ; Chrome et Edge ; câble USB de données ; la carte SpeedyBee **sans batterie**.
- **Étapes**
  1. Ouvrir Chrome, appuyer sur F12, onglet « Réseau » (Network), cocher « Conserver le journal ».
  2. Aller sur `https://jschmiedd.github.io/TrueGlide-ESC-Configurator/app/`.
  3. Faire une capture de la liste des adresses contactées (colonne « Domaine »).
  4. Cliquer « Tout accepter » dans la bannière cookies, faire une 2ᵉ capture de la liste.
  5. Brancher la carte, « Sélectionner un port », « Connecter ». Windows : noter si un pilote a dû être installé.
  6. Déconnecter, couper le Wi-Fi, recharger la page.
  7. Essayer Firefox : noter le message affiché.
- **Attendu** : connexion sans installer de logiciel (sauf pilote éventuel, à noter) ; en (3) seulement `jschmiedd.github.io` et `api.github.com` ; hors ligne la page s'ouvre ; Firefox affiche un message clair.
- **RÉUSSI** si connexion OK sur Chrome **et** Edge, page ouverte hors ligne, message clair sur Firefox. **ÉCHEC** sinon.
- **À noter pour le rapport** : en (4), l'apparition de `googletagmanager.com` confirme le constat M3.

### P2 — Arrêt des moteurs, version en ligne v14 (constat B4)
- **Matériel** : KarRmen **sans hélices**, batterie, TrueGlide Configurator, PC.
- **Étapes** (chaque étape démarre moteurs à environ 1150 µs avec le curseur maître) :
  1. Dans l'outil seul (`/app/`) : cliquer « Déconnecter ». Les moteurs doivent s'arrêter.
  2. Reconnecter, lancer, puis fermer l'onglet du navigateur.
  3. Rouvrir, lancer, puis recharger la page (F5).
  4. Dans TrueGlide Configurator, onglet ESC : lancer, puis passer à un autre onglet.
  5. Idem (4), en quittant pendant que le curseur d'**un seul** moteur est monté.
  6. Lancer, puis décocher « J'ai retiré toutes les hélices ».
  7. Lancer, puis cliquer « Lire les paramètres ».
- **Attendu** : arrêt en moins d'une seconde à chaque étape.
- **RÉUSSI** si les 7 étapes arrêtent les moteurs. **ÉCHEC** au premier moteur qui continue (débrancher la batterie tout de suite).

### P3 — Test moteurs en mode 3D (à faire avant d'autoriser le mode 3D)
- **Matériel** : KarRmen sans hélices ; activer le mode 3D dans la carte **et** dans les ESC (Bluejay : réglage « bidirectionnel »).
- **Étapes** : 1) Connecter ; vérifier que les curseurs sont à 1500 au départ. 2) Monter à 1600 puis revenir à 1500 : arrêt ? 3) Descendre à 1400 : rotation inverse, puis 1500. 4) Refaire les étapes 1, 4 et 6 de P2.
- **Attendu** : arrêt à 1500, jamais de rotation au démarrage, plage 1350-1650.
- **RÉUSSI / ÉCHEC** comme P2. Remettre le mode normal après.

### P4 — Flash et retour arrière, chaque famille validée
- **Matériel** : KarRmen (Bluejay) ; pour BLHeli_S, un ESC ou une carte 4-en-1 BLHeli_S **sacrifiable** sur un banc (carte de vol + ESC + moteurs sans hélices).
- **Étapes Bluejay** : 1) Lire, enregistrer le journal, noter les réglages (photo). 2) Flasher la dernière Bluejay en « Migrer les paramètres ». 3) Relire : sens des moteurs et réglages identiques ? 4) Revenir à 0.19.2. 5) Relire. 6) Test moteurs rapide (sens de rotation).
- **Étapes BLHeli_S** (banc) : 1) Lire, noter. 2) Activer le mode avancé, faire la « copie du firmware » de l'ESC 1, garder le fichier. 3) Flasher Bluejay **avec** « Migrer entre firmwares ». 4) Relire, test moteurs (sens). 5) Revenir en BLHeli_S 16.7 depuis le site. 6) Revenir au firmware d'origine avec « Installer depuis le disque dur » et le fichier de l'étape 2. 7) Relire.
- **Attendu** : chaque flash termine avec « ESC n flashé », relecture correcte, sens moteur conservé quand la migration est cochée.
- **RÉUSSI** si toutes les étapes passent et que les ESC finissent comme au départ. **ÉCHEC** sinon (noter l'étape et le message).

### P5 — Coupure USB pendant un flash (ESC sacrifiable)
- **Matériel** : banc BLHeli_S/Bluejay **sacrifiable** ; un 2ᵉ câble USB ; chronomètre.
- **Étapes**
  1. Lire les ESC. Lancer un flash Bluejay sur **un seul** ESC (bouton de sa carte).
  2. À environ 30 % de la barre, **débrancher le câble USB**. Noter le message affiché.
  3. Débrancher la batterie. Attendre 10 s. Rebrancher USB puis batterie.
  4. Connecter, lire : noter le nom affiché pour cet ESC.
  5. Reflasher le même firmware **sans** cocher le forçage.
  6. Relire, test moteurs sans hélices.
  7. Recommencer en coupant à environ 80 % de la barre (étape la plus risquée : la fin du flash).
- **Attendu** : l'ESC apparaît « FLASH*FAILED » (ou son nom d'origine), se reflashe sans forçage, tourne normalement.
- **RÉUSSI** si l'ESC est récupéré les 2 fois **sans outil extérieur**. **ÉCHEC** si l'ESC ne répond plus (le garder, ne pas insister, me renvoyer le journal).

### P6 — AM32 sur SEQURE E130/E160 G2 (avant de marquer AM32 « expérimental »)
- **Matériel** : ESC SEQURE AM32 monté sur un banc, carte de vol, moteurs **sans hélices**.
- **Étapes**
  1. Lire. Noter : nom, version, chargeur, broche, processeur (ligne du journal).
  2. Vérifier que « coupure tension basse » n'apparaît pas et noter la valeur du réglage si visible ailleurs.
  3. Changer un réglage (sens du moteur), écrire, relire.
  4. Flasher la même version AM32 depuis le site. Relire : réglages conservés ?
  5. Flasher une version plus ancienne, puis revenir.
  6. **Refus** : avec « Installer depuis le disque dur », choisir le fichier AM32 d'**un autre processeur** (par ex. un fichier `_G071` sur un ESC F051). Attendu : refus, rien écrit. **Noter si les boutons restent grisés** (constat M2 attendu tant qu'il n'est pas corrigé — ici le fichier local, qui se comporte mieux ; refaire le refus avec un choix en ligne de mauvaise cible si possible).
  7. Test moteurs, sens de rotation.
- **RÉUSSI** si 1-5 et 7 passent et que 6 est refusé sans rien écrire. **ÉCHEC** sinon.

### P7 — ESC non reconnu, ESC qui ne répond pas, ESC mélangés
- **Matériel** : banc avec 4 ESC séparés (ou 4-en-1 + 1 ESC séparé) ; si possible un ESC d'une autre famille.
- **Étapes**
  1. Débrancher le fil de signal de l'ESC 3. Lire. Attendu : « lecture ESC 3 impossible », les 3 autres lus, rien de flashé.
  2. Rebrancher ; couper l'alimentation de l'ESC 2 seulement (si le banc le permet). Lire. Même attendu.
  3. Monter en position 2 un ESC d'une autre famille (AM32 parmi des Bluejay, ou l'inverse). Lire. Ouvrir « Installer sur tous les ESC ». Noter ce qui est proposé ; **ne pas lancer** le flash, annuler.
  4. Radio allumée et liée : cliquer « Lire ». Attendu : refus « radio allumée ».
- **RÉUSSI** si 1, 2 et 4 se comportent comme attendu et que 3 ne propose pas un firmware d'une famille sur un ESC de l'autre. **ÉCHEC** sinon (photo de l'écran de l'étape 3).

### P8 — USB débranché pendant un test moteur (mesure du risque connu, M8)
- **Matériel** : KarRmen **sans hélices**, drone attaché ; main sur la prise de batterie.
- **Étapes** : 1) Lancer les moteurs à 1100 µs. 2) Débrancher le câble USB côté PC. 3) Chronométrer : les moteurs s'arrêtent-ils seuls ? Au bout de combien ? 4) Si non après 5 s : débrancher la batterie. 5) Refaire sous Betaflight officiel si possible.
- **Résultat à renvoyer** : temps d'arrêt (ou « ne s'arrête pas ») pour TRUEGLIDE et pour Betaflight. Pas de RÉUSSI/ÉCHEC : c'est une mesure qui servira à la notice et au firmware TRUEGLIDE.

### P9 — Octet de broche d'un ESC BLHeli_32 (avant toute publication de la v15, B3)
- **Matériel** : 2 ESC BLHeli_32 de marques différentes (emprunt possible). **Ne rien flasher.**
- **Étapes** : 1) Ouvrir `/test/` (v15), connecter, lire. 2) Noter ce qui s'affiche : « BLHeli_32 (probable) » ou « AM32 (…) ». 3) Enregistrer le journal (il contient la valeur lue). 4) Déconnecter sans rien cliquer d'autre.
- **RÉUSSI** si les 2 ESC sont affichés « BLHeli_32 (probable) » sans lecture de réglages. **ÉCHEC** si l'un est pris pour un AM32.

### P10 — Coupure de batterie pendant un flash (ESC sacrifiable)
- Comme P5, mais en débranchant **la batterie** au lieu de l'USB, à 30 % puis à 80 %.
- **RÉUSSI / ÉCHEC** comme P5.

---

## 6. Checklist de publication (à cocher avant toute mise en ligne publique)

**Sécurité moteurs et ESC**
- [ ] B1 corrigé (droit de flasher ESC par ESC) et testé, y compris la copie du firmware
- [ ] B2 corrigé (flash AM32 non vérifié = échec annoncé) et testé
- [ ] B3 : v15 non publiée, ou fiche P9 RÉUSSIE + second indice ajouté
- [ ] B4 : fiche P2 RÉUSSIE sur la version exacte qui sera publiée
- [ ] B5 : page de récupération publiée, écrite à partir des fiches P5 et P10
- [ ] M2 corrigé (interface jamais bloquée après un refus)
- [ ] Mode 3D du test moteurs bloqué, ou fiche P3 RÉUSSIE
- [ ] Case de forçage du layout réservée au mode avancé (décision de Johann notée)
- [ ] Fiches P4, P5, P7 RÉUSSIES ; P6 RÉUSSIE si AM32 est publié

**Firmwares**
- [ ] M1 : firmwares des versions validées hébergés par TrueGlide avec empreintes SHA-256, ou risque accepté par écrit
- [ ] Versions « validées TrueGlide » repérées dans la liste (m1)

**Site et documentation**
- [ ] Site principal à jour (version, nombre de tests, essais réalisés)
- [ ] Liste des ESC **validés** publiée (modèle, layout, firmware, version)
- [ ] Limites connues publiées (dont USB débranché pendant le test moteur, M8)
- [ ] Textes faux corrigés (forçage, Atmel, adresse du chargeur AM32, forum)
- [ ] Avis de non-responsabilité visible dans le logiciel avant le premier flash
- [ ] Moyen de signaler un bug vérifié (tickets GitHub + adresse e-mail)

**Confidentialité et légal**
- [ ] Google Tag Manager retiré (ou rien chargé sans identifiant) ; bannière cookies retirée ou rendue exacte
- [ ] Polices du site hébergées localement
- [ ] Page « Confidentialité » et mentions légales en ligne
- [ ] Avis juridique BLHeli_32 reçu, ou fonctions BLHeli_32 limitées à la détection
- [ ] Lien « code source » vers le commit exact de chaque version en ligne (m4)

**Mise en ligne**
- [ ] `/onglet/v1` à `/onglet/v13` et `/onglet/essai/` retirés
- [ ] Tests automatiques réussis **avec la vraie dépendance** `web-serial-polyfill` (vérification GitHub verte)
- [ ] Décision de publication écrite et datée par Johann

---

## 7. Note de correction (à copier dans la discussion ESC)

> **Corrections demandées avant publication publique — TrueGlide ESC Configurator (contrôle du 06/11/2026)**
>
> Ne rien publier tant que ces points ne sont pas corrigés et revérifiés. Chaque correction : un commit, un test automatique, une ligne dans le tableau des essais.
>
> **BLOQUANTS**
>
> **B1 — Flash autorisé sur un ESC BLHeli_32 dans un drone mélangé.** `selectCanFlash` (`src/Containers/App/stateSlice.js:70`) ne regarde que le premier ESC. Avec ESC 1 = AM32 et ESC 2 = BLHeli_32, les boutons « Flasher » et « Copie du firmware » de l'ESC 2 sont actifs et « Installer sur tous » l'inclut. Corriger : autorisation ESC par ESC (boutons de `src/Components/Flash/Escs/Esc/index.jsx`) ; dans `flash()` (`src/Containers/App/index.jsx`), sauter tout ESC `BLHeli_32` / `AM32-PIN` avec une ligne au journal ; même règle pour la copie du firmware. Test : ESC mélangés → aucun flash ni copie sur l'ESC BLHeli_32.
>
> **B2 — Flash AM32 annoncé réussi alors que la vérification a échoué.** `flashArm` (`src/utils/FourWay.js:1173-1185`) attrape l'erreur de `verifyPages`, puis écrit « NOT READY », redémarre l'ESC et annonce le flash. Corriger : sur échec de vérification, s'arrêter, laisser « FLASH FAIL », ne pas redémarrer, journal « ESC n : flash raté, ne pas utiliser, reflasher », et compter le flash comme raté. Test : vérification fausse → pas d'écriture « NOT READY », pas de « ESC n flashé ».
>
> **B3 — v15 : un ESC BLHeli_32 peut être pris pour un AM32.** La reconnaissance (`src/utils/FourWay.js:458`) repose sur un seul octet ; la v15 accepte 0x00, 0x0F, 0x12, 0x26 (`src/sources/AM32/eeprom.js`). Ne pas publier la v15 tant que l'octet réel de 2 ESC BLHeli_32 n'est pas relevé (fiche P9). Ajouter un second indice avant de traiter un ESC comme AM32.
>
> **B4 — Arrêt des moteurs à la déconnexion modifié après l'essai, non réessayé.** `handleDisconnect` (`src/Containers/App/index.jsx:376-387`) passe maintenant par `stopAllMotors` (`src/utils/Msp.js:620`), qui interroge la carte avant d'envoyer l'arrêt et ne l'envoie que si `motorsSpinning`. Recommandé : envoyer l'arrêt directement (1000, ou 1500 si le 3D est connu depuis la connexion), sans question préalable. Dans tous les cas : refaire la fiche P2 sur la version publiée.
>
> **B5 — Pas de procédure de récupération.** `doc/flash.html` dit qu'un ESC « FLASH*FAILED » se reflashe « avec la case de forçage » : inexact, et rien pour AM32 ni pour un ESC muet. Écrire la page de récupération après les fiches P5 et P10 ; lien depuis le journal en cas d'échec de flash.
>
> **MAJEURS**
>
> **M1 — Firmwares téléchargés par un relais tiers, sans empreinte.** `src/settings.json:2` (`cors.bubblesort.me`) ; `fetchAndCacheHexResponse` (`src/utils/Fetch.js:87`) passe toujours par lui. Héberger les fichiers des versions validées sur le site TrueGlide avec une liste SHA-256 vérifiée avant flash.
>
> **M2 — Interface bloquée après un refus de flash AM32 (ou un ESC Atmel).** `handleFlashUrl` (`src/Containers/App/index.jsx:760`) appelle `this.flash()` sans protection ; l'erreur du contrôle préalable laisse `isFlashing` à vrai (vérifié par un essai automatique). Protéger l'appel, remettre l'état, journal « flash refusé, rien n'a été écrit ».
>
> **M3 — Google Tag Manager chargé avec un identifiant vide, bannière cookies inexacte, polices Google sur le site.** `src/Components/CookieConsent/cookieSlice.js:13`. Retirer GTM et la bannière (ou ne rien charger sans identifiant) ; héberger les polices.
>
> **M4 — Anciennes versions en ligne.** `gh-pages` : `onglet/v1` à `v13` (v1-v12 sans l'arrêt des moteurs avant déconnexion) et `onglet/essai/`. Les retirer.
>
> **M5 — Pas de page confidentialité, pas de mentions légales, pas d'avis de non-responsabilité dans le logiciel.** Les ajouter ; l'avis doit apparaître avant le premier flash.
>
> **M6 — Textes faux ou périmés.** Site principal (« 0.32.1 », « 375 tests », « essais pas encore faits ») ; `doc/flash.html` (le forçage ne désactive pas le contrôle du processeur) ; `homeDisclaimerTextLine1` (Atmel) ; deux adresses du chargeur AM32 (`blheli32ToAM32Line2` / `blheli32Step2`) ; « forum » (`homeContributionItem1`). Corriger et publier la liste des ESC validés.
>
> **M7 — Aucune sauvegarde automatique avant flash.** Enregistrer automatiquement un fichier des réglages de chaque ESC avant tout flash ; bouton « Recharger des réglages ».
>
> **M8 — Risque « USB débranché pendant le test moteur » non documenté.** L'écrire dans le logiciel et la notice ; traiter le délai de sécurité côté firmware TRUEGLIDE.
>
> **M9 — Cœur du flash peu testé (44,7 % de `FourWay.js`).** Ajouter des tests avec un faux ESC : écriture, relecture fausse, coupure à chaque étape, protections « LJMP » et « FLASH*FAILED ».
>
> **M10 — Case de forçage du layout accessible à tous.** La réserver au mode avancé, avec confirmation explicite (décision de Johann à noter).

---

## Annexe — Reproduire les vérifications de ce contrôle

```bash
# Tests et lint (Node 22) ; si codeload.github.com est bloqué, l'installation échoue
# sur web-serial-polyfill : le noter « NON VÉRIFIÉ ».
YARN_IGNORE_ENGINES=true yarn install --frozen-lockfile --ignore-scripts
CI=true npx react-scripts test --watchAll=false
npx --no-install eslint ./src --ext .jsx,.js
CI=true npx react-scripts test --watchAll=false --coverage
```

Les deux essais propres à ce contrôle (B1 et M2) sont dans `docs/audit/essais-controle.test.jsx.txt`. Pour les rejouer : copier le fichier dans `src/audit/audit.test.jsx` (dans une copie de travail, pas dans le dépôt) et lancer `CI=true npx react-scripts test --watchAll=false src/audit`. Résultats obtenus le 06/11/2026 :

```
A1b flash() direct : exception = InvalidHexFileError | isFlashing = true
A1  handleFlashUrl : exception remontée = InvalidHexFileError | isFlashing = true
A2  ESC mélangés (AM32 puis BLHeli_32) : canFlash = true
```
