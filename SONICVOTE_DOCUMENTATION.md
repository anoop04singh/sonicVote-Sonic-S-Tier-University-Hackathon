# SonicVote: Technical Documentation

## 1. Introduction

SonicVote is a decentralized, transparent, and secure voting platform built on the **Sonic Mainnet**. It empowers communities and organizations to create, manage, and participate in a variety of election types with confidence. The platform is designed from the ground up for efficiency, scalability, and cost-effectiveness, leveraging a modern Web3 technology stack to deliver a seamless user experience.

This document provides a comprehensive technical overview of the SonicVote application, its architecture, core functionalities, and the design principles that make it a robust solution for decentralized governance.

---

## 2. Application Architecture

SonicVote employs a sophisticated, decoupled architecture that separates concerns to maximize efficiency and scalability. The core components are the Frontend Application, IPFS for data storage, Sonic Smart Contracts for on-chain logic, and The Graph for data indexing.

### 2.1. Architectural Diagram

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
        ^                                                      ^
        |                                                      |
        | (Upload/Fetch JSON)                                  | (Store On-Chain State)
        |                                                      |
        +------------------------------------------------------+
        |
        v
+-------+---------+
|                 |
| IPFS (Pinata)   |
| (Metadata Storage)|
|                 |
+-----------------+
```

### 2.2. Core Components

*   **Frontend Application**: A modern web application built with **React** and **TypeScript**. It utilizes the **shadcn/ui** component library and **Tailwind CSS** for a responsive and clean user interface. **Framer Motion** is used for fluid animations, enhancing the user experience.
*   **Wallet Integration**: Users interact with the blockchain via their browser wallets (e.g., MetaMask). The application uses **ethers.js** to handle wallet connections, transaction signing, and communication with the smart contracts.
*   **Smart Contracts (Solidity)**: Deployed on the Sonic Mainnet, these contracts form the application's backbone.
    *   **ElectionFactory.sol**: A factory contract responsible for deploying new, independent `Election` contracts. This pattern is key to scalability, as it isolates each election's state and logic.
    *   **Election.sol**: The contract for an individual election. It manages the election's state (status, dates), enforces voting rules, securely tallies votes, and maintains a record of voters to prevent duplicates.
*   **Data Storage (IPFS)**: To ensure cost-efficiency and decentralization, SonicVote uses the InterPlanetary File System (IPFS) via the **Pinata** pinning service. Large, descriptive data (like titles, descriptions, and options) is stored as JSON files on IPFS, while only the IPFS content identifier (CID) is stored on-chain.
*   **Data Indexing (The Graph)**: To provide a fast and responsive user experience, SonicVote uses a custom subgraph deployed to The Graph's hosted service. This subgraph listens for events emitted by the smart contracts (`ElectionCreated`, `VoteCast`), indexes this data, and serves it through a highly efficient **GraphQL API**. This completely avoids slow and cumbersome direct blockchain queries for fetching lists of elections or voting histories.

---

## 3. Core Features & User Flow

### 3.1. Creating an Election

The process of creating an election is designed to be seamless for the user but involves a coordinated effort between the frontend, IPFS, and the smart contract.

1.  **User Interaction**: The user fills out the "Create Election" form, providing details like the title, description, voting options, election type, and start/end dates.
2.  **Metadata Preparation**: The frontend constructs a JSON object containing all the descriptive metadata.
3.  **IPFS Upload**: This JSON object is uploaded to IPFS via Pinata. This operation returns a unique IPFS CID.
4.  **On-Chain Transaction**: The user signs a transaction that calls the `createElection` function on the `ElectionFactory` contract. The parameters for this function include the on-chain data (dates, election type) and the IPFS CID from the previous step.
5.  **Contract Deployment**: The `ElectionFactory` deploys a new, unique `Election` contract instance for this specific election.
6.  **Event Emission**: Upon successful creation, the factory emits an `ElectionCreated` event containing the address of the new `Election` contract.
7.  **Subgraph Indexing**: The Graph's indexer picks up this event and immediately adds the new election to its database, making it instantly visible on the SonicVote homepage.

### 3.2. Casting a Vote

1.  **User Selection**: On the `ElectionDetails` page, a connected user selects their vote based on the election's rules (e.g., choosing one option, ranking options, or distributing credits).
2.  **Vote Data Upload**: Similar to election creation, the details of the specific vote are packaged into a JSON object and uploaded to IPFS. This provides a transparent, off-chain receipt of the vote.
3.  **On-Chain Transaction**: The user signs a transaction that calls the appropriate vote-casting function (e.g., `castVoteSimple`, `castVoteDistribution`) on the specific `Election` contract. This transaction includes the vote itself and the IPFS CID of the vote data.
4.  **Contract Logic**: The `Election` contract performs several critical checks:
    *   Verifies the election is currently active.
    *   Ensures the user has not already voted.
    *   Validates the vote against the election's rules.
5.  **State Update**: If the vote is valid, the contract updates its internal state: the vote counts in the `results` mapping are updated, and the user's address is added to the `voters` set.
6.  **Event Emission**: The contract emits a `VoteCast` event.
7.  **Subgraph Indexing**: The subgraph indexes this event, updating the live results and adding the vote to the user's public voting history, which is visible on their dashboard.

---

## 4. Key Concepts & Design Choices

### 4.1. Scalability and Efficiency

SonicVote is built to handle a large number of elections and votes efficiently.

*   **Sonic Blockchain**: By building on Sonic, the platform benefits from its high throughput and extremely low transaction fees, making both creating and participating in elections highly affordable.
*   **Factory Contract Pattern**: Instead of a single monolithic contract, each election is its own contract. This isolates storage and logic, ensuring the platform's performance does not degrade as more elections are created.
*   **IPFS for Metadata**: Storing large JSON metadata off-chain on IPFS is significantly cheaper than storing it directly on the blockchain. This design choice drastically reduces the gas cost of creating an election, encouraging wider adoption.
*   **The Graph for Data Retrieval**: The use of a subgraph is a critical performance optimization. It allows the frontend to fetch complex queries (e.g., all active elections, a user's entire voting history) with a single, fast GraphQL request, providing a Web2-like user experience.

### 4.2. Election Metrics & Types

SonicVote provides clear metrics for each election:

*   **Status**: `Upcoming`, `Active`, or `Ended`, determined by the current time relative to the election's start and end dates.
*   **Total Voters**: A live count of unique addresses that have participated.
*   **Total Votes**: The sum of all votes cast, which can differ from Total Voters in mechanisms like Quadratic or Cumulative voting.

The platform supports multiple voting mechanisms to cater to diverse governance needs:
*   **Simple Majority**: One person, one vote.
*   **Quadratic Voting**: Allows users to express the intensity of their preference by "paying" for votes with credits, where the cost per vote increases quadratically.
*   **Ranked-Choice Voting**: Voters rank candidates in order of preference.
*   **Cumulative Voting**: Voters are given a block of votes they can distribute among candidates as they see fit.

### 4.3. Restricted Elections

For private or permissioned voting, SonicVote supports **Restricted Elections**. When creating an election, the organizer can provide a whitelist of wallet addresses.

*   **Implementation**: This whitelist is stored within the election's metadata on IPFS.
*   **Enforcement**: The frontend checks if a connected user's address is on this list before enabling the voting interface. This prevents non-whitelisted users from submitting a vote transaction, saving them gas fees on a transaction that would fail. While on-chain enforcement via a Merkle root is possible for higher security, the current implementation prioritizes cost-effectiveness for the election creator.

---

## 5. Deployment and Mainnet Readiness

SonicVote is not a prototype; it is a fully-featured application **deployed and operational on the Sonic Mainnet**.

*   **Contract Addresses**: The `ElectionFactory` address is configured for the Sonic Mainnet (`0x37D50136Ac1f6010AC6C4B67893434B366AF0aaF`).
*   **Network Configuration**: The application is pre-configured to connect users to the Sonic Mainnet RPC.
*   **Subgraph**: The GraphQL API endpoint points to a live, deployed subgraph that is actively indexing the Sonic Mainnet.
*   **Deployment**: The frontend is a static React application that can be deployed to any modern hosting platform like Vercel, Netlify, or Fleek for a fully decentralized deployment.

SonicVote is a production-ready, robust, and scalable solution for decentralized voting, built to leverage the full power and efficiency of the Sonic ecosystem.