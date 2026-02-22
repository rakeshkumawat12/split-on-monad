# MonadSplit

## The Moment You Know

It's Sunday night.

You're staring at a payment request that's been "pending" for 12 days.

You won't send the reminder. They won't bring it up. You'll both pretend it didn't happen.

And quietly - something between you shifts.

---

## This Happens Every Time

Not because your friends are bad people.

Because the system is broken.

Splitting expenses has always been a promise. A social contract backed by nothing
except goodwill and the vague hope that everyone remembers. Apps help — but they
still depend on someone choosing to pay. Someone choosing to open the app.
Someone choosing to follow through.

Trust is doing a lot of heavy lifting.

**What if it didn't have to?**

---

## Enter Monad Split

MonadSplit fixes the thing nobody talks about.

Not the money. The awkwardness that outlives it.

We didn't build another spreadsheet with a nice UI.

We asked a different question: *What if the math was the contract?*

MonadSplit is a decentralized expense-splitting app built on Monad Testnet.
When you add an expense, it doesn't get written in a database controlled by
a company. It gets written on a blockchain. Permanently. Publicly.
Mathematically undeniable.

No backend. No middleman. No "oops, our servers are down."

**Just you, your group, and an immutable ledger that doesn't forget.**

---

## How It Works

### 1. Connect Your Wallet
Open the app. Connect MetaMask or any supported wallet. You're already authenticated.
No username. No password. No "forgot your password?" spiral.

### 2. Create a Group
Add your friends' wallet addresses. Give the group a name — *Barcelona Trip*,
*Apartment Bills*, *That Concert We Said We'd Split*. Hit create.

Somewhere on the Monad blockchain, a smart contract just woke up.
It knows exactly who's in your group. It will never forget.

### 3. Add Expenses
Who paid for dinner? Log it. The contract splits it automatically — equally,
instantly, trustlessly. Every member's balance updates on-chain.

No rounding errors swept under the rug. No "I think it was around $40?"
**Exact amounts. Forever.**

### 4. See Who Owes What
Open the dashboard. Every balance is real-time. Every debt is visible to everyone.
There is no ambiguity. There is no "I thought I paid you back."

The math is public. The math is final.

### 5. Settle On-Chain
When it's time to pay up, you're not sending a promise.
You're sending **MON tokens directly** to the person you owe — peer to peer,
wallet to wallet, with a transaction hash as the receipt.

No payment pending. No "I sent it, check your app."

**The blockchain confirms it. That's it. It's done.**

---

## Built on Monad

Monad is a high-performance EVM blockchain built for the kind of throughput
that makes real-world apps actually usable.

Fast finality. Low fees. Full EVM compatibility.

We didn't pick Monad because it was trendy.
We picked it because when you're settling $12 for pizza,
you can't afford $40 in gas fees. That math never works.

**On Monad, it works.**

---

## The Stack (For Those Who Want to Know)

Next.js 14      — Frontend framework
React 18        — UI rendering
Wagmi v2        — Blockchain hooks
Viem v2         — Ethereum utilities
RainbowKit v2   — Wallet connection
Zustand         — Local state
Solidity 0.8.20 — Smart contracts
Hardhat         — Contract toolchain
Monad Testnet   — Chain ID 10143


Two contracts. That's it.

`ExpenseGroupFactory` — creates your group, deploys it on-chain.
`ExpenseGroup` — your group's permanent home. Stores members, expenses,
balances. Handles settlement. Requires no trust from anyone.

---

## Get Started

```bash
git clone https://github.com/rakeshkumawat12/split-on-monad.git
cd split-on-monad
npm install
npm run dev