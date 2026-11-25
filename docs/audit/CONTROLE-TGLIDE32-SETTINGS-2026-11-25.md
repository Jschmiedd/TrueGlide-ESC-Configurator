# Contrôle TGlide_32, module settings, étape 1 (25/11/2026)

Objet : fidélité à AM32 (`2a695a8`, `Src/main.c` `loadEEpromSettings()` l.614-830, `Inc/eeprom.h`) des lignes qui modifient le bloc de 192 octets.
Contrôlé : la **transcription** de la logique envoyée par la session de développement. Les fichiers eux-mêmes (`settings.c` `86786e05…`, `settings.h` `d0a2ce79…`, `tests/test_settings.c` `1c4cf579…`) ne sont dans aucun dépôt : **NON VÉRIFIÉ** que le code réel correspond à la transcription.

## Relecture contre AM32 (par lecture du code)

| Ligne | AM32 | Transcription | Résultat |
|---|---|---|---|
| Offsets 1, 5-16, 23, 36, 39-45 | `eeprom.h` | `settings.h` | identiques |
| `eeprom_version < 3` : 5-16 remis | 160, 1, 0, 10, 100, 0, 100, 0, 0, 0, 0, 0 | idem | identique |
| demag_comp > 4 → 0 | oui | oui | identique |
| brake_on_zero_throttle > 9 → 0 | oui | oui | identique |
| avance 0-3 → (v << 3) + 10 | oui, avant le test de version | idem | identique |
| `eeprom_version > 0` pour la suite | oui | `s[1] == 0` → fin | identique |
| Hall absent → 39 = 0 | `#ifndef HAS_HALL_SENSORS` | paramètre | identique |
| 40 hors 5-25 → 5 | oui | oui | identique |
| 41 = 0 ou > 10 → 10 | oui | `< 1 ou > 10` | identique (octet non signé) |
| 42 = 0 ou > 9 → 10 | oui | `< 1 ou > 9` → 10 | identique (10 = frein moteur désactivé, comme AM32) |
| 43 hors 70-140 → 255 | oui | oui | identique |
| 45 = 0 ou > 10 → 5 | oui | oui | identique |
| Avance utilisée | > 42 ou 4-9 → 16 ; 10-42 → v − 10 | `(v < 10 ou v > 42) ? 16 : v − 10` | identique **à condition** d'appeler `tg_settings_sanitize` avant (sinon 0-3 donnerait 16 au lieu de 0, 8, 16, 24) |
| Coupure tension basse active | 36 = 1 ou 2 (l.2341-2366) | idem | identique |

Aucune ligne de `loadEEpromSettings()` qui modifie le bloc n'est oubliée.

## Avis sur les deux questions

- (a) Ne pas borner 24, 25, 36, 44 dans le bloc : **d'accord**, AM32 les borne à l'usage (PWM 8-144, puissance de démarrage 50-150, courant 1-100, coupure seulement à 1 ou 2). Ces bornes seront à contrôler dans les modules qui les utilisent.
- (b) Ordre « 0-3 puis 10-42 » : **correct**, voir le tableau.

## À faire

1. Envoyer le texte réel de `settings.c` et `settings.h` (ou les déposer), pour vérifier les empreintes et lever le « NON VÉRIFIÉ ».
2. Écrire dans `settings.h` que `tg_settings_timing_advance` exige un bloc déjà passé par `tg_settings_sanitize`, et le tester.
3. Module protections : règle TrueGlide « coupure tension basse désactivée ». Recommandation : TGlide_32 ne coupe jamais, quelle que soit la valeur de l'octet 36 (un autre configurateur pourrait l'activer).

## Verdict

**CONFORME sur la transcription.** Aucun binaire, aucun flash : rien de bloquant pour l'instant.

## Suite (25/11) : code réel reçu en texte

- `settings.c` relu (texte collé, sans l'en-tête de licence) : **identique** à la transcription et à AM32 ; bornes `outside()` justes (10-42 pour l'avance, 1-10, 1-9, 70-140, 1-10, 5-25) ; décalage d'avance 0-3 sans débordement (34 au plus).
- `settings.h` : les 48 offsets annoncés sont identiques à `eeprom.h` d'AM32 (l'octet 2 est nommé version du bootloader, réservé dans AM32 : sans effet ici).
- Point 2 fait : commentaire et test (0-3 → 0, 8, 16, 24 après sanitize) ; 4 169 732 cas, 0 échec (annoncé, NON VÉRIFIÉ par exécution ici).
- Point 3 : soumis à Johann par la session de développement. Recommandation de l'audit maintenue.
- Empreintes SHA-256 : NON VÉRIFIÉES (fichiers hors dépôt, collage non identique au fichier). À vérifier au premier dépôt.

**Verdict : CONFORME** (module settings, étape 1).
