# Contre-audit avant publication publique — TrueGlide ESC Configurator

Date : 6 novembre 2026 (soir)
Objet : vérifier les corrections faites après le contrôle du 6 novembre (`docs/audit/CONTROLE-PUBLICATION-2026-11-06.md`), chercher les régressions, revoir les points critiques.

Versions comparées :

| | Branche | Commit | En ligne ? |
|---|---|---|---|
| Ancienne (auditée le 06/11) | `master` | `ab3a994` (v14) | oui : `/app/`, `/onglet/v14/` |
| Nouvelle (corrigée) | `trueglide/audit-corrections` | `d6ec464` (3 commits : `c8afd30`, `46b620c`, `d6ec464`) | **non** : rien n'est déployé |
| Essai AM32 (hors corrections) | `trueglide/test-am32` | `2282c46` (v15) | oui : `/test/`, `/onglet/v15/`, et chargée par TrueGlide Configurator |

Je n'ai pas repris les conclusions du premier rapport ni les affirmations de la session de développement : tout ce qui est noté « vérifié » ci-dessous l'a été de nouveau ici.

Légende : **[EXÉCUTÉ]** vérifié en faisant tourner le logiciel ou les tests ; **[CODE]** vérifié en lisant le code ; **[BANC]** vérifié par les essais de Johann (preuve écrite jointe) ; **NON VÉRIFIABLE SANS MATÉRIEL** : fiche Q associée.

---

## 0. Reçu / manquant

| Élément demandé | Reçu ? | Remarque |
|---|---|---|
| Rapport du 1er audit | oui | `docs/audit/CONTROLE-PUBLICATION-2026-11-06.md` |
| Note de correction | oui | section 7 du 1er rapport |
| Réponse du développeur | oui | message de la session de développement (06/11, 20:26) : corrections B1, B2, B4, M2, M3, M5, M6, M8, M10, m3, m9 ; non traités B3, B5, M1, M4, M6 (site), M7, M9, m1, m2, m4-m8 |
| Nouvelle version (code) | oui | branche `trueglide/audit-corrections`, commit `d6ec464` ; **aucun numéro de version** nouveau (toujours `0.33.0-dev` dans `package.json`) |
| Ancienne version | oui | `master` `ab3a994` |
| Changelog et documentation mis à jour | **non** | aucun changement sur `gh-pages` ni dans `src/changelog.json` |
| Résultats de banc | **en partie** | fiche **TGE-P1** (31/10 et 01/11) avec mode opératoire, tableau de résultats et journal complet (`docs/essais/TGE-P1/`). **Aucune des fiches P1 à P10 du 1er audit n'a encore été faite.** Les captures citées dans TGE-P1 ne sont pas jointes. |
| Tableau d'état actuel | non | reconstruit en section 4 |

### Exécuté ici

| Action | Résultat |
|---|---|
| Tests automatiques, version corrigée | **450 / 450 réussis** (43 fichiers) [EXÉCUTÉ] |
| Lint, version corrigée | 0 erreur, 29 avertissements de style (identique à v14) [EXÉCUTÉ] |
| Les nouveaux tests échouent-ils sur l'ancienne version ? | **oui** : les tests de la version corrigée lancés sur le code `ab3a994` donnent **13 échecs**, dont les 4 tests B1/B2/B4/M2, le bornage des vitesses, le test m9 et l'affichage de la case de forçage. Les tests protègent donc bien contre le retour des défauts. [EXÉCUTÉ] |
| 6 essais propres au contre-audit (C1 à C6) | voir sections 2 et 3 ; fichier `docs/audit/essais-contre-audit.test.jsx.txt` [EXÉCUTÉ] |
| Couverture | `FourWay.js` (flash) : **45,4 %** (44,7 % avant) ; `Containers/App` : 44,1 % (36,3 % avant) [EXÉCUTÉ] |
| Dépendances | `package.json` et `yarn.lock` **identiques** à v14 : aucune nouvelle dépendance, aucune nouvelle alerte. [EXÉCUTÉ] |

Même réserve qu'au 1er audit : la dépendance `web-serial-polyfill` est refusée ici (codeload, 403) ; les tests tournent avec un bouchon à sa place. Le résultat avec la vraie dépendance reste **NON VÉRIFIÉ** (à confirmer par la vérification GitHub).

---

## 1. VERDICT

### **PAS PUBLIABLE** (inchangé par rapport au 1er audit), mais nettement plus proche.

En clair :

- **Ce qui a vraiment progressé.** Trois des cinq défauts bloquants sont corrigés dans le code, avec un test qui le prouve : un ESC BLHeli_32 n'est plus jamais flashé ni copié dans un drone mélangé (B1) ; un flash AM32 mal vérifié est maintenant annoncé raté et l'ESC n'est pas redémarré (B2) ; l'arrêt des moteurs à la déconnexion est envoyé directement (B4). L'interface ne se bloque plus après un refus de flash (M2). Les vitesses moteurs sont bornées juste avant l'envoi. Google Tag Manager et la bannière cookies ont disparu du logiciel.
- **Pourquoi ce n'est toujours pas publiable.**
  1. **B3 n'est pas traité, et il est déjà en ligne** : TrueGlide Configurator charge l'onglet v15 (celui qui peut confondre un BLHeli_32 avec un AM32) sur ses adresses `/app/` et `/test/`.
  2. **B5** (procédure de récupération) n'existe toujours pas.
  3. **B2 et B4 ne sont prouvés que sur le papier** : il faut le banc (fiches Q2 et Q5).
  4. **Rien n'est déployé** : `/app/` tourne toujours avec la v14, qui a encore B1 et B2.
  5. **Aucun essai de banc depuis le 1er audit.** L'essai TGE-P1 a été fait sur des versions plus anciennes (`be3807a`, onglets v12/v13), avant trois séries de modifications du flash et de l'arrêt des moteurs.

### Pour passer en « PUBLIABLE EN BÊTA »

1. Retirer l'onglet v15 de TrueGlide Configurator (ou faire la fiche Q6 et ajouter un second indice) — **B3**.
2. Déployer la version corrigée sur le site d'essai et réussir **Q1** (non-régression Bluejay) et **Q2** (arrêt des moteurs).
3. Réussir **Q4** (coupure USB et batterie pendant un flash) et publier la page de récupération qui en découle — **B5**.
4. Bloquer le test moteurs en mode 3D, ou réussir **Q3**.
5. Corriger le site public (constats M6, M8 côté site) et ajouter la page confidentialité (M5).

---

## 2. Suivi des constats du 1er audit

Statuts : **CORRIGÉ** / **PARTIEL** / **NON CORRIGÉ** / **À RISQUE** / **NON VÉRIFIABLE** (sans matériel).

### 2.1 Bloquants

| N° | Problème | Gravité | Statut | Preuve | Ce qui reste à faire |
|---|---|---|---|---|---|
| B1 | ESC BLHeli_32 flashable dans un drone mélangé | BLOQUANT | **CORRIGÉ** (flash et copie du firmware) | [CODE] `isFlashBlocked` (`src/utils/helpers/Settings.js:169-178`), appliqué ESC par ESC dans `flashTargets` (`src/Containers/App/index.jsx:445`), `handleFirmwareDump` (l. 686) et les deux boutons (`src/Components/Flash/Escs/Esc/index.jsx:144` et `:154`). [EXÉCUTÉ] essai C2 : ESC 1 AM32 + ESC 2 BLHeli_32, « Installer sur tous » → seul l'ESC 1 passe au contrôle et au flash. Test du développeur `should never flash nor dump a BLHeli_32 ESC in a mixed drone` : réussit sur la version corrigée, échoue sur v14. | L'écriture des réglages, les mélodies et le retour aux valeurs par défaut ne sont pas filtrés de la même façon (nouveau constat N1, mineur). Vérification au banc : fiche Q7. |
| B2 | Flash AM32 annoncé réussi malgré une vérification ratée | BLOQUANT | **CORRIGÉ dans le code / effet NON VÉRIFIABLE** | [CODE] `flashArm` relance l'erreur (`src/utils/FourWay.js:1174-1184`) : « NOT READY » n'est plus écrit, l'ESC n'est pas redémarré, `writeHex` attend maintenant `flashTarget` (`return await`, l. 1318 et 1345) donc l'échec est bien compté. Journal : « Vérification après écriture ratée : NE PAS UTILISER cet ESC, reflashez-le ». Test `should report an AM32 flash as failed when the verification fails` : réussit, échoue sur v14. [EXÉCUTÉ] | Le commentaire affirme que l'ESC « ne peut pas démarrer un firmware cassé » parce qu'il garde « FLASH FAIL ». Cela dépend du **chargeur AM32**, qui doit refuser de lancer le firmware tant que l'octet de démarrage n'est pas à 1. Rien dans ce dépôt ne le prouve : fiche Q5 (étape coupure). |
| B3 | v15 : un ESC BLHeli_32 peut être pris pour un AM32 | BLOQUANT | **NON CORRIGÉ — et exposé** | [CODE] la branche corrigée ne contient pas la v15 (bien). Mais `gh-pages` est inchangé : `/test/` et `/onglet/v15/` sont en ligne, et selon les éléments fournis **TrueGlide Configurator charge v15 sur `/app/` et `/test/`**. | Décision annoncée : v15 hors publication publique. Il faut l'appliquer : faire pointer TrueGlide Configurator vers un onglet sans les broches PA0/PA15/PB2/PC6 (v14 corrigée), ou faire la fiche Q6 et ajouter un second indice de reconnaissance. |
| B4 | Arrêt des moteurs à la déconnexion modifié et non réessayé | BLOQUANT | **CORRIGÉ dans le code / NON VÉRIFIABLE** | [CODE] `handleDisconnect` envoie directement 1000 (ou 1500 en 3D, connu depuis la connexion) avant de fermer, sans question à la carte (`src/Containers/App/index.jsx:385-390`) ; la fermeture de la prise envoie un second arrêt. [EXÉCUTÉ] test `should stop all motors directly before closing the port` : réussit, échoue sur v14. | C'est la **3e version** de l'arrêt (01933a2 → 6d12f98 → c8afd30). La seule validée au banc est la 1re (onglet v13). Fiche **Q2** obligatoire sur la version déployée. |
| B5 | Pas de procédure de récupération | BLOQUANT | **NON CORRIGÉ** | Aucun changement sur `gh-pages` ; `doc/flash.html` dit toujours « reflashé (avec la case de forçage) ». | Fiche Q4, puis page « Récupérer un ESC ». |

### 2.2 Majeurs

| N° | Problème | Gravité | Statut | Preuve | Ce qui reste à faire |
|---|---|---|---|---|---|
| M1 | Firmwares par un relais tiers, sans empreinte | MAJEUR | **NON CORRIGÉ** | `src/settings.json:2`, `src/utils/Fetch.js:87-98` inchangés | Héberger les versions validées + SHA-256. |
| M2 | Interface bloquée après un refus de flash | MAJEUR | **CORRIGÉ** | [CODE] `flash()` remet toujours l'état (`finally`, l. 423-432) ; refus du contrôle préalable → « ESC n non flashé : rien n'a été écrit », ESC suivant (l. 450-458). [EXÉCUTÉ] essai C1 : refus AM32 → aucune exception, `isFlashing` = faux, rien écrit. Essai C4 : erreur « interface inconnue » (Atmel) → interface débloquée. | Atmel : aucun message pour l'utilisateur et les ESC suivants sont abandonnés en silence (N3, mineur). |
| M3 | Google Tag Manager, bannière cookies, polices Google | MAJEUR | **PARTIEL** | [CODE] GTM et bannière retirés du logiciel (`src/Components/App/index.jsx`, `cookieSlice.js`). Les appels `TagManager.dataLayer` restants n'envoient rien sur Internet (ils écrivent seulement dans la page) [CODE, `react-gtm-module`]. | Site `gh-pages` : polices Google toujours chargées (`index.html`). Retirer à terme `react-gtm-module` et les appels restants. |
| M4 | Anciennes versions `/onglet/v1`-`v13` et `/onglet/essai/` en ligne | MAJEUR | **NON CORRIGÉ** | `gh-pages` inchangé | Accord de Johann puis retrait. |
| M5 | Pas de confidentialité, mentions légales, non-responsabilité | MAJEUR | **PARTIEL** | [CODE] avis « sans aucune garantie » ajouté à l'accueil (`homeDisclaimerTextLine1`) et à l'écran de flash (`flashDisclaimer`, `src/Components/FirmwareSelector/index.jsx:341-347`) ; test FirmwareSelector. | Page confidentialité et mentions légales : absentes. |
| M6 | Textes faux ou périmés | MAJEUR | **PARTIEL** | [CODE] logiciel : Atmel, adresse du chargeur AM32 et « forum » corrigés. | Site public non corrigé (« 0.32.1 », « 375 tests », « essais pas encore faits », forçage du processeur). **Nouvelles affirmations non prouvées** dans `homeDisclaimerTextLine1` : « l'ancien BLHeli pour SiLabs est lu, réglé et flashé ; BLHeli pour Atmel est lu et réglé » — jamais essayé sur matériel (constat N6). |
| M7 | Pas de sauvegarde automatique avant flash | MAJEUR | **NON CORRIGÉ** | aucun changement | — |
| M8 | USB débranché pendant le test moteur non documenté | MAJEUR | **PARTIEL** | [CODE] phrase ajoutée dans l'onglet moteurs (`motorControlUnplugBattery`). | Notice `doc/moteurs.html` non corrigée ; délai de sécurité côté firmware TRUEGLIDE non traité ; mesure fiche Q8. |
| M9 | Cœur du flash peu testé | MAJEUR | **NON CORRIGÉ** | [EXÉCUTÉ] `FourWay.js` 45,4 % ; les étapes d'écriture, de vérification et de protection BLHeli_S/Bluejay (l. 1082-1149, 1347-1519) restent sans test. | — |
| M10 | Case de forçage accessible à tous | MAJEUR | **CORRIGÉ** | [CODE] case affichée seulement en réglages avancés (`FirmwareSelector/index.jsx:308`) ; test FirmwareSelector réussit, échoue sur v14. [EXÉCUTÉ] | Petit cas limite (N5). |

### 2.3 Mineurs

| N° | Statut | Preuve / reste à faire |
|---|---|---|
| m1 versions non validées proposées | NON CORRIGÉ | — |
| m2 nom de fichier AM32 accepté trop facilement | NON CORRIGÉ | `src/utils/FourWay.js:515` |
| m3 vitesses bornées seulement par l'écran | **CORRIGÉ** | [EXÉCUTÉ] essai C5 : 2000 → 1300, 0 → 1000, 1900 (un moteur) → 1300 ; en 3D 1000 → 1350, 2000 → 1650. `clampMotorSpeed`, `src/Containers/App/index.jsx:802`. |
| m4 commit de chaque version en ligne | NON CORRIGÉ | — |
| m5 README / changelog du projet d'origine | NON CORRIGÉ | — |
| m6 dépendance `sleep`, Node 18 | NON CORRIGÉ | — |
| m7 alertes de dépendances | NON CORRIGÉ (inchangé) | dépendances identiques |
| m8 TODO Bluejay | NON CORRIGÉ (sans conséquence) | — |
| m9 coupure tension basse après un flash AM32 sans migration | **CORRIGÉ dans le code** | [CODE] `flashTarget` réécrit les réglages si la coupure est active (`src/utils/FourWay.js:1259-1267`) ; test réussit, échoue sur v14. Au banc : fiche Q5. |

---

## 3. Nouveaux constats (régressions et nouveautés)

Aucune régression n'a été trouvée sur la lecture, l'écriture et le flash Bluejay **dans le code** : le chemin BLHeli_S/Bluejay n'a changé que par l'attente de `flashTarget` et le contrôle de la coupure tension basse, qui ne s'applique pas à Bluejay. Le banc reste à refaire (Q1) car les essais de TGE-P1 portent sur une version plus ancienne.

| N° | Gravité | Problème en langage simple | Risque concret | Emplacement | Correction recommandée |
|---|---|---|---|---|---|
| **N4** | **MAJEUR** | **Ce qui est en ligne n'est pas ce qui est corrigé.** `/app/` est toujours la v14 (B1, B2, M2 présents) ; TrueGlide Configurator charge l'onglet v15 (B3). Le site est déjà accessible à n'importe qui qui connaît l'adresse : c'est une publication de fait. | Un visiteur utilise aujourd'hui une version avec trois défauts bloquants. | `gh-pages` : `app/`, `test/`, `onglet/v15/` ; configuration de TrueGlide Configurator (autre dépôt, non lu) | Déployer la version corrigée sur `/test/` pour les fiches Q ; d'ici là, bandeau « préversion, ne pas utiliser sur du matériel de valeur » sur `/app/`, et onglet de TrueGlide Configurator ramené sur une version sans v15. |
| **N7** | **MAJEUR** | Le test moteurs en **mode 3D** reste actif alors qu'il n'a jamais été essayé (TGE-P1 6.8 : « non »). | Comportement à l'arrêt et au neutre (1500) non prouvé : un moteur pourrait tourner à l'ouverture de l'onglet si la détection du mode 3D se trompait. | `src/Components/MainContent/index.jsx:134` ; `src/Containers/App/index.jsx:389` et `:802` | Bloquer le test moteurs quand la carte est en 3D (message « non disponible en 3D »), tant que Q3 n'est pas réussie. |
| N1 | MINEUR | Dans un drone mélangé, « Écrire les paramètres », l'écriture des mélodies et « valeurs par défaut » **s'adressent encore** à l'ESC BLHeli_32. Rien n'y est écrit, mais seulement parce que le programme plante avant l'écriture ; le journal dit alors « écriture de l'ESC 2 ratée ». [EXÉCUTÉ] essais C3 (l'écriture est bien demandée pour l'ESC 2) et C6 (l'écriture s'arrête sur une erreur, 0 écriture). | Protection par accident ; une modification future pourrait la faire sauter. Message déroutant. | `handleWriteSettings` (`src/Containers/App/index.jsx:636`), `handleResetDefaultls` (l. 485), `handleMelodyWrite` (l. 824) ; `selectCanWrite` (`stateSlice.js`) | Sauter explicitement les ESC `isFlashBlocked` partout, avec la ligne « rien n'a été lu ni écrit ». |
| N2 | MINEUR | Le message « **Flash raté : ne pas utiliser cet ESC, reflashez-le** » s'affiche aussi quand **rien n'a été écrit** (fichier refusé après le contrôle préalable : table de vecteurs différente, fichier invalide, mauvaise famille de processeur) et quand le flash a réussi mais que la reprise des réglages a échoué. | Un utilisateur croit son ESC abîmé et coche le forçage pour « réparer » ; ou reflashe alors que c'est le sens des moteurs qu'il faut vérifier. | `src/translations/fr/log.json` (`flashingEscFailed`) ; `writeHex` renvoie `null` dans tous ces cas (`src/utils/FourWay.js:1315-1350`) | Distinguer trois messages : « refusé, rien écrit », « flash raté, reflasher », « flashé, mais réglages non repris : vérifier le sens des moteurs ». |
| N3 | MINEUR | ESC Atmel (ou interface inconnue) : l'interface se débloque bien, mais **aucun message** n'explique pourquoi rien n'a été flashé, et les ESC suivants sont abandonnés. [EXÉCUTÉ] essai C4. | Utilisateur perdu. | `flashTargets` / `handleFlashUrl` (`src/Containers/App/index.jsx:434-484`, `:784-791`) | Journal « ESC n : flash impossible pour ce type d'ESC, rien n'a été écrit » ; passer à l'ESC suivant. |
| N5 | MINEUR | Si l'on coche le forçage en réglages avancés puis qu'on désactive les réglages avancés pendant que l'écran de flash est ouvert, la case disparaît mais **le forçage reste peut-être actif**. NON VÉRIFIÉ par exécution [CODE : l'état `force` n'est pas remis à zéro]. | Forçage d'un layout sans le voir. | `src/Components/FirmwareSelector/index.jsx:55` et `:308` | Remettre `force` à faux quand la case est cachée. |
| N6 | MINEUR | Nouvelles affirmations dans l'avertissement d'accueil : ancien BLHeli SiLabs « lu, réglé et flashé », BLHeli Atmel « lu et réglé ». Jamais essayés. | Annonce sans preuve. | `src/translations/fr/common.json` (`homeDisclaimerTextLine1`) | Écrire « non essayé par TrueGlide » ou retirer. |
| N8 | INFO | `docs/essais/TGE-P1/resultats.md` dit encore « /app/ public a encore ce défaut » (arrêt des moteurs) : c'est corrigé en ligne depuis `868e306`. | Document de preuve inexact. | `docs/essais/TGE-P1/resultats.md`, « Défauts trouvés » 1 | Mettre à jour. |

---

## 4. Tableau d'état corrigé (annoncé / réel), version corrigée `d6ec464`

| Fonction | Annoncé | Réel |
|---|---|---|
| Connexion, lecture Bluejay | oui | **Validé au banc** sur une version plus ancienne (TGE-P1, journal 31/10 21:25 → 01/11 12:25). À reconfirmer sur la version corrigée (Q1). |
| Écriture d'un réglage Bluejay | oui | **Validé au banc** (journal 21:37:02 → 21:38:25 : seul l'ESC 1 écrit). Q1. |
| Reflash Bluejay → Bluejay avec reprise des réglages | oui | **Validé au banc** (journal 21:47:33 → 21:48:32, 4 × 10,9 s, MOTOR_DIRECTION repris). Version différente : Q1. |
| BLHeli_S → Bluejay et retour | oui | **Jamais essayé** (TGE-P1 7.x retiré). |
| Refus d'un mauvais layout | oui | **Validé au banc** (journal 01/11 11:08, 4 refus). |
| Flash AM32, refus AM32 | oui | **Jamais essayé.** Code corrigé (B2, M2). |
| ESC BLHeli_32 dans un drone mélangé | « reconnu, rien lu ni écrit » | Code corrigé pour flash et copie ; écriture des réglages protégée par accident (N1). **Jamais essayé.** |
| Test moteurs, mode normal | 1000-1300 µs | **Validé au banc** (TGE-P1 6.1-6.6, déclaratif : le journal ne trace pas le test moteurs, captures non jointes). Bornage aussi avant l'envoi (m3). |
| Arrêt des moteurs en quittant l'onglet ESC | oui | **Validé au banc sur l'onglet v13 seulement** (8.3, 2e essai). Mécanisme changé deux fois depuis : Q2. |
| Test moteurs, mode 3D | 1350-1650 µs | **Jamais essayé** (N7). |
| Coupure USB ou batterie pendant un flash | « protection contre un flash interrompu » | **Jamais essayé** ; pas de procédure (B5). |
| Coupure tension basse toujours désactivée | oui | Code : à chaque écriture et après tout flash AM32. Bluejay : sans objet. **Jamais vérifié au banc sur AM32.** |
| Pas de statistiques, pas de cookies | (nouveau) | **Vrai dans le logiciel corrigé** [CODE] ; faux sur le site (polices Google) et sur `/app/` actuel (v14). |
| Tests automatiques | site : « 375 / 375 » | **450 / 450** (version corrigée) [EXÉCUTÉ, avec bouchon]. |

---

## 5. Périmètre de publication final

| Statut | Contenu |
|---|---|
| **Publié (validé)** — après Q1 et Q2 réussies | Bluejay sur BLS 35A J-H-40 24 kHz : lecture, écriture, reflash avec reprise des réglages, refus de mauvais layout, mélodies ; test moteurs en mode normal ; onglet ESC de TrueGlide Configurator. |
| **Expérimental** (bandeau dans le logiciel et la notice) | BLHeli_S et BLHeli_S → Bluejay (après Q4 réussie) ; AM32 broches PA2, PB4, PA6 (après Q5 réussie) ; tout ESC non listé comme validé. |
| **Désactivé** | Test moteurs en mode 3D (N7) ; broches AM32 PA0, PA15, PB2, PC6 / onglet v15 (B3) ; anciennes versions `/onglet/v1`-`v13` et `/onglet/essai/` (M4). |
| **Hors publication** | Guide BLHeli_32 → AM32 au ST-Link (site d'essai seulement). |

---

## 6. Tests restants à faire par Johann (fiches Q)

Ces fiches remplacent les fiches P du 1er audit (elles ne gardent que ce qui n'est pas encore prouvé).

**Avant toute fiche** : la version corrigée doit être déployée sur le site d'essai (`/test/`) et son commit noté. Les fiches Q1 et Q2 n'ont de valeur que sur **cette** version.

**Règles communes** : **SANS HÉLICES**, drone attaché, radio éteinte sauf indication, main près de la prise de batterie ; noter l'adresse, le commit et l'heure ; à la fin de chaque fiche, « Enregistrer le journal de débogage ». À renvoyer : RÉUSSI / ÉCHEC par étape, le fichier journal, et des captures d'écran (ou photos) pour chaque étape marquée 📷.

### Q1 — Non-régression Bluejay sur la version corrigée (KarRmen)
1. Connecter, brancher la batterie, lire. 📷 des 4 cartes ESC.
2. Changer « Puissance du bip » d'un seul ESC, écrire, débrancher/rebrancher la batterie, relire.
3. Remettre la valeur, écrire.
4. « Installer sur tous » → Bluejay 0.19.2 J-H-40 24 kHz, « Migrer les paramètres ». Attendre la fin. 📷 du journal.
5. Relire : sens des moteurs identiques ?
6. « Installer sur tous » → choisir volontairement un **autre layout** (par ex. J-H-25). 📷 du journal.
- **RÉUSSI** si : 2 conserve la valeur sur ce seul ESC ; 4 affiche « ESC n flashé » ×4 ; 5 sens identiques ; 6 affiche « non flashé : rien n'a été écrit » ×4 et **les boutons restent utilisables** juste après. **ÉCHEC** sinon.

### Q2 — Arrêt des moteurs (version corrigée)
Même déroulé que la fiche P2 du 1er audit (7 étapes : bouton « Déconnecter », fermer l'onglet, recharger, quitter l'onglet ESC de TrueGlide Configurator avec le curseur maître puis avec un seul moteur, décocher « hélices retirées », « Lire les paramètres »). Moteurs lancés à environ 1150 µs à chaque étape.
- En plus : essayer de monter un curseur au maximum → la vitesse ne doit pas dépasser 1300.
- **RÉUSSI** si arrêt en moins d'une seconde aux 7 étapes. **ÉCHEC** au premier moteur qui continue (débrancher la batterie tout de suite). 📷 ou vidéo courte de l'étape « quitter l'onglet ».

### Q3 — Mode 3D (seulement si le mode 3D doit rester disponible)
Comme la fiche P3 du 1er audit. Sinon : vérifier que le test moteurs est bien bloqué en 3D une fois N7 corrigé.

### Q4 — Coupure USB puis batterie pendant un flash (ESC BLHeli_S ou Bluejay **sacrifiable**, sur banc)
Comme les fiches P5 et P10 du 1er audit : couper à environ 30 % puis à environ 80 % de la barre, une fois l'USB, une fois la batterie (4 coupures). Après chaque coupure : rebrancher, lire, 📷 du nom affiché, reflasher **sans** forçage, relire, test moteurs sans hélices.
- **RÉUSSI** si l'ESC est récupéré les 4 fois sans outil extérieur. **ÉCHEC** si un ESC ne répond plus (le garder, ne pas insister). Ces résultats servent à écrire la page de récupération (B5).

### Q5 — AM32 sur SEQURE E130/E160 G2 (banc)
Comme la fiche P6 du 1er audit (lecture, écriture du sens, reflash même version, version plus ancienne puis retour, refus d'un fichier d'un autre processeur, test moteurs). En plus :
- après chaque flash, noter si le journal parle de la coupure tension basse ;
- après le refus, vérifier que **les boutons restent utilisables** (M2) ;
- **seulement si un ESC AM32 sacrifiable est disponible** : débrancher l'USB à environ 50 % d'un flash AM32, attendre 10 s, rebrancher **sans batterie** puis avec batterie : le moteur reste-t-il immobile et silencieux (pas de bips de démarrage normaux) ? Puis relire : nom « FLASH FAIL » ? Reflasher. Cela vérifie ce que la correction B2 suppose du chargeur AM32.
- **RÉUSSI / ÉCHEC** comme P6 ; pour la coupure : RÉUSSI si l'ESC ne démarre pas de firmware et se reflashe.

### Q6 — Octet de broche d'un ESC BLHeli_32 (seulement si la v15 doit revenir un jour)
Comme la fiche P9 du 1er audit.

### Q7 — ESC qui ne répond pas, ESC mélangés
Comme la fiche P7 du 1er audit. À l'étape « ESC d'une autre famille », lancer cette fois « Installer sur tous » **jusqu'au bout** : l'ESC de l'autre famille doit être annoncé « non flashé : rien n'a été écrit » (et non « flash raté », voir N2), puis relu intact.

### Q8 — USB débranché pendant un test moteur (mesure)
Comme la fiche P8 du 1er audit (temps d'arrêt sous TRUEGLIDE, et sous Betaflight si possible).

### Q9 — Ouverture sur un PC vierge
Comme la fiche P1 du 1er audit, sur la version corrigée : en (4), après la page d'accueil, **aucune** adresse `googletagmanager.com` ne doit apparaître, et aucune bannière cookies.

---

## 7. Checklist de publication mise à jour

| Case | État | Preuve |
|---|---|---|
| B1 corrigé et testé | ☑ (code) ☐ (banc Q7) | test + essai C2 |
| B2 corrigé et testé | ☑ (code) ☐ (banc Q5) | test + lecture `FourWay.js:1174-1184` |
| B3 : v15 retirée de tout ce qui est public | ☐ | `/test/`, `/onglet/v15/` en ligne, chargés par TrueGlide Configurator |
| B4 : Q2 réussie sur la version publiée | ☐ | dernière preuve de banc : onglet v13 |
| B5 : page de récupération publiée | ☐ | absente |
| M2 : interface jamais bloquée | ☑ | essais C1, C4 + test |
| Mode 3D bloqué ou Q3 réussie | ☐ | N7 |
| Forçage réservé au mode avancé | ☑ | test FirmwareSelector |
| Q1, Q4, Q7 réussies ; Q5 si AM32 publié | ☐ | aucune fiche faite depuis le 1er audit |
| M1 : firmwares hébergés + SHA-256, ou risque accepté par écrit | ☐ | — |
| Versions « validées TrueGlide » repérées (m1) | ☐ | — |
| Site principal à jour | ☐ | `gh-pages` inchangé |
| Liste des ESC validés publiée | ☐ | — |
| Limites connues publiées (USB / test moteur) | ☐ (logiciel ☑, notice ☐) | `motorControlUnplugBattery` |
| Textes faux corrigés | ☐ (logiciel ☑ en partie, site ☐, N6) | — |
| Avis de non-responsabilité avant le premier flash | ☑ | `flashDisclaimer` |
| Signaler un bug | ☑ | tickets GitHub actifs + adresse e-mail |
| Plus de Google Tag Manager ni bannière cookies | ☑ (logiciel corrigé) ☐ (`/app/` en ligne) | `cookieSlice.js` |
| Polices du site hébergées localement | ☐ | `gh-pages/index.html` |
| Page confidentialité et mentions légales | ☐ | — |
| Avis juridique BLHeli_32, ou BLHeli_32 limité à la détection | ☑ (limité à la détection, flash et copie bloqués) | B1 |
| Lien code source vers le commit exact | ☐ | m4 |
| `/onglet/v1`-`v13` et `/onglet/essai/` retirés | ☐ | M4 |
| Tests réussis avec la vraie dépendance (vérification GitHub) | ☐ NON VÉRIFIÉ ici | codeload bloqué |
| Version corrigée déployée et numérotée | ☐ | N4 ; toujours `0.33.0-dev` |
| Décision de publication écrite de Johann | ☐ | — |

---

## 8. Note de correction (reste BLOQUANT ou MAJEUR)

> **Contre-audit du 06/11/2026 — ce qui reste avant publication publique (TrueGlide ESC Configurator, branche `trueglide/audit-corrections` `d6ec464`)**
>
> Vérifié et accepté : B1 (flash et copie), B2 (code), B4 (code), M2, M10, m3, m9. Les nouveaux tests échouent bien sur `ab3a994`. Merci de ne pas y toucher sans nouveau test.
>
> **BLOQUANTS**
>
> **B3 — v15 toujours en ligne et chargée par TrueGlide Configurator.** Appliquer la décision « v15 hors publication » : faire pointer l'onglet ESC de TrueGlide Configurator (`/app/` et `/test/`) vers une version sans les broches PA0/PA15/PB2/PC6. Ne la remettre qu'après la fiche Q6 et un second indice de reconnaissance AM32 / BLHeli_32 (`src/utils/FourWay.js`, `getInfo`).
>
> **B4 — preuve de banc manquante.** Déployer `d6ec464` (ou la suivante) sur `/test/` et l'onglet d'essai, noter le commit ; Johann fait Q2. Ne plus modifier l'arrêt des moteurs sans refaire Q2.
>
> **B5 — page de récupération.** Après Q4 : page « Récupérer un ESC après un flash raté » (BLHeli_S/Bluejay « FLASH*FAILED », AM32 « FLASH FAIL », ESC muet), lien depuis le journal ; corriger « avec la case de forçage » dans `doc/flash.html`.
>
> **B2 — preuve de banc manquante sur le comportement du chargeur AM32** (l'ESC en « FLASH FAIL » ne doit pas démarrer de firmware) : Q5, étape coupure, si un ESC AM32 sacrifiable est disponible ; sinon, ne pas affirmer ce comportement dans la notice.
>
> **MAJEURS**
>
> **N4 — ce qui est en ligne n'est pas corrigé.** `/app/` = v14 (B1, B2, M2 présents). Bandeau « préversion » sur `/app/` tant que la version corrigée n'y est pas, et numéro de version propre (pas `0.33.0-dev`) affiché dans le logiciel.
>
> **N7 — test moteurs en mode 3D jamais essayé.** Bloquer l'onglet moteurs quand `msp.features['3D']` est vrai (`src/Components/MainContent/index.jsx:134`), avec un message, jusqu'à Q3 réussie. Test automatique.
>
> **M1** firmwares par `cors.bubblesort.me` sans empreinte (`src/utils/Fetch.js:87`) ; **M4** anciens onglets en ligne (accord de Johann) ; **M5** page confidentialité et mentions légales ; **M6** site public périmé (`index.html`, `doc/flash.html`) et affirmations non prouvées sur BLHeli SiLabs / Atmel (`homeDisclaimerTextLine1`) ; **M7** sauvegarde automatique des réglages avant flash ; **M8** notice `doc/moteurs.html` (USB débranché) ; **M9** tests des étapes d'écriture et de protection de `FourWay.js` (45 %) ; **M3** polices Google du site.
>
> **Mineurs signalés (non obligatoires pour une bêta)** : N1 (sauter explicitement les ESC BLHeli_32 dans l'écriture des réglages, les mélodies et les valeurs par défaut), N2 (trois messages distincts au lieu de « flash raté » partout), N3 (message pour Atmel), N5 (remettre le forçage à faux quand la case est cachée).

---

## Annexe — Reproduire

```bash
git fetch origin trueglide/audit-corrections
git archive origin/trueglide/audit-corrections | tar -x -C <dossier de travail>
# dans le dossier de travail (web-serial-polyfill remplacé par un bouchon si codeload est bloqué)
YARN_IGNORE_ENGINES=true yarn install --ignore-scripts
CI=true npx react-scripts test --watchAll=false            # 450 / 450
npx --no-install eslint ./src --ext .jsx,.js               # 0 erreur
```

Essais C1 à C6 : copier `docs/audit/essais-contre-audit.test.jsx.txt` en `src/audit/contre.test.jsx` dans le dossier de travail, puis `CI=true npx react-scripts test --watchAll=false src/audit`. Résultats du 06/11/2026 :

```
C1 refus AM32 : exception = aucune | isFlashing = faux | writeHex appelé 0 fois
C2 AM32 + BLHeli_32, « Installer sur tous » : flash demandé pour l'ESC [0] seulement
C3 AM32 + BLHeli_32, « Écrire » : autorisé ; écriture demandée pour les ESC [0, 1]
C4 erreur « interface inconnue » : exception = aucune | isFlashing = faux | aucun message utilisateur
C5 bornage : 2000→1300, 1900→1300, 0→1000 ; en 3D 1000→1350, 2000→1650
C6 écriture des réglages sur une fiche BLHeli_32 : arrêt sur erreur (TypeError), 0 écriture
```

Vérification « les nouveaux tests échouent sur l'ancienne version » : copier les 4 fichiers de test modifiés de `d6ec464` (`src/Containers/App/__tests__/index.test.jsx`, `src/utils/__tests__/FourWay.test.js`, `src/Components/FirmwareSelector/__tests__/index.test.jsx`, `src/Components/MainContent/__tests__/index.test.jsx`) et les traductions dans une copie de `ab3a994`, puis lancer ces tests : 13 échecs sur 80.
