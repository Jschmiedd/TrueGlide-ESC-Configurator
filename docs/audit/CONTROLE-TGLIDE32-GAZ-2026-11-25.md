# Contrôle TGlide_32, étape 4 : filtre des gaz (throttle_gate) (25/11/2026)

Contrôlé par lecture : `throttle_gate.c` et `tg_signal_watch_trusted()` envoyés par la session de développement. Empreintes et tests : NON VÉRIFIÉS (hors dépôt).
Décision de Johann rapportée : « ok donc validé avec l'audit on applique ça » (un seul délai réglable 0,25-0,5 s, 0,5 par défaut).

## Lecture du code

| Point | Résultat |
|---|---|
| Gaz nuls avant confiance | correct (`applied = 0` à l'init) |
| Trame fausse ou signal non fiable : gaz gardés, valeur en attente effacée | correct |
| Une valeur n'est appliquée que confirmée par la trame juste suivante | correct |
| Arrêt : remise à zéro | correct |

## Avis

- (a) **Retard d'une trame : d'accord.** De 0,125 ms à 8 000 trames/s jusqu'à 2 ms à 500 trames/s. C'est faible devant la réaction du moteur.
- (b) **Une seule confirmation suffit.** Le reste de 0,39 % des pertes de signal donne une valeur de gaz au hasard tenue au plus le délai (0,5 s), puis arrêt. Une deuxième confirmation ajouterait du retard sur chaque trame, en vol, pour un cas rare et déjà borné. Garder une confirmation ; à revoir si l'essai au banc montre autre chose.
- (c) **4 trames de suite : d'accord sous réserve.** Mesurer aussi le retard moyen à 500 trames/s avec 30 % de trames perdues ; s'il dépasse 10 ms, descendre à 2.
- Ordre d'appel : écrire et tester dans quel ordre `tg_signal_watch_frame` et `tg_throttle_gate_frame` sont appelés pour une même trame (le résultat en dépend).
- Arrêt (valeur 0) confirmé comme les autres valeurs : **d'accord**, c'est cohérent.
- Commandes DShot 1-47 (sens de rotation, 3D) : elles doivent passer par le même filtre **et** garder la répétition exigée par AM32 avant de changer le sens.

## Verdict

**CONFORME**, avec deux ajouts : l'ordre d'appel et la mesure à 500 trames/s avec 30 % de trames perdues. Aucun binaire, aucun flash.

## Suite (25/11) : demandes appliquées

- 4 de suite → 2 de suite (retard moyen à 500 trames/s, 30 % perdues : 25,7 ms → 11,1 ms). **D'accord.**
- Ordre d'appel rendu impossible à inverser : le filtre des gaz appelle lui-même la surveillance du signal. **D'accord.**
- Limite signalée par la session : pire retard 238 ms de gaz figés (500 trames/s, 30 % perdues), car la confiance exige le score au plafond. **Trop long en vol.**
- Avis : faire l'hystérésis proposée (confiance acquise à 12, gardée tant que le score reste ≥ 6). Critères d'acceptation à mesurer : pire retard à 500 trames/s et 30 % perdues **≤ 50 ms** ; injection de bruit après la fin d'un vrai signal **≤ 1 %** des pertes de signal (elle reste bornée au délai, puis arrêt). Si les deux ne tiennent pas ensemble, me renvoyer les chiffres.
