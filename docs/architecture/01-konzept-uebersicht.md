# 01 – Konzept & Übersicht

## Vision

Kleeblattadventure ist ein match-basiertes Action-Adventure. Seltene und wertvolle Items können optional als NFTs existieren. Das Wirtschaftssystem kombiniert hohe Immersion mit geringer Komplexität für den Spieler.

## Kernprinzipien

1. **Gameplay bleibt immer gasfrei** für den Spieler.
2. Standardmäßig **Custodial** (Studio kontrolliert die Keys über einen MPC-Provider).
3. Optionaler **Claim to Self-Custody** – Spieler kann jederzeit echte Ownership übernehmen.
4. **Zwei-Währungs-System**: In-Game-Währung für den Alltag, Token für werthaltige Güter.
5. Händler sind in **Gilden** organisiert und besitzen gemeinsame Gilden-Banks.
6. Alles Wertvolle läuft trotzdem on-chain (auch wenn der Spieler es nicht merkt).
7. L2-Only: Keine native Bridge zu Ethereum. Cross-Chain-Verantwortung liegt beim Spieler.

## Das Modell in einem Satz

> Spieler spielt gasfrei → bezahlt optional Mint-Gebühr → NFT landet automatisch auf custodialer Wallet → kann staken und nutzen → kann jederzeit auf eigene Wallet claimen.

## Wirtschaftlicher Kern

| Kennzahl | Beispielwert |
|----------|--------------|
| Mint-Gebühr Spieler | 2,50 $ |
| Geschätzte L2-Gas-Kosten | 0,015–0,03 $ |
| Conversion-Rate (konservativ) | 1,5–2 % |
| Zusatzeinnahmen | 2 % Royalty bei Secondary Sales |

## Was bewusst nicht gemacht wird

- Keine native L1-Bridge
- Kein öffentlicher DEX für den internen Swap (eigener Pool)
- Keine Server-side Private Keys (MPC-Provider übernimmt Key-Management)
- Consumables (Nahrung etc.) bleiben off-chain / Web2
