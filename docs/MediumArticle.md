# SonicVote: Building a Blazing-Fast, Decentralized Voting Platform on the Sonic Blockchain

### A deep dive into the architecture, user experience, and technical decisions behind our Sonic Hackathon project.

---

**(Video Intro Music Starts)**

Hello everyone, and welcome! Today, we're going to take a look at SonicVote, a fully decentralized, transparent, and secure voting platform built from the ground up on the Sonic blockchain for the Sonic Hackathon.

Traditional voting systems can be opaque, and on many blockchains, they're slow and expensive. We wanted to solve that. Our goal was to create an application with a Web2 user experience—fast, intuitive, and responsive—but with all the security and transparency of Web3.

Let's dive in and see how it works.

---

## The User Experience: A Visual Tour

**(Video: Start screen recording of the application)**

### 1. The Landing Page

`[Show the SonicVote homepage]`

When you first land on SonicVote, you're greeted with a clean, modern interface. At the top, our hero section clearly states the mission.

As you scroll down, you see key platform metrics in real-time: the total number of elections created, how many are currently active, and the total votes cast across the entire platform. These numbers are powered by our subgraph and update automatically.

Below that is the heart of the application: the election list. We've organized it into three simple tabs: **Active**, **Upcoming**, and **Ended**, so users can easily find what they're looking for. Each election card gives you a snapshot of the title, status, voting method, and voter count.

### 2. Connecting Your Wallet & Creating an Election

`[Show the "Connect Wallet" flow, then open the "Create Election" modal]`

To participate, you first need to connect your wallet. A click on the "Connect Wallet" button brings up a modal, and with one more click, we're securely connected to the Sonic network via MetaMask.

Now, let's create an election. The "Create Election" form is designed to be incredibly user-friendly. You can input a title, a detailed description, and set the start and end dates.

Crucially, you can choose from four different voting mechanisms:
*   **Simple Majority**: One person, one vote.
*   **Quadratic Voting**: Express the intensity of your preference.
*   **Ranked-Choice**: Rank your options in order.
*   **Cumulative**: Distribute a block of votes as you see fit.

We've also added a feature for **Restricted Elections**, where you can paste a list of wallet addresses that are exclusively allowed to vote—perfect for private DAOs or team decisions.

### 3. Voting in an Election

`[Navigate to an active Election Details page]`

When you click into an active election, you get a detailed view. You can see the current status, total voter count, and a live countdown timer showing exactly how much time is left to vote.

We also provide a helpful info box that explains the rules for the specific voting type, so users are never confused.

`[Show the voting card for a Simple Majority or Quadratic election]`

The voting card itself is dynamic. For a Simple Majority election, it's a straightforward choice. For something like Quadratic Voting, the interface allows you to allocate your vote credits, automatically calculating the remaining balance.

Once you cast your vote, a transaction is sent to your wallet to be signed. While it's processing, we show a loading indicator. And once it's confirmed on the Sonic blockchain, you get an instant success notification.

### 4. The Dashboard: Your Voting History

`[Navigate to the Dashboard page]`

Finally, the user dashboard. This page provides a complete history of every election you've participated in. You can see the election title, its status, and your vote. For full transparency, you can expand each entry to see the exact data you submitted and a direct link to the vote's receipt on IPFS.

---

## The Architecture: How We Made It So Fast

A great user experience on-chain is all about smart architecture. We designed SonicVote to be as efficient as possible.

`[Show the architecture diagram]`

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

Here’s how the pieces fit together:

1.  **Smart Contracts on Sonic**: The `ElectionFactory` contract deploys a new, separate `Election` contract for each poll. This keeps things organized and scalable.
2.  **IPFS for Metadata**: Storing lots of text data like titles and descriptions on-chain is expensive. So, we package all of that into a JSON file and upload it to IPFS. The smart contract only needs to store the IPFS hash, which is incredibly cheap.

    *Here’s what the election metadata looks like:*
    ```json
    {
      "title": "Community Governance Vote",
      "description": "Vote on the next major feature for the platform.",
      "options": [
        { "id": "a", "text": "Decentralized Identity Integration" },
        { "id": "b", "text": "Advanced Gamification Features" }
      ]
    }
    ```

3.  **The Graph for Data Indexing**: Querying the blockchain directly for a list of all elections would be slow. Instead, our smart contracts emit events for every important action, like `ElectionCreated` or `VoteCast`.

    *A peek at our `ElectionCreated` event in Solidity:*
    ```solidity
    event ElectionCreated(
        address indexed electionAddress,
        address indexed creator
    );
    ```
    A custom subgraph listens for these events and indexes the data into a highly efficient database. Our frontend can then fetch all the data it needs with a single, lightning-fast GraphQL query.

    *The GraphQL query for fetching elections:*
    ```graphql
    query GetElections {
      elections(orderBy: startDate, orderDirection: desc) {
        id
        metadataURI
        // ... and other fields
      }
    }
    ```
    This combination of IPFS and The Graph is the secret to SonicVote's speed.

---

## Why Build on Sonic?

Building on Sonic was a key decision. Its high throughput and incredibly low transaction fees mean that creating an election or casting a vote costs mere fractions of a cent and confirms in seconds. This makes decentralized governance accessible to everyone, not just those who can afford high gas fees.

The EVM compatibility also allowed us to use familiar tools like Solidity and Hardhat, making the development process smooth and efficient.

---

## Conclusion

SonicVote is more than just a hackathon project; it's a blueprint for building high-performance, user-friendly dApps. By intelligently combining the on-chain security of Sonic with off-chain solutions like IPFS and The Graph, we've built a platform that is both powerful and a pleasure to use.

Thank you for joining this tour of SonicVote.

**(Video Outro Music Starts)**

---
### Project Links:
*   **Live Demo**: [Link to your deployed application]
*   **GitHub Repository**: [Link to your GitHub repo]
*   **Factory Contract on SonicScan**: [https://sonicscan.org/address/0x37D50136Ac1f6010AC6C4B67893434B366AF0aaF](https://sonicscan.org/address/0x37D50136Ac1f6010AC6C4B67893434B366AF0aaF)