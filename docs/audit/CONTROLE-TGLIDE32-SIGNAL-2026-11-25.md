# Contrôle TGlide_32, module input/signal_watch, étape 3 (25/11/2026)

Contrôlé : le texte de `signal_watch.c` envoyé par la session de développement (par lecture). Empreintes SHA-256 et tests (327 692 vérifications) : NON VÉRIFIÉS ici (fichiers hors dépôt).
Écart volontaire avec AM32 : la perte de signal n'est plus remise à zéro par une trame à la bonne cadence mais à somme fausse (remarque de l'audit du 25/11).

## Lecture du code

| Point | Résultat |
|---|---|
| Départ « signal perdu » | correct : pas de moteur sans commande au démarrage |
| Compteur de perte remis à zéro seulement après 8 trames justes de suite | correct ; une trame fausse relance le compte |
| Compteur bloqué une fois perdu | correct : il ne peut pas revenir à « présent » en débordant |
| Délai borné 100-500 ms, calcul sans débordement (500 × 65 535 < 2³²) | correct |
| Le module ne coupe rien lui-même | correct ; l'action sera dans le module app |

## Avis sur les trois questions

- (a) **8 trames : d'accord.** Le calcul est juste (bruit : 1 chance sur 16 par trame ; 8 de suite ≈ 2 × 10⁻⁶ par seconde à 8 000 trames/s), et la cadence de trame filtre déjà une partie du bruit.
- (b) **100-500 ms : d'accord sous réserve.** À cadence lente, 100 ms peut couper en vol avec un signal un peu parasité (par exemple 500 trames/s, 30 % perdues : environ une chance sur deux d'avoir 8 justes de suite en 100 ms). Ajouter un essai à la cadence DShot la plus lente acceptée ; si la coupure apparaît, monter le minimum à 250 ms.
- (c) **Départ « perdu » : d'accord.**

## Point ouvert important (module gaz)

Une trame isolée à somme juste applique encore ses gaz (comme AM32) : du bruit peut envoyer une valeur de gaz au hasard. Recommandation : n'appliquer de nouveaux gaz que si les 8 dernières trames sont justes ; sinon garder les derniers gaz. Le choix B de Johann prévoit déjà de garder les derniers gaz. À l'arrêt, les gaz restent à zéro.

## Décision de Johann

L'audit prend acte que la session demande à Johann une confirmation écrite « 1B ». Tant qu'elle n'est pas écrite, le choix B reste une interprétation.

## Verdict

**CONFORME**, avec l'essai à cadence lente à ajouter. Aucun binaire, aucun flash.

## Étape 3 révisée (25/11) : règle du score

La règle « 8 justes de suite » coupait à tort à cadence lente (simulation de la session, confirmée par l'audit). Nouvelle règle : score +1 par trame juste (plafond 12), −1 par trame fausse (plancher 0) ; délai remis à zéro quand le score vaut 12. Délai 250-500 ms, 500 par défaut.

Simulation **indépendante** de l'audit (programme écrit ici, 10 h par cas) [EXÉCUTÉ] :

| Cadence | Trames perdues | 250 ms | 500 ms |
|---|---|---|---|
| 500/s | 30 % | 0,1 coupure/h | 0 |
| 500/s | 40 % | 154/h | 1,5/h |
| 1 000/s | 40 % | 2,6/h | 0 |
| 2 000/s | 40 % | 0 | 0 |

Bruit pur (1 trame juste sur 16), départ à zéro : 0 faux signal sur 4 milliards de trames [EXÉCUTÉ]. Les chiffres de la session sont retrouvés.

- (a) Règle du score : **d'accord**, code lu correct (plafond, plancher, remise à zéro seulement à 12).
- (b) Marge 12 : **d'accord**.
- (c) Plancher 250 ms : **d'accord**, mais 500 ms doit rester la valeur par défaut, et la notice doit dire de ne pas descendre sous 500 ms avec une cadence DShot inférieure à 1 000 trames/s.

Limite acceptée : 40 % de trames perdues à 500 trames/s reste un signal très dégradé ; à mesurer sur le vrai matériel.

**Verdict : CONFORME.** Empreintes et tests : NON VÉRIFIÉS (fichiers hors dépôt).
