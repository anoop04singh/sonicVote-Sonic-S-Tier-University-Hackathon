# SonicVote: Decentralized Voting on the Sonic Blockchain


**SonicVote** is a decentralized, transparent, and secure voting platform built on the **Sonic Mainnet**. It empowers communities and organizations to create, manage, and participate in a variety of election types with confidence. The platform is designed from the ground up for efficiency, scalability, and cost-effectiveness, leveraging a modern Web3 technology stack to deliver a seamless user experience.

Deployed on Sonic Mainnet, hosted on Vercel! **[sonicvote.vercel.app](https://sonicvote.vercel.app)**

Read more about implementation and interface in this [Medium Article](https://medium.com/@singanoop04/sonicvote-building-a-blazing-fast-decentralized-voting-platform-on-the-sonic-blockchain-e9bb0fa3e318).


---

## ✨ Features

-   **Fully Decentralized**: Built on the Sonic Mainnet, ensuring all operations are transparent and censorship-resistant.
-   **Multiple Voting Systems**: Supports various governance models including Simple Majority, Quadratic, Ranked-Choice, and Cumulative voting.
-   **Cost-Efficient**: Utilizes IPFS for metadata storage, drastically reducing on-chain transaction costs for creating elections.
-   **Lightning-Fast Experience**: Leverages The Graph for data indexing, providing an instant, Web2-like user experience without blockchain loading times.
-   **Secure Wallet Integration**: Connects seamlessly with MetaMask for secure transaction signing.
-   **User Dashboard**: Provides a personalized dashboard for users to track their complete voting history.
-   **Permissioned Elections**: Supports restricted voting via whitelisted wallet addresses for private polls.
-   **Modern UI/UX**: A clean, responsive, and intuitive interface built with shadcn/ui, Tailwind CSS, and Framer Motion.

---

## 🛠️ Tech Stack

-   **Frontend**: React, TypeScript, Vite, ethers.js, Apollo Client (GraphQL)
-   **UI**: shadcn/ui, Tailwind CSS, Framer Motion
-   **Blockchain**: Solidity, Sonic Mainnet
-   **Decentralized Storage**: IPFS (via Pinata)
-   **Data Indexing**: The Graph Protocol

---

## 🏗️ Architecture Overview

SonicVote employs a decoupled architecture that separates concerns to maximize efficiency and scalability. The core components are the Frontend, IPFS for data storage, Sonic Smart Contracts for on-chain logic, and The Graph for data indexing.

```
+-----------------+      +-------------------+      +----------------------+
|                 |      |                   |      |                      |
|  React Frontend |----->|   Wallet (MetaMask) |----->|  Sonic Smart Contracts |
| (UI & Logic)    |      | (Signing & Txns)  |      | (Factory & Election) |
|                 |      |                   |      |                      |
+-------+---------+      +-------------------+      +----------+-----------+
        |                                                      |
        | (Read Queries)                                       | (Emits Events)
        |                                                      |
        v                                                      v
+-------+---------+      +-------------------+      +----------+-----------+
|                 |      |                   |      |                      |
| The Graph       |<-----|   Graph Node      |<-----|   Sonic Blockchain     |
| (GraphQL API)   |      | (Indexer)         |      |                      |
|                 |      |                   |      |                      |
+-----------------+      +-------------------+      +----------------------+
        ^
        | (Upload/Fetch JSON)
        |
        v
+-------+---------+
|                 |
| IPFS (Pinata)   |
| (Metadata Storage)|
|                 |
+-----------------+
```

---

## 🌊 Core Workflows

### 1. Creating an Election

1.  **UI Interaction**: The user fills out the "Create Election" form.
2.  **IPFS Upload**: The frontend constructs a JSON object with the election's title, description, and options, then uploads it to IPFS. This returns an IPFS Content Identifier (CID).
3.  **On-Chain Transaction**: The user signs a transaction calling the `createElection` function on the `ElectionFactory` contract, passing the on-chain data (dates, type) and the IPFS CID.
4.  **Contract Deployment**: The `ElectionFactory` deploys a new, unique `Election` contract instance.
5.  **Event & Indexing**: The factory emits an `ElectionCreated` event, which is immediately picked up and indexed by our subgraph, making the new election visible in the app.

### 2. Casting a Vote

1.  **UI Interaction**: A connected user selects their vote on the election details page.
2.  **IPFS Upload**: The details of the vote are packaged into a JSON object and uploaded to IPFS, creating a transparent, off-chain receipt.
3.  **On-Chain Transaction**: The user signs a transaction calling the appropriate vote-casting function on the specific `Election` contract.
4.  **Contract Logic**: The contract validates that the election is active and the user hasn't voted, then updates the vote counts and adds the user's address to the `voters` set.
5.  **Event & Indexing**: The contract emits a `VoteCast` event, which is indexed by the subgraph to update the live results and the user's dashboard.

---

## 💾 IPFS Data Structures

To minimize on-chain costs, detailed metadata is stored on IPFS. The smart contract only stores a reference (the IPFS CID) to this data.

#### Election Metadata

Stored when an election is created.
```json
{
  "title": "Community Governance Vote",
  "description": "Vote on the next major feature for the platform.",
  "options": [
    { "id": "a", "text": "Decentralized Identity Integration" },
    { "id": "b", "text": "Advanced Gamification Features" }
  ],
  "isRestricted": true,
  "voterList": ["0x...", "0x..."]
}
```

#### Vote Data

Stored when a vote is cast. The structure varies by election type.

**Simple Majority:**
```json
{
  "electionId": "0x...",
  "selectedOption": "Decentralized Identity Integration",
  "voter": "0x..."
}
```

**Quadratic / Cumulative:**
```json
{
  "electionId": "0x...",
  "votes": {
    "Decentralized Identity Integration": 5,
    "Advanced Gamification Features": 2
  },
  "voter": "0x..."
}
```

---

## 📈 The Graph Implementation

To provide a fast and responsive user experience, SonicVote uses a custom subgraph to index all on-chain events. This avoids slow direct blockchain queries for fetching lists of elections or voting histories.

-   **Entities Indexed**: `Election`, `Vote`
-   **Events Handled**: `ElectionCreated`, `VoteCast`
-   **Subgraph Endpoint**: The application queries data from our deployed subgraph using GraphQL.
    ```
    https://gateway.thegraph.com/api/[api-key]/subgraphs/id/DhHm4E3T5YNhT6VxubamJCU8bAFNL48SkeRtamLvEt9p
    ```

---

## 📄 Smart Contracts

The on-chain logic is powered by two main contracts written in Solidity.

1.  **`ElectionFactory.sol`**: A factory contract responsible for deploying new, independent `Election` contracts. This pattern is key to scalability.
2.  **`Election.sol`**: The contract for an individual election. It manages the election's state, enforces voting rules, and securely tallies votes.

#### Deployed Contract on Sonic Mainnet

The `ElectionFactory` contract is deployed and verified on the Sonic Mainnet at the following address:

**`0x37D50136Ac1f6010AC6C4B67893434B366AF0aaF`**

---

## 🚀 Local Development

To run this project locally, follow these steps:

1.  **Prerequisites**:
    -   Node.js (v18 or later)
    -   `pnpm`, `npm`, or `yarn`
    -   MetaMask browser extension

2.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-repo/sonic-vote.git
    cd sonic-vote
    ```

3.  **Install dependencies**:
    ```bash
    npm install
    ```

4.  **Set up environment variables**:
    -   Create a file named `.env.local` in the root of the project.
    -   Add the following variables, replacing the placeholder values with your actual keys:
        ```
        VITE_PINATA_API_KEY=your_pinata_api_key_here
        VITE_PINATA_SECRET_KEY=your_pinata_secret_key_here
        VITE_GRAPH_API_KEY=your_graph_api_key_here
        ```

5.  **Run the development server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:8080`.

---

## ⚠️ Disclaimer

Please note that due to the nature of blockchain indexing, there can be a delay of up to 5 minutes for new elections or votes to appear in the application. This is because the subgraph needs time to process the latest blocks from the Sonic Mainnet.

---

Built with ❤️ for the Sonic Hackathon by **0xanoop**.

