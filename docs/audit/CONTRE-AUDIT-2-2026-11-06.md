# Contre-audit n° 2 avant publication publique — TrueGlide ESC Configurator

Date : 6 novembre 2026 (fin de soirée)
Version contrôlée : branche `trueglide/audit-corrections`, commit **`168ddf6`** (12 commits depuis `master` `ab3a994`).
Version précédemment contrôlée : `d6ec464` (contre-audit n° 1, `docs/audit/CONTRE-AUDIT-2026-11-06.md`).
Version en ligne aujourd'hui : **inchangée** — `gh-pages` `a16fd86` : `/app/` = v14 (`ab3a994`), `/test/` et `/onglet/v15/` = v15 (`2282c46`).

Rien n'est repris de confiance : ni des rapports précédents, ni du développement. Chaque statut ci-dessous a été revérifié sur `168ddf6`.

Légende : **[EXÉCUTÉ]** vérifié en faisant tourner le logiciel, ses tests ou sa compilation ; **[CODE]** vérifié en lisant le code ; **[BANC]** prouvé par un essai de Johann avec preuve jointe ; **NON VÉRIFIABLE SANS MATÉRIEL** : fiche Q associée.

---

## 0. Reçu / manquant

| Élément | Reçu ? | Remarque |
|---|---|---|
| Rapport du 1er audit, note de correction | oui | `docs/audit/CONTROLE-PUBLICATION-2026-11-06.md` |
| Contre-audit n° 1 et sa note | oui | `docs/audit/CONTRE-AUDIT-2026-11-06.md`, transmise à la session de développement |
| Corrections annoncées | **par les messages de commit seulement** | 9 nouveaux commits : M7, M1, M9, B5 (partie logiciel), m2, m6, m4, m5, m1. Pas de message récapitulatif. |
| Nouvelle version publique (code) | oui | `168ddf6` ; numéro toujours `0.33.0-dev` |
| Nouvelle version publique (fichiers en ligne) | **non** | rien n'a été déployé : ce qui est en ligne est la v14 et la v15, déjà contrôlées |
| Ancienne version | oui | `ab3a994` et `d6ec464` |
| Changelog, documentation publique | **en partie** | `src/changelog.json` et `README.md` réécrits ; **site `gh-pages` inchangé** |
| Résultats de banc (fiches P ou Q) | **non** | seule preuve de banc : TGE-P1 (31/10-01/11), sur des versions antérieures (`be3807a`, onglets v12/v13) |
| ESC validés au banc | oui | 4 × BLS 35A, Bluejay 0.19.2, J-H-40, 24 kHz, sur KarRmen (SpeedyBee F405 Mini, TRUEGLIDE) |
| Tableau d'état | non | reconstruit en section 4 |

### Exécuté ici

| Action | Résultat |
|---|---|
| Tests automatiques `168ddf6` | **490 / 490 réussis** (47 fichiers) [EXÉCUTÉ] |
| Lint | 0 erreur, 29 avertissements de style [EXÉCUTÉ] |
| Compilation de la version publique | réussie [EXÉCUTÉ] |
| Couverture | `FourWay.js` (flash) **71,6 %** (45,4 % avant) ; `Containers/App` 55,4 % ; `FirmwareIntegrity.js` 100 % ; `SettingsBackup.js` 93 % [EXÉCUTÉ] |
| Empreinte SHA-256 du firmware validé | le fichier `J_H_40_24_v0.19.2.hex`, téléchargé ici **directement chez Bluejay** (GitHub, 15 179 octets), a l'empreinte `0fbfc678…db0ff4c2` : **identique** à celle inscrite dans le logiciel [EXÉCUTÉ] |
| Essais C1 à C6 (contre-audit n° 1) rejoués sur `168ddf6` | résultats identiques : C1, C2, C5 bons ; C3 et C6 (N1) et C4 (N3) inchangés [EXÉCUTÉ] |
| Recherche de fonctions cachées dans les fichiers livrés | voir section 3.3 [EXÉCUTÉ] |
| Dépendances | `sleep` retirée (`package.json`, `yarn.lock`) ; aucune ajoutée [EXÉCUTÉ] |

Même réserve que précédemment : la dépendance `web-serial-polyfill` reste refusée ici (codeload, 403) et a été remplacée par un bouchon pour les tests et la compilation. Résultat avec la vraie dépendance : **NON VÉRIFIÉ** (vérification GitHub à regarder).

---

## 1. VERDICT

### **PAS PUBLIABLE** — comme au 1er audit et au contre-audit n° 1.

En clair :

- **Le logiciel lui-même a beaucoup progressé.** Les firmwares validés sont maintenant contrôlés par empreinte (et l'empreinte est juste). Les réglages sont sauvegardés dans un fichier avant chaque flash et peuvent être rechargés. Les étapes de flash BLHeli_S/Bluejay sont enfin couvertes par des tests qui simulent un flash raté. Aucune fonction cachée ou en développement n'a été trouvée dans les fichiers livrés.
- **Mais quatre points bloquent encore :**
  1. **Ce qui est en ligne n'est toujours pas corrigé** (rien n'a été déployé), et l'onglet v15 « en essai » (broches AM32 non essayées, B3) est **chargé par TrueGlide Configurator** : c'est une fonction non validée présente dans la version publique.
  2. **La page de récupération n'existe pas** : le logiciel envoie maintenant l'utilisateur vers `doc/recuperation.html`, qui renvoie une erreur 404 (B5).
  3. **Le test moteurs en mode 3D est toujours actif** sans avoir jamais été essayé (N7, relevé à BLOQUANT selon votre règle).
  4. **Aucune preuve de banc depuis le 1er audit** : l'arrêt des moteurs (B4) a changé trois fois depuis le seul essai réussi, et ce que la correction B2 suppose du chargeur AM32 n'est pas prouvé.

### Ce qu'il faut pour « PUBLIABLE EN BÊTA »

1. Retirer v15 de tout ce qui est public, ou faire Q6 + second indice (B3).
2. Bloquer le test moteurs en mode 3D (N7).
3. Déployer `168ddf6` (ou la suivante) sur `/test/` et l'onglet d'essai, puis réussir **Q1, Q2, Q3** (non-régression Bluejay, arrêt des moteurs, sauvegarde/rechargement).
4. Réussir **Q5** (coupure USB et batterie pendant un flash, ESC sacrifiable) et publier la page `doc/recuperation.html` à partir de ses résultats (B5).
5. Mettre le site public à jour (M6, M8, liste des ESC validés) et ajouter la page confidentialité (M5).

---

## 2. Suivi des constats

### 2.1 Constats du 1er audit

| N° | Problème | Gravité | Statut | Preuve | Ce qui reste à faire |
|---|---|---|---|---|---|
| B1 | ESC BLHeli_32 flashable dans un drone mélangé | BLOQUANT | **CORRIGÉ** (flash, copie) | [EXÉCUTÉ] essai C2 + test du développement ; `isFlashBlocked` (`src/utils/helpers/Settings.js:169`), `flashTargets`, `handleFirmwareDump`, boutons ESC | Écriture des réglages / mélodies / valeurs par défaut : N1 (mineur). Banc : Q7. |
| B2 | Flash AM32 annoncé réussi malgré une vérification ratée | BLOQUANT | **CORRIGÉ dans le code / effet NON VÉRIFIABLE** | [CODE] `flashArm` relance l'erreur (`src/utils/FourWay.js`, bloc `verifyPages` dans `flashArm`) ; test réussi | Prouver au banc que l'ESC en « FLASH FAIL » ne démarre pas de firmware (Q8, ESC AM32 sacrifiable). |
| B3 | v15 : BLHeli_32 pris pour AM32 | BLOQUANT | **NON CORRIGÉ — exposé** | `gh-pages` inchangé : `/test/`, `/onglet/v15/` en ligne, chargés par TrueGlide Configurator (selon les éléments fournis) | Retirer v15 du public. |
| B4 | Arrêt des moteurs à la déconnexion | BLOQUANT | **CORRIGÉ dans le code / NON VÉRIFIABLE** | [CODE] `handleDisconnect` ; test réussi | Q2 sur la version déployée. |
| B5 | Pas de procédure de récupération | BLOQUANT | **PARTIEL** | [CODE] après un flash raté, le journal donne le lien `…/doc/recuperation.html` (`flashRecoveryHelp`, `src/translations/fr/log.json`) ; README le cite aussi. **La page n'existe pas** dans `gh-pages` (seules 7 pages `doc/*.html`, sans `recuperation.html`). | Écrire et publier la page (après Q5) ; corriger « avec la case de forçage » dans `doc/flash.html`. |
| M1 | Firmwares via relais tiers, sans empreinte | MAJEUR | **PARTIEL** | [CODE] `src/utils/FirmwareIntegrity.js` : 1 firmware validé, SHA-256 contrôlé avant flash, fichier altéré refusé et retiré du cache (`handleFlashUrl`) ; [EXÉCUTÉ] empreinte conforme au fichier officiel ; tests 100 %. | Tous les autres firmwares passent encore par `cors.bubblesort.me` **sans contrôle** (avertissement seulement). La copie TrueGlide (`/firmwares/`) n'est pas en ligne : le logiciel retombe sur le relais, mais l'empreinte reste contrôlée. Ajouter chaque version validée au banc ; publier `/firmwares/`. |
| M2 | Interface bloquée après un refus | MAJEUR | **CORRIGÉ** | [EXÉCUTÉ] C1, C4 | Message Atmel : N3. |
| M3 | Google Tag Manager, cookies, polices Google | MAJEUR | **PARTIEL** | [CODE] GTM jamais démarré, bannière retirée ; [EXÉCUTÉ] la bibliothèque GTM reste dans le fichier livré mais n'est jamais appelée pour charger le script Google | Polices Google du site ; retirer la bibliothèque (R4). |
| M4 | Anciens onglets `/onglet/v1`-`v13`, `/onglet/essai/` | MAJEUR | **NON CORRIGÉ** | `gh-pages` inchangé | Accord de Johann, puis retrait. |
| M5 | Confidentialité, mentions légales, non-responsabilité | MAJEUR | **PARTIEL** | [CODE] avis « sans garantie » à l'accueil, au flash, dans le README | Page confidentialité et mentions légales absentes. |
| M6 | Textes faux ou périmés | MAJEUR | **PARTIEL** | logiciel corrigé en partie | Site public inchangé (« 0.32.1 », « 375 tests », « essais pas encore faits », forçage du processeur) ; N6. |
| M7 | Pas de sauvegarde avant flash | MAJEUR | **CORRIGÉ dans le code / NON VÉRIFIABLE** | [CODE] `saveSettingsBackup` appelé au début de chaque flash (`src/Containers/App/index.jsx`, `flash`) ; fichier JSON téléchargé ; bouton « Recharger des réglages sauvegardés » (`Buttonbar`) qui n'écrit que sur l'ESC de même position, même firmware, même layout, jamais sur un BLHeli_32 (`src/utils/SettingsBackup.js`) ; tests | Vérifier dans Chrome et dans TrueGlide Configurator que le fichier est bien enregistré (Q3). Nouvelle fonction : constat R3. |
| M8 | USB débranché pendant le test moteur | MAJEUR | **PARTIEL** | phrase dans le logiciel | Notice `doc/moteurs.html` ; firmware TRUEGLIDE ; mesure Q10. |
| M9 | Cœur du flash peu testé | MAJEUR | **CORRIGÉ** (BLHeli_S/Bluejay) | [EXÉCUTÉ] `FourWay.js` 71,6 % ; 8 nouveaux tests sur un ESC simulé (`src/utils/__tests__/FourWaySiLabsFlash.test.js`) : écriture complète sans toucher au chargeur, vérification ratée → ESC récupérable, ESC « **FLASH*FAILED** » reflashé sans forçage, échec des protections, mauvais MCU, mauvais fichier | Flash AM32 (`flashArm`) moins couvert ; à compléter sans urgence. |
| M10 | Forçage accessible à tous | MAJEUR | **CORRIGÉ** | test FirmwareSelector | N5 (mineur). |
| m1 | Versions non validées proposées | MINEUR | **CORRIGÉ** | [CODE] note « version validée » / « non validée, à vos risques » (`FirmwareSelector`) ; tests | — |
| m2 | Nom de fichier AM32 accepté trop facilement | MINEUR | **CORRIGÉ** | [CODE] nom complet exigé (`/^[A-Z0-9]+(_[A-Z0-9]+)+$/`, `src/utils/FourWay.js`, `getInfo`) ; tests | — |
| m3 | Vitesses bornées seulement à l'écran | MINEUR | **CORRIGÉ** | [EXÉCUTÉ] C5 | — |
| m4 | Commit de chaque version | MINEUR | **CORRIGÉ dans le code** | [CODE] barre d'état : version + lien vers le commit (`Statusbar`) si la compilation passe par `yarn build` | Vérifier sur la version déployée (Q4). |
| m5 | README et changelog d'origine | MINEUR | **CORRIGÉ** | README et changelog TrueGlide | Le changelog annonce une page de récupération absente et des ESC mélangés « gérés ESC par ESC » (vrai pour le flash, pas pour l'écriture : N1). |
| m6 | `sleep`, Node 18 | MINEUR | **CORRIGÉ** | dépendance retirée, vérification GitHub en Node 22 | — |
| m7 | Alertes de dépendances | MINEUR | NON CORRIGÉ | inchangé (hors `sleep`) | — |
| m8 | TODO Bluejay | MINEUR | NON CORRIGÉ | sans conséquence | — |
| m9 | Coupure tension basse après flash AM32 | MINEUR | **CORRIGÉ dans le code** | test | Banc : Q8. |

### 2.2 Constats du contre-audit n° 1

| N° | Problème | Gravité | Statut | Preuve |
|---|---|---|---|---|
| N1 | Écriture des réglages / mélodies / valeurs par défaut adressée à un ESC BLHeli_32 (protégé par accident) | MINEUR | **NON CORRIGÉ** | [EXÉCUTÉ] C3, C6 inchangés |
| N2 | « Flash raté : ne pas utiliser cet ESC » même quand rien n'a été écrit | MINEUR | **NON CORRIGÉ** | `flashingEscFailed` inchangé |
| N3 | Atmel : aucun message | MINEUR | **NON CORRIGÉ** | [EXÉCUTÉ] C4 |
| N4 | Ce qui est en ligne n'est pas corrigé | MAJEUR | **NON CORRIGÉ** | `gh-pages` `a16fd86` |
| N5 | Forçage peut-être conservé quand la case est cachée | MINEUR | **NON CORRIGÉ** | `FirmwareSelector` : `force` jamais remis à faux |
| N6 | Affirmations non prouvées (BLHeli SiLabs, Atmel) | MINEUR | **NON CORRIGÉ** | `homeDisclaimerTextLine1` |
| N7 | Test moteurs en 3D jamais essayé, toujours actif | MAJEUR → **BLOQUANT** | **NON CORRIGÉ** | `src/Components/MainContent/index.jsx:135` inchangé. Relevé à BLOQUANT : fonction non validée, qui commande des moteurs, activable dans la version publique. |
| N8 | `resultats.md` TGE-P1 périmé | INFO | NON CORRIGÉ | ligne 42 |

---

## 3. Nouveaux constats

### 3.1 Régressions

Aucune régression trouvée [CODE + EXÉCUTÉ] sur ce qui a été validé au banc (lecture, écriture, reflash Bluejay, refus de layout, test moteurs en mode normal) : les nouveaux tests BLHeli_S/Bluejay sur ESC simulé reproduisent les étapes de flash utilisées le 31/10, et tous les anciens tests passent. Le chemin de flash a toutefois gagné trois étapes (sauvegarde, contrôle d'empreinte, lien de récupération) : **Q1 reste nécessaire** pour le prouver sur matériel.

### 3.2 Nouvelles fonctions (auditées entièrement)

| N° | Gravité | Problème | Risque concret | Emplacement | Correction |
|---|---|---|---|---|---|
| **R1** | **MAJEUR** | Le lien de récupération et le README envoient vers une page **qui n'existe pas** (`doc/recuperation.html`, erreur 404). | Juste après un flash raté, l'utilisateur ne trouve rien : c'est le moment où il a le plus besoin d'aide. | `src/translations/fr/log.json` (`flashRecoveryHelp`) ; `README.md` ; `gh-pages/doc/` | Publier la page avant (ou en même temps que) cette version. Voir B5. |
| R3 | MINEUR | « Recharger des réglages sauvegardés » écrit les valeurs du fichier **sans vérifier les plages** de chaque réglage (seulement le type et la taille d'octet). Un fichier modifié à la main, ou venant d'une version aux plages différentes, peut écrire une valeur que l'écran refuserait. La coupure tension basse reste, elle, toujours forcée à « désactivée ». | Réglage hors limites (puissance de démarrage, timing…) écrit sans avertissement. | `src/utils/SettingsBackup.js`, `getRestoredSettings` | Contrôler chaque valeur avec les mêmes bornes que l'écran ; ignorer (avec une ligne au journal) celles qui sont hors plage. |
| R4 | MINEUR | La bibliothèque Google Tag Manager reste dans le fichier livré (adresses `googletagmanager.com` présentes) ; elle n'est plus jamais démarrée. | Aucun aujourd'hui ; une modification future pourrait la réactiver. | `package.json` (`react-gtm-module`) ; appels `TagManager.dataLayer` dans `src/Containers/App/index.jsx` | Retirer la bibliothèque et ses appels. |
| R5 | INFO | La copie TrueGlide des firmwares (`/firmwares/…`) n'est pas en ligne ; le logiciel la cherche puis retombe sur le relais tiers. L'empreinte reste contrôlée : un fichier altéré est refusé. | Aucun pour l'intégrité ; dépendance au relais tiers inchangée. | `src/utils/FirmwareIntegrity.js:15` | Publier `firmwares/bluejay/v0.19.2/J_H_40_24_v0.19.2.hex` sur `gh-pages`. |
| R6 | INFO | Sauvegarde automatique : le fichier est proposé au téléchargement par le navigateur. Selon le navigateur ou l'intégration dans TrueGlide Configurator, il peut être bloqué ou demander une confirmation. Si c'est impossible, le journal le dit et le flash continue. | Utilisateur qui croit avoir une sauvegarde sans l'avoir. NON VÉRIFIÉ. | `src/utils/SettingsBackup.js`, `downloadBackup` | Q3. |

### 3.3 Recherche de fonctions non validées dans l'exécutable public [EXÉCUTÉ]

Fichiers examinés : la version compilée ici depuis `168ddf6`, et les fichiers réellement en ligne `/app/`, `/test/`, `/onglet/v14/`, `/onglet/v15/`.

| Recherche | Résultat |
|---|---|
| Firmware « XPro », dépôts XPro, procédure usine | **absent** partout (0 occurrence de « XPro », « usine ») |
| Remplacement ou mise à jour du chargeur (bootloader) | **absent** : aucune fonction d'écriture du chargeur ; les seules mentions du chargeur AM32 sont des liens vers ses instructions (ST-Link, hors logiciel). La protection « LJMP » BLHeli_S écrit dans la zone du firmware, jamais dans le chargeur (test `should write and verify the whole firmware, never the bootloader`). |
| Menu caché, raccourci clavier, option dans l'adresse de la page, variable de compilation | **aucun** : pas de lecture de l'adresse (`location.search`, `hash`), pas de raccourci clavier ; seule variable de compilation : le commit affiché. |
| Réglages stockés dans le navigateur | seulement les réglages visibles de l'écran « Paramètres » (mode avancé, versions instables, etc.), la langue, le journal, les mélodies. Rien d'autre n'est activable. |
| Fonctions **en essai** présentes dans la version publique | **oui** : broches AM32 PA0/PA15/PB2/PC6 dans `/test/` et `/onglet/v15/` (B3) ; **test moteurs en mode 3D** dans toutes les versions (N7). |
| Fonctions jamais essayées au banc mais présentes | flash BLHeli_S, AM32, copie du firmware (mode avancé) : fonctions reprises du projet d'origine, signalées « non validées » au choix du firmware (m1). À afficher comme « expérimental » (section 5). |

---

## 4. Tableau d'état corrigé (annoncé / réel), `168ddf6`

| Fonction | Annoncé (changelog, README, logiciel) | Réel |
|---|---|---|
| Lecture, écriture Bluejay | oui | **[BANC]** TGE-P1 sur version antérieure ; Q1 à refaire sur `168ddf6`. |
| Reflash Bluejay 0.19.2 J-H-40 avec reprise des réglages | oui | **[BANC]** TGE-P1 (journal 31/10 21:47) ; Q1. |
| Empreinte SHA-256 des firmwares validés | « vérifiée » | **Vrai** pour 1 fichier (Bluejay 0.19.2 J-H-40 24 kHz) [EXÉCUTÉ] ; tous les autres : non contrôlés, avertissement. |
| Sauvegarde des réglages avant flash, rechargement | oui | Code et tests OK ; jamais essayé dans un navigateur réel (Q3). |
| Lien vers la page de récupération | « lien vers la page de récupération » | **Faux pour l'instant** : page absente (R1). |
| Refus d'un mauvais layout | oui | **[BANC]** TGE-P1 (01/11 11:08). |
| Flash BLHeli_S, BLHeli_S → Bluejay | oui | **Jamais essayé.** Tests sur ESC simulé seulement. |
| Flash AM32 | oui | **Jamais essayé.** |
| ESC mélangés « gérés ESC par ESC » | changelog | Vrai pour le flash et la copie ; pas pour l'écriture des réglages (N1). Jamais essayé. |
| Test moteurs mode normal, 30 % | oui | **[BANC]** TGE-P1 6.1-6.6 (déclaratif, captures non jointes) ; bornage aussi avant l'envoi [EXÉCUTÉ]. |
| Arrêt des moteurs en quittant / déconnectant / lisant | oui | **[BANC]** sur l'onglet v13 seulement ; mécanisme modifié depuis : Q2. |
| Test moteurs mode 3D | 1350-1650 µs | **Jamais essayé**, toujours actif (N7). |
| Coupure USB / batterie pendant un flash | « protection contre un flash interrompu » | Tests sur ESC simulé OK [EXÉCUTÉ] ; **jamais essayé au banc** (Q5). |
| Coupure tension basse désactivée | oui | Code et tests ; jamais vérifié au banc sur AM32. |
| Version et commit dans la barre d'état | oui | Code OK ; à vérifier sur la version déployée (Q4). |
| Aucune statistique, aucun cookie | README | Vrai dans `168ddf6` ; faux sur le site (polices Google) et sur `/app/` en ligne (v14). |
| Tests automatiques | site : « 375 / 375 » | **490 / 490** [EXÉCUTÉ, avec bouchon]. |

---

## 5. Périmètre de publication final

| Statut | Contenu |
|---|---|
| **Publié (validé)** — après Q1, Q2, Q3 réussies | Bluejay 0.19.2 J-H-40 24 kHz sur BLS 35A : lecture, écriture, reflash avec reprise des réglages, refus de mauvais layout, mélodies, sauvegarde/rechargement des réglages ; test moteurs en mode normal ; onglet ESC de TrueGlide Configurator. |
| **Expérimental** (bandeau visible dans le logiciel et la notice) | Autres versions Bluejay ; BLHeli_S et BLHeli_S → Bluejay (après Q5) ; AM32 broches PA2, PB4, PA6 (après Q8) ; copie du firmware (mode avancé). |
| **Désactivé** | Test moteurs en mode 3D (N7) ; broches AM32 PA0, PA15, PB2, PC6 et onglet v15 (B3) ; anciens onglets `v1`-`v13`, `/onglet/essai/` (M4). |
| **Hors publication** | Guide BLHeli_32 → AM32 au ST-Link. |

---

## 6. Tests restants pour Johann (fiches Q)

**Préalable obligatoire** : la session de développement déploie `168ddf6` (ou la suivante) sur `/test/` et sur l'onglet d'essai de TrueGlide Configurator, et donne le commit. Toutes les fiches se font sur **cette** version ; le commit est visible dans la barre d'état en bas (Q4).

**Règles communes** : **SANS HÉLICES**, drone attaché, radio éteinte sauf mention contraire, main près de la prise de batterie ; noter adresse, commit, heure ; à la fin, « Enregistrer le journal de débogage ». À renvoyer : RÉUSSI / ÉCHEC par étape, le journal, les captures 📷 demandées.

### Q1 — Non-régression Bluejay (KarRmen) + retour arrière
1. Connecter, lire. 📷 des 4 cartes ESC.
2. Changer « Puissance du bip » d'un seul ESC, écrire, débrancher/rebrancher la batterie, relire ; remettre la valeur, écrire.
3. « Installer sur tous » → Bluejay **0.19.2** J-H-40 24 kHz. 📷 de l'écran de choix : la note « **Version validée par TrueGlide** » doit apparaître. « Migrer les paramètres », installer. 📷 du journal : « empreinte SHA-256 vérifiée », « réglages … sauvegardés … fichier … », « ESC n flashé » ×4.
4. Relire : sens des moteurs identiques.
5. **Retour arrière** : flasher une autre version Bluejay (par ex. 0.21.0) — la note « **non validée** » doit apparaître —, relire, test moteurs (sens), puis revenir en 0.19.2 et relire.
6. Refus : choisir un autre layout (J-H-25). Journal : « non flashé : rien n'a été écrit » ×4 ; les boutons restent utilisables.
- **RÉUSSI** si tout est conforme et que les ESC finissent en 0.19.2 avec leurs réglages. **ÉCHEC** sinon.

### Q2 — Arrêt des moteurs
Les 7 étapes de la fiche P2 du 1er audit (bouton « Déconnecter », fermer l'onglet, recharger, quitter l'onglet ESC de TrueGlide Configurator — curseur maître puis un seul moteur —, décocher « hélices retirées », « Lire les paramètres »), moteurs à environ 1150 µs. En plus : curseur au maximum → pas plus de 1300.
- **RÉUSSI** si arrêt en moins d'une seconde aux 7 étapes. **ÉCHEC** au premier moteur qui continue (batterie débranchée aussitôt). 📷 ou vidéo de l'étape « quitter l'onglet ».

### Q3 — Sauvegarde et rechargement des réglages
1. Dans le logiciel seul : lancer un flash (Q1 étape 3). Vérifier dans le dossier Téléchargements la présence de `trueglide-esc-reglages_….json`. 📷.
2. Refaire un flash **depuis l'onglet ESC de TrueGlide Configurator** : le fichier est-il aussi enregistré ? 📷 ou « non ».
3. Changer le sens d'un moteur, écrire. Puis « Recharger des réglages sauvegardés » → choisir le fichier de l'étape 1. Relire : le sens d'origine est revenu ? Journal : « réglages rechargés » ×4.
4. Choisir un fichier qui n'est pas une sauvegarde (par ex. le journal) → « rien n'a été écrit ».
- **RÉUSSI** si 1, 3, 4 conformes ; 2 noté (s'il échoue, je le classerai MAJEUR pour l'onglet intégré).

### Q4 — Ouverture sur un PC vierge
Fiche P1 du 1er audit, sur la version déployée. En plus : 📷 de la barre d'état (version + commit cliquable vers GitHub). Dans l'onglet Réseau, **aucune** adresse `googletagmanager.com`, aucune bannière cookies.
- **RÉUSSI** si connexion OK sur Chrome et Edge, aucune adresse Google, commit affiché. **ÉCHEC** sinon.

### Q5 — Coupure USB puis batterie pendant un flash (ESC BLHeli_S ou Bluejay **sacrifiable**)
Fiches P5 et P10 du 1er audit : 4 coupures (USB à 30 % et 80 %, batterie à 30 % et 80 %). Après chaque coupure : rebrancher, lire, 📷 du nom, reflasher **sans** forçage, relire, test moteurs. Noter si le journal affiche le lien de récupération.
- **RÉUSSI** si l'ESC est récupéré les 4 fois sans outil extérieur. **ÉCHEC** si un ESC ne répond plus (le garder). Ces résultats servent à écrire `doc/recuperation.html`.

### Q6 — Recherche de fonctions non validées dans le logiciel en ligne
1. Ouvrir la version déployée. Parcourir **tous** les menus, l'écran « Paramètres » (cocher chaque option une par une), l'écran de flash avec et sans « mode avancé ». 📷 de chaque écran.
2. Vérifier qu'aucun bouton ou texte ne parle de : chargeur / bootloader à installer, XPro, usine, BLHeli_32 à flasher.
3. Avec la carte connectée en **mode 3D** activé (si N7 est corrigé) : l'onglet moteurs doit être bloqué avec un message.
- **RÉUSSI** si rien de tel n'apparaît. **ÉCHEC** sinon (📷).

### Q7 — ESC non reconnu, ESC qui ne répond pas, ESC mélangés
Fiche P7 du 1er audit. À l'étape « ESC d'une autre famille », lancer « Installer sur tous » jusqu'au bout : l'ESC différent doit être « non flashé : rien n'a été écrit » puis relu intact. Si un ESC BLHeli_32 est disponible : vérifier que ses boutons « Flasher » sont grisés.
- **RÉUSSI / ÉCHEC** comme P7.

### Q8 — AM32 sur SEQURE E130/E160 G2
Fiche P6 du 1er audit (lecture, écriture du sens, reflash, version plus ancienne et retour, refus d'un fichier d'un autre processeur, test moteurs). En plus : boutons utilisables après le refus ; sauvegarde enregistrée avant chaque flash ; **si un ESC AM32 sacrifiable existe**, coupure USB à 50 % puis rebranchement : l'ESC ne doit pas démarrer de firmware (pas de bips de démarrage normaux), s'afficher « FLASH FAIL » et se reflasher.

### Q9 — Octet de broche d'un ESC BLHeli_32 (seulement si la v15 doit revenir)
Fiche P9 du 1er audit.

### Q10 — USB débranché pendant un test moteur (mesure)
Fiche P8 du 1er audit.

---

## 7. Checklist de publication

| Case | État | Preuve |
|---|---|---|
| B1 : flash et copie décidés ESC par ESC | ☑ code ☐ banc | C2, test ; Q7 |
| B2 : flash AM32 raté annoncé raté, ESC non redémarré | ☑ code ☐ banc | test ; Q8 |
| B3 : v15 retirée du public | ☐ | `gh-pages` `a16fd86` |
| B4 : arrêt des moteurs prouvé sur la version publiée | ☐ | Q2 non faite |
| B5 : page de récupération publiée | ☐ | lien présent, page 404 |
| N7 : test moteurs bloqué en 3D (ou Q-3D réussie) | ☐ | `MainContent/index.jsx:135` |
| Aucune fonction en développement dans l'exécutable public | ☐ | v15 et 3D (section 3.3) ; aucun chargeur / XPro / usine ☑ |
| M2 : interface jamais bloquée | ☑ | C1, C4 |
| M7 : sauvegarde avant flash | ☑ code ☐ banc | tests ; Q3 |
| M9 : flash BLHeli_S/Bluejay testé sur ESC simulé | ☑ | 8 tests, 71,6 % |
| M10 : forçage en mode avancé | ☑ | test |
| M1 : empreinte des firmwares validés | ☑ (1 fichier, empreinte vérifiée ici) ☐ (copie `/firmwares/` en ligne, autres versions) | `FirmwareIntegrity.js` |
| Versions validées signalées (m1) | ☑ | `FirmwareSelector` |
| Q1, Q2, Q3, Q5, Q7 réussies (Q8 si AM32 publié) | ☐ | aucune fiche renvoyée |
| Version déployée et numérotée, commit affiché | ☐ | rien déployé ; `0.33.0-dev` |
| Site public à jour, liste des ESC validés | ☐ | `gh-pages` inchangé |
| Limites connues publiées (USB / test moteur) | ☐ logiciel ☑ notice ☐ | — |
| Avis de non-responsabilité | ☑ | accueil, flash, README |
| Page confidentialité, mentions légales | ☐ | — |
| Polices du site hébergées localement | ☐ | `gh-pages/index.html` |
| Pas de Google Tag Manager | ☑ code ☐ `/app/` en ligne | — |
| Code source exact lié (AGPL) | ☑ code ☐ déployé | `Statusbar` |
| BLHeli_32 limité à la détection | ☑ | B1 |
| Anciens onglets retirés | ☐ | M4 |
| Tests réussis avec la vraie dépendance (vérification GitHub) | ☐ NON VÉRIFIÉ ici | codeload bloqué |
| Décision écrite de Johann | ☐ | — |

---

## 8. Note de correction (reste BLOQUANT ou MAJEUR)

> **Contre-audit n° 2 du 06/11/2026 — TrueGlide ESC Configurator, `trueglide/audit-corrections` `168ddf6`**
>
> Vérifié et accepté depuis le contre-audit n° 1 : M7 (code), M9, m1, m2, m4 (code), m5, m6 ; M1 en partie (empreinte du fichier validé conforme au fichier officiel). Tests 490/490, lint 0 erreur.
>
> **BLOQUANTS**
>
> 1. **B3 — v15 dans le public.** `/test/` et `/onglet/v15/` (broches AM32 PA0/PA15/PB2/PC6, jamais essayées) sont en ligne et chargés par TrueGlide Configurator. Les retirer / faire pointer l'onglet ESC vers la version corrigée sans v15.
> 2. **N7 — test moteurs en mode 3D.** Jamais essayé, toujours actif (`src/Components/MainContent/index.jsx:135`). Bloquer l'onglet moteurs quand `msp.features['3D']` est vrai, avec un message ; test automatique.
> 3. **B5 / R1 — page de récupération absente.** Le journal (`flashRecoveryHelp`) et le README pointent vers `doc/recuperation.html`, qui n'existe pas. Publier la page (rédigée à partir de Q5) ; corriger « avec la case de forçage » dans `doc/flash.html`.
> 4. **B4 / B2 — preuves de banc.** Déployer `168ddf6` (ou la suivante) sur `/test/` et l'onglet d'essai, donner le commit ; Johann fait Q1, Q2, Q3, puis Q5 et Q8.
>
> **MAJEURS**
>
> - **N4** : rien n'est déployé ; `/app/` = v14. Après Q1/Q2 réussies, déployer avec un vrai numéro de version ; d'ici là, bandeau « préversion » sur `/app/`.
> - **M1** : publier `/firmwares/bluejay/v0.19.2/J_H_40_24_v0.19.2.hex` sur `gh-pages` ; ajouter chaque version validée au banc ; les autres restent « non contrôlées ».
> - **M3** : polices Google du site ; retirer `react-gtm-module` (R4, mineur).
> - **M4** : retrait des anciens onglets (accord de Johann).
> - **M5** : page confidentialité et mentions légales.
> - **M6** : site public périmé ; affirmations BLHeli SiLabs / Atmel (`homeDisclaimerTextLine1`).
> - **M8** : `doc/moteurs.html` (USB débranché pendant le test moteur).
>
> **Mineurs (non obligatoires pour une bêta)** : N1 (sauter les ESC `isFlashBlocked` dans l'écriture, les mélodies, les valeurs par défaut), N2 (messages distincts), N3 (Atmel), N5 (forçage remis à faux), N6, R3 (bornes des réglages au rechargement d'une sauvegarde).

---

## Annexe — Reproduire

```bash
git fetch origin trueglide/audit-corrections
git archive origin/trueglide/audit-corrections | tar -x -C <dossier>
cd <dossier>
YARN_IGNORE_ENGINES=true yarn install --ignore-scripts   # web-serial-polyfill : bouchon si codeload bloqué
CI=true npx react-scripts test --watchAll=false --coverage   # 490 / 490
npx --no-install eslint ./src --ext .jsx,.js                 # 0 erreur
REACT_APP_COMMIT=168ddf6 npx react-scripts build
# empreinte du firmware validé
curl -sL https://github.com/bird-sanctuary/bluejay/releases/download/v0.19.2/J_H_40_24_v0.19.2.hex | sha256sum
# attendu : 0fbfc67814933fbac41c2430d235da73ed5e666b8df040eec596f4c0db0ff4c2
# recherche de fonctions cachées dans le fichier livré
grep -o -i "xpro\|usine\|bootloader update\|writeBootloader\|location.search" build/static/js/*.js | sort | uniq -c
```

Essais C1-C6 : `docs/audit/essais-contre-audit.test.jsx.txt` (mode d'emploi dans `CONTRE-AUDIT-2026-11-06.md`).
