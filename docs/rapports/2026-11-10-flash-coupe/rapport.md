---
title: "Flash coupé : un défaut d'ESC Configurator trouvé et corrigé par TrueGlide"
subtitle: "Rapport d'essai et de correction : essai M6, 10 novembre 2026"
author: "TrueGlide (Jschmiedd)"
lang: fr
---

# Résumé

En coupant volontairement le courant d'un ESC pendant son flash, l'essai M6 a mis au jour un défaut d'**ESC Configurator**, le logiciel libre d'origine (stylesuxx/esc-configurator) sur lequel repose TrueGlide ESC Configurator :

- **le défaut :** quand l'ESC perd son courant pendant la vérification du flash, le logiciel reste bloqué sur « Flashage de l'ESC n », tous ses boutons grisés, sans fin. Le seul moyen d'en sortir est de débrancher le câble USB ;
- **la cause :** une erreur perdue dans la fonction qui réessaie les commandes. Elle date des débuts du projet d'origine et existe toujours dans sa dernière version publiée (v0.32.1) comme dans sa version en développement (26/10/2026) ;
- **la correction :** TrueGlide l'a corrigée en une ligne, prouvée par 2 tests automatiques qui échouent sur l'ancien code ;
- **la vérification au banc :** 2 essais sur la version corrigée. Le logiciel abandonne seul le flash en 2 à 2,5 minutes, affiche un message clair, et l'ESC se répare ensuite normalement.

L'essai a aussi révélé 2 défauts secondaires, eux aussi hérités du logiciel d'origine. Ils sont corrigés et en attente de publication (voir la partie 4).

# 1. L'essai

| | |
|---|---|
| Matériel | SpeedyBee F405 Mini neuve (Betaflight), ESC J-H-40 4 en 1 en Bluejay 0.19 48 kHz, sortie 4 grillée côté puissance (commande saccadée), sans moteur |
| Sécurité | Hélices retirées, batterie à travers un smoke stopper |
| But | Vérifier qu'un ESC dont le flash est interrompu reste réparable avec le logiciel |
| Méthode | Flash de l'ESC 4 seul, batterie débranchée vers la moitié de la barre de progression, attente, puis réparation |

# 2. Le défaut constaté (version d'avant, ebaaf7f)

![Matin, 11:27 : après la coupure, la barre reste figée et tous les boutons sont gris.](images/1_avant_blocage.png)

Journal du matin (fichier complet en annexe) :

```
11:27:37  Flashing ESC 4
11:27:38  ### Step 3: Erase, write and verify Pages 0x02-0x0D
11:27:53  Failed processing command cmd_DeviceRead after 10 retries.
          ... plus rien pendant 2 min 30 : le logiciel attend sans fin ...
11:30:23  Reader failed NetworkError: The device has been lost.   (USB débranché)
```

L'ESC n'a pas répondu à 11:27:53, mais le logiciel n'a jamais conclu. Il est resté bloqué jusqu'au débranchement du câble USB par l'utilisateur.

# 3. La cause

Pendant un flash, chaque page écrite est relue pour être vérifiée. Ces vérifications passent par une fonction `retry()` qui réessaie jusqu'à 10 fois. Le code d'origine (fichier `src/utils/helpers/General.js`, identique dans la v0.32.1 et dans la branche `develop` du 26/10/2026) :

```js
async function retry(func, maxRetries, iterationDelay = 0) {
  function wrapped() {
    return new Promise((resolve,reject) => func(resolve, reject));
  }
```

Les vérifications sont des fonctions **asynchrones** (`src/utils/FourWay.js`) :

```js
const verifyPages = async (resolve, reject) => {
  const message = await this.read(address, Math.min(step, data.length - address));
```

Quand l'ESC ne répond plus, `this.read()` échoue. L'erreur sort de la fonction asynchrone, mais **personne ne l'écoute**. La promesse créée par `wrapped()` n'est alors ni tenue ni rejetée : le flash attend indéfiniment.

Les mêmes fonctions asynchrones servent à vérifier le chargeur de démarrage, l'effacement et la marque de sécurité FLASH\*FAILED. Le même blocage est donc possible à toutes les étapes du flash.

# 4. Les corrections

## 4.1 Blocage du flash coupé (publiée sur /test/, 7a290f7)

```js
function wrapped() {
  return new Promise((resolve, reject) => {
    // An async function that throws rejects its own promise: pass it on
    Promise.resolve(func(resolve, reject)).catch(reject);
  });
}
```

L'erreur est maintenant transmise : le flash échoue avec le message habituel, et l'ESC reste réparable.

Tests ajoutés, qui échouent sur l'ancien code et passent avec la correction :

- `retry()` avec une fonction asynchrone qui échoue : 3 essais, puis rejet (avant : attente sans fin) ;
- vérification d'une page dont la lecture échoue : rejet en moins de 3 s (avant : bloquée).

Résultat : 521 tests sur 521 passent.

## 4.2 Fréquence affichée faussée (prête, non publiée)

Dans Bluejay 0.19, la fréquence PWM est fixée dans le fichier flashé. L'octet de l'EEPROM ne sert qu'à l'**affichage** (source Bluejay v0.19.2 : « Temporary method for display »). Lors de l'écriture des réglages, le logiciel d'origine recopie tous les réglages du 1er ESC dans les autres, y compris cet octet. Un ESC flashé en 24 kHz s'affichait donc « 48kHz ».

La correction ne reprend du 1er ESC que les réglages communs décrits pour la version de l'ESC. Elle est vérifiée par 2 tests, dont un qui échoue sur l'ancien code.

## 4.3 Message « Timed out » à la déconnexion après un passthrough (prête, non publiée)

En déconnectant juste après une lecture ratée, le logiciel envoyait encore une commande d'arrêt des moteurs à la carte, alors qu'elle était en mode passthrough et ne pouvait pas répondre. Le message d'erreur apparaissait 1 s après « Port fermé ».

La correction tient compte du passthrough, où la carte coupe elle-même les moteurs, et attend la vraie fermeture du port. Hors passthrough, l'arrêt des moteurs est conservé. Elle est vérifiée par 3 tests.

## 4.4 Fichier Bluejay 48 kHz validé (prêt, non publié)

Le fichier J-H-40 Bluejay 0.19.2 **48 kHz** est ajouté à la liste des fichiers validés par TrueGlide, avec son empreinte SHA-256 relevée sur la publication officielle :

`8731a3570f8f4f3122cbd06d18f44fc06bccb4d27af4885853d5410eb701ac07`

# 5. La vérification au banc (version corrigée, 7a290f7)

| Essai | Coupure | Abandon automatique | Réparation |
|---|---|---|---|
| 1 | 13:06:57 | 13:09:26 (2 min 29) | Reflash OK en 10,9 s |
| 2 | 13:19:37 | 13:21:41 (2 min 04) | Reflash OK en 10,9 s, réglages rechargés à 13:26:37 |

![Pendant l'attente : barre figée et boutons gris, le logiciel réessaie (essai 2).](images/2_apres_coupure.png)

![13:21:41 : le logiciel abandonne seul, affiche le lien de récupération, et les boutons reviennent.](images/3_apres_abandon.png)

![Après la coupure, l'ESC 4 est lu « FLASH*FAILED » : la marque de sécurité a fonctionné et l'ESC est réparable.](images/4_flash_failed.png)

![Après reflash et rechargement de la sauvegarde : ESC 4 en 48 kHz, sens « Reversed » comme les 3 autres.](images/5_repare.png)

Images extraites de la vidéo de l'essai 2 :

![Vidéo : attente, boutons gris.](images/6_video_attente.png)

![Vidéo : abandon, boutons revenus.](images/7_video_abandon.png)

# 6. Points restants

- **Durée de l'abandon (2 à 2,5 minutes).** Les essais s'empilent : chaque lecture est réessayée 10 fois, et chaque vérification aussi 10 fois. Un abandon plus rapide est possible, à étudier dans une modification séparée.
- **Paramètres communs faussés quand un ESC est en FLASH\*FAILED.** L'écran affiche alors « ??? » et de fausses valeurs (1000, 1004, freinage 0). Il ne faut pas cliquer sur « Écrire les paramètres » dans cet état. Une protection est à ajouter.
- **Après un flash coupé, la carte de vol reste en passthrough.** Il faut débrancher et rebrancher l'USB avant de relire les ESC. Le logiciel pourrait l'indiquer.

# 7. Licence et origine

TrueGlide ESC Configurator est un dérivé d'ESC Configurator (stylesuxx/esc-configurator), sous licence AGPL v3. Le code d'origine cité dans ce rapport est celui de ce projet. La correction est libre, comme le reste du logiciel.

# Annexes

- `journaux/matin_ancienne-version_esc-configurator-log.txt` : journal complet du matin (blocage).
- `journaux/apres-midi_version-corrigee_journal-ecran.txt` : extrait du journal de l'après-midi (version corrigée).
- `journaux/trueglide-esc-reglages_2026-11-10_13-06-56.json` : sauvegarde des réglages prise avant le flash et rechargée après la réparation.
- `journaux/trueglide-esc-reglages_2026-11-10_13-25-38.json` : sauvegarde prise avant le reflash, avec l'ESC 4 en FLASH\*FAILED.
- Vidéos de l'essai : fournies par Johann, non jointes au dépôt pour leur taille.
