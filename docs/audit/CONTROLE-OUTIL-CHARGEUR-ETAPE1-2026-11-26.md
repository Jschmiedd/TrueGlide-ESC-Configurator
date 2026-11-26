# Contrôle de l'outil « chargeur », étape 1 : inspection en lecture seule (26/11/2026)

Contrôlé : la description et les scripts envoyés par la session TGlide (dossier local `TGlide_chargeur`, hors dépôt ; empreintes et 17 tests NON VÉRIFIÉS ici). Rien n'a été exécuté sur du matériel.

## Valeurs vérifiées contre le code source d'OpenOCD (fichiers lus ici) [EXÉCUTÉ]

| Valeur | Annoncée | OpenOCD | Résultat |
|---|---|---|---|
| F031 / F051 | 0x444 / 0x440 | `stm32f1x.c` « stm32f03x » 0x444, « stm32f05x » 0x440 | juste |
| G071 / G431 / L431 | 0x460 / 0x468 / 0x435 | `stm32l4x.h` DEVID_STM32G07_G08XX, G43_G44XX, L43_L44XX | juste |
| Identité F0 et G0 | 0x40015800 | `stm32f1x.c` et DBGMCU_IDCODE_G0 | juste |
| Identité G4 et L4 | 0xE0042000 | DBGMCU_IDCODE_L4_G4 | juste |
| Protection F0 | FLASH_OBR 0x4002201C, bit 1 = protégé | STM32_FLASH_OBR_B0, OPT_READOUT = 1 | juste ; la valeur 11 = niveau 2 vient du manuel ST, NON VÉRIFIÉE sur document |
| Protection G0/G4/L4 | FLASH_OPTR 0x40022020 ; 0xAA niveau 0, 0xCC niveau 2, sinon niveau 1 | flash_regs_base 0x40022000 + 0x020 ; RDP_LEVEL_0 0xAA, RDP_LEVEL_2 0xCC | juste |
| Écritures à `init` | DBGMCU_CR et gel des chiens de garde | `stm32f0x.cfg` examine-end : `mmw 0x40015804`, `mmw 0x40015808` | juste, honnêtement signalé |
| Adresses GPIO (F0/G4/L4 0x48000000, G0 0x50000000, IDR +0x10) | — | de mémoire, cohérentes avec les manuels ST | NON VÉRIFIÉ sur document |

## Lecture de la logique

Refus partout où il faut : identité différente, 0 ou 0xFFFFFFFF, niveau 2, sortie incomplète, délai dépassé, aucune broche ou deux broches qui suivent. Un refus ne fait courir aucun risque. Bien.

## À ajouter

1. Vérifier que les fichiers `probes/` d'AM32-unlocker ne demandent pas de reset à la connexion (`connect_assert_srst`) ; sinon l'inspection redémarre la puce.
2. Pendant la détection de la broche, les **moteurs doivent être débranchés** : le firmware d'origine tourne et peut prendre les contacts à la masse et au 3,3 V pour un signal. À écrire dans la procédure, à cette étape.
3. Une broche dont l'horloge du port est éteinte lit toujours 0 : elle sera refusée, ce qui est sans danger. Le message de refus doit le dire, pour ne pas faire croire à un mauvais contact.
4. La résistance de 1 kΩ doit être **fixée sur le gabarit**, pas tenue à la main.

## Verdict

**CONFORME pour un premier essai en lecture seule**, sur l'ESC SEQURE E70 G2 sacrifiable, après les 4 ajouts. Aucune écriture n'est encore reliée à l'outil.
