# Marques TrueGlide

Le code de TrueGlide ESC Configurator est distribué sous licence AGPL v3
(voir `LICENSE`). Il est dérivé d'[ESC Configurator](https://github.com/stylesuxx/esc-configurator),
créé par Chris Landa (stylesuxx) et ses contributeurs.

Le nom **TrueGlide**, la mention « CONTROL & FLY » et les logos TrueGlide
sont des marques de **TalkTrueFPV**. Ils ne sont **pas** couverts par la
licence AGPL v3 et ne sont pas inclus dans ce dépôt.

Toute personne qui redistribue ou met en ligne une version modifiée de ce
logiciel doit retirer le nom et les logos TrueGlide, sauf accord écrit de
TalkTrueFPV.

## Logos lors de la mise en ligne

Les fichiers de logo ne sont pas versionnés : le dossier `public/marque/`
est ignoré par git. Pour une version officielle, TalkTrueFPV place dans ce
dossier, avant `yarn build`, les fichiers suivants :

| Fichier | Taille | Usage |
|---|---|---|
| `favicon-64.png` | 64 × 64 | icône de l'onglet du navigateur |
| `logo-rond-128.png` | 128 × 128 | logo de l'en-tête |
| `logo-rond-192.png` | 192 × 192 | icône de l'application installée |
| `logo-rond-512.png` | 512 × 512 | icône de l'application installée |
| `partage.png` | 1200 × 630 | image d'aperçu lors d'un partage de lien |

Sans ces fichiers, l'application fonctionne normalement, sans logo.
