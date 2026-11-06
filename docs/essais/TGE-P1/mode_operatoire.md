# Essai TGE-P1 (TrueGlide ESC Configurator, master be3807a) : KarRmen, ESC BLS 35A en Bluejay, carte en TRUEGLIDE

Date : …… Drone : …… Fait par : ……

Drone : KarRmen, SpeedyBee F405 Mini avec ESC BLS 35A déjà en **Bluejay**, carte en **TRUEGLIDE** (on ne change pas le
firmware de la carte), **HÉLICES RETIRÉES**, posé à plat sur la
table. Radio **éteinte**. Matériel : batterie, câble USB de données, ordinateur avec **Chrome ou Edge**. Rien à
installer. La batterie n'est branchée que quand c'est demandé, et toujours **débranchée avant de fermer la page**.

Adresses :
- Logiciel seul : `https://jschmiedd.github.io/TrueGlide-ESC-Configurator/app/`
- Dans TrueGlide Configurator (version d'essai) : `https://jschmiedd.github.io/TrueGlide-Configurator/test/`, menu ESC

## Avant de commencer (rien à cocher)

1. Retirer les 4 hélices. Radio éteinte.
2. Ouvrir le logiciel seul dans Chrome ou Edge.
3. En bas à gauche, cliquer sur « Effacer le journal de débogage » s'il y a déjà des lignes.

## TGE-P1-1. Connexion et lecture

1. Brancher la carte en USB, **sans batterie**. Cliquer sur « Sélectionner un port série » et choisir la carte.
2. Débit 115200, cliquer sur « Connecter ».
3. Brancher la batterie, cliquer sur « Lire les paramètres ».

- La page affiche le logo TrueGlide, les textes en français et le contact TalkTrueFPV à droite ?
- Les avertissements de sécurité (hélices, radio, batterie) sont affichés ?
- Après « Connecter », le journal affiche « Carte : F405 », la date du firmware et « identifiant : BTFL version : 26.6.2 »
  (c'est ce qu'annonce TRUEGLIDE 2026.6.2) ? (Recopier ces lignes dans « Autres remarques ».)
- Après « Lire les paramètres », 4 cartes « ESC 1 » à « ESC 4 » s'affichent, avec « Bluejay » et sa version ? (Recopier le
  titre d'une carte dans « Autres remarques ».)
- La lecture démarre tout de suite, sans attente d'environ 1 seconde ?

## TGE-P1-2. Écrire un réglage

1. Changer « Puissance du bip » (par exemple 40 → 60). Cliquer sur « Écrire les paramètres ».
2. Débrancher puis rebrancher la batterie, cliquer sur « Lire les paramètres ».
3. Remettre la valeur d'origine, « Écrire les paramètres ».
4. Noter dans « Autres remarques » le sens des 4 moteurs (« Direction des moteurs » de chaque ESC).
5. Changer « Direction des moteurs » d'**un seul** ESC, « Écrire les paramètres », « Lire les paramètres ». Remettre le
   sens d'origine et écrire.

- À l'étape 2, la nouvelle valeur de « Puissance du bip » est conservée ?
- À l'étape 5, seul cet ESC a changé de sens ?

## TGE-P1-3. Reflasher Bluejay en gardant les réglages

1. « Installer sur tous les ESC » → Bluejay, **même layout** que celui affiché sur les cartes, **même version** que celle
   affichée (ou la dernière).
2. Dans « Sélectionnez la gestion des paramètres », choisir « Migrer les paramètres ».
3. Cliquer sur « Installer » et attendre la fin.
4. Débrancher puis rebrancher la batterie, « Lire les paramètres ».

- Les barres de progression avancent et le journal affiche « ESC n flashé » pour les 4 ESC ?
- Les cartes affichent toujours « Bluejay » ?
- Le sens des 4 moteurs et la « Puissance du bip » sont les mêmes qu'avant (comparer avec la note de TGE-P1-2) ?
- À l'étape 4, les ESC jouent leur mélodie habituelle ?

## TGE-P1-4. Refus d'un mauvais fichier

1. « Installer sur tous les ESC », choisir un **autre** layout que celui de l'ESC.
2. **Ne pas** cocher « Autoriser un layout différent ? ». Cliquer sur « Installer ».

- Le journal affiche « Layout différent, forçage non activé - abandon » ?
- Les ESC sont toujours en Bluejay et fonctionnent (« Lire les paramètres » les relit) ?

## TGE-P1-5. Mélodies (facultatif : la nouvelle mélodie reste ensuite sur le drone)

1. « Ouvrir l'éditeur de mélodie », choisir une mélodie, « Lire », « Accepter », « Écrire les mélodies ».
2. Débrancher puis rebrancher la batterie.

- La nouvelle mélodie est jouée, et les 4 ESC finissent ensemble ? (Si tu ne l'as pas fait, répondre « non » et écrire
  « pas fait ».)

## TGE-P1-6. Test des moteurs (HÉLICES RETIRÉES)

1. Cliquer sur « Déconnecter », puis « Connecter » **sans** lire les ESC. Batterie branchée.
2. Regarder l'onglet des moteurs, sans rien toucher.
3. Cocher « J'ai retiré toutes les hélices », puis « Activer le contrôle des moteurs ».
4. Monter le curseur « Moteur 1 » au maximum, puis le ramener à 1000.
5. Monter « Vitesse maître » au maximum, puis la ramener à 1000.
6. Remonter « Vitesse maître » (par exemple à 1150), puis **décocher** « J'ai retiré toutes les hélices ».
7. Recocher les deux cases, monter « Vitesse maître », puis cliquer sur « Lire les paramètres ».
8. Dans les paramètres du logiciel (roue dentée en haut), regarder la liste.

- À l'étape 2, « Activer le contrôle des moteurs » est grisé, et le texte « Débranchez la batterie avant de fermer la
  page… » est affiché ?
- À l'étape 4, seul le moteur 1 tourne, et le curseur s'arrête à **1300** ?
- À l'étape 5, les 4 moteurs tournent, et le curseur s'arrête à **1300** ?
- À la fin de l'étape 5, tous les moteurs sont arrêtés et **tous** les curseurs affichent 1000 ?
- À l'étape 6, les moteurs s'arrêtent tout de suite, les curseurs reviennent à 1000, et « Activer » est décoché et grisé ?
- À l'étape 7, les moteurs s'arrêtent et les ESC sont lus normalement ?
- À l'étape 8, il n'y a **pas** d'option « Masquer les avertissements » ?
- (Seulement si le mode 3D est activé sur la carte, sinon répondre « non » et l'écrire dans « Autres remarques ».)
  Les curseurs vont de **1350 à 1650**, avec l'arrêt à 1500 ?
- Les deux cases sont bien placées ? (Sur la version en ligne actuelle, elles sont étirées sur la ligne, comme sur ta
  capture : répondre « non » tant que la correction n'est pas publiée.)

## TGE-P1-7. Onglet ESC dans TrueGlide Configurator

1. Débrancher la batterie. Fermer l'onglet du logiciel seul.
2. Ouvrir TrueGlide Configurator (version d'essai), « Connexion » à la carte.
3. Cliquer sur **ESC** dans le menu. Dans l'onglet : « Connecter », brancher la batterie, « Lire les paramètres ».
4. Refaire TGE-P1-3 (reflasher Bluejay en gardant les réglages). Pendant le flash, essayer de changer d'onglet.
5. Après le flash : cocher « J'ai retiré toutes les hélices » et « Activer le contrôle des moteurs », monter « Moteur 1 »,
   puis quitter l'onglet ESC **moteur en marche**.
6. Quitter l'onglet ESC, « Connexion » dans TrueGlide Configurator. Débrancher la batterie.

- À l'étape 3, TrueGlide Configurator s'est déconnecté, l'onglet ESC s'affiche sans bandeau cookies, et les 4 ESC sont
  lus ?
- À l'étape 4, le changement d'onglet est refusé (message « Opération en cours sur les ESC, patientez avant de quitter
  l'onglet ESC. ») et le flash continue jusqu'au bout ?
- À l'étape 5, le moteur s'arrête en quittant l'onglet ?
- À l'étape 6, la reconnexion dans TrueGlide Configurator fonctionne (le port est libéré) ?

## TGE-P1-8. Fin

- Dans le logiciel seul, « Enregistrer le journal de débogage » (en bas à gauche) a téléchargé le fichier
  esc-configurator-log.txt (à envoyer) ?
- Les 4 ESC sont en Bluejay, avec le sens des moteurs et les réglages d'origine ?

## À envoyer

### Fichiers envoyés (journal de débogage, captures d'écran)

### Titre d'une carte ESC, sens des moteurs d'origine

### Autres remarques (ce qui a surpris, messages d'erreur recopiés) [grand]
