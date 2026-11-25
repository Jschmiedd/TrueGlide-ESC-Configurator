# Contrôle TGlide_32, module input/dshot_frame, étape 2 (25/11/2026)

Référence : AM32 `2a695a8`, `Src/dshot.c`, `computeDshotDMA()` l.72-~112 (fichier téléchargé et relu ici).
Contrôlé : le texte de `dshot_frame.c` et la description de `dshot_frame.h` envoyés par la session de développement. Empreintes SHA-256 NON VÉRIFIÉES (fichiers hors dépôt). Tests annoncés (3 140 597 cas, 0 échec) : NON VÉRIFIÉS par exécution ici.

## Relecture contre AM32 (par lecture du code)

| Point | AM32 | TGlide_32 | Résultat |
|---|---|---|---|
| Durée de trame | `uint16_t` = front 31 − front 0 | idem, différence 16 bits | identique (passage par zéro du compteur géré pareil) |
| Bornes | accepté si `> low` et `< high` | refusé si `<= low` ou `>= high` | identique |
| Demi-bit | durée >> 5 | idem | identique |
| Bits | `dpulse[i]` = haut > demi-bit, bit 0 en premier | décalage à gauche, bit 0 = bit de poids fort | identique |
| Somme de contrôle | XOR des quartets `dpulse[0-3]`, `[4-7]`, `[8-11]` | `(p ^ p>>4 ^ p>>8) & 0x0F` sur les 12 bits | identique |
| DShot inversé | `~reçu + 16` sur 8 bits = 15 − reçu | attendu inversé `~attendu & 0x0F` | équivalent (reçu = 15 − attendu ⇔ attendu = 15 − reçu) |
| Valeur | `tocheck` = `dpulse[0-10]` | `payload >> 1` | identique |
| Demande de télémétrie | `dpulse[11]` | `payload & 1` | identique |
| Refus | rien n'est pris | la structure n'est pas modifiée | conforme |

## Remarque pour le module suivant (sécurité)

Dans AM32, `signaltimeout = 0` est remis **dès que la durée de trame est bonne**, avant la somme de contrôle. Une ligne parasitée avec la bonne cadence mais des sommes fausses empêche donc la détection de perte de signal, et le moteur garde les derniers gaz. Recommandation pour TGlide_32 : ne remettre le compteur de perte de signal à zéro **que sur une trame à somme juste**. À traiter dans le module qui gère la perte de signal et l'armement.

## Verdict

**CONFORME.** Aucun binaire, aucun flash.
