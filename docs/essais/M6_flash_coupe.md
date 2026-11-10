# Essai M6 : flash coupé puis réparé (ESC grillé)

Date : …… Fait par : ……

**HÉLICES RETIRÉES.** Batterie **toujours à travers le smoke stopper**. Logiciel seul :
`https://jschmiedd.github.io/TrueGlide-ESC-Configurator/app/` (en bas à droite : « 0.33.0-dev · b98406b », sinon F5).

**STOP immédiat** (débrancher la batterie) si la LED du smoke stopper reste allumée fort, si ça chauffe ou si ça sent le brûlé.

## 1. Préparer

1. Moteur de l'ESC grillé débranché. Noter sa position : ESC n° ……
2. Carte en USB, « Sélectionner un port série », « Connecter ».
3. Batterie (smoke stopper), « Lire les paramètres ».

- Les 4 ESC sont lus ?

## 2. Couper le flash

4. Sur la case de l'ESC grillé seulement : « Installer le micrologiciel sur cet ESC ».
5. Bluejay, J-H-40, 0.19.2, **la même fréquence que celle lue à l'étape 3** (par exemple 48 kHz si les ESC affichent « 48kHz »), « Installer ».
6. Quand la barre arrive vers la **moitié** : **débrancher la batterie**.

- Le journal dit que le flash de cet ESC a échoué ?

## 3. Réparer

7. Rebrancher la batterie (smoke stopper), « Lire les paramètres ».
8. Sur la case de l'ESC grillé : « Installer le micrologiciel sur cet ESC ».
9. Bluejay, J-H-40, 0.19.2, **la même fréquence que celle lue à l'étape 3** (par exemple 48 kHz si les ESC affichent « 48kHz »), « Installer ». Attendre la fin, sans rien toucher.
10. Débrancher puis rebrancher la batterie, « Lire les paramètres ».

- À l'étape 7, l'ESC grillé est encore vu par le logiciel ?
- À l'étape 10, il affiche « J-H-40 - Bluejay, 0.19, 24kHz » ?
- Les 3 autres ESC n'ont pas changé ?

## 4. Fin

11. Débrancher la batterie. « Enregistrer le journal de débogage ».

À envoyer : le fichier esc-configurator-log.txt, plus une capture si un message surprend.
