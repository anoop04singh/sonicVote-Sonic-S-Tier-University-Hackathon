# SonicVote: Backend & Smart Contract Integration Guide

## 1. Introduction

This document outlines the technical specifications for the backend of the SonicVote application, focusing on the smart contract architecture and the data storage strategy using the InterPlanetary File System (IPFS). This guide is intended for blockchain developers responsible for implementing the on-chain logic and data handling.

The architecture is designed to be efficient and cost-effective by storing essential, state-critical data on-chain while offloading larger metadata to IPFS.

---

## 2. IPFS Data Structures

To minimize on-chain storage costs, we will store detailed metadata about elections and individual votes on IPFS. The smart contract will only store a reference (the IPFS CID or URI) to this data.

### 2.1. Election Metadata

When a new election is created, the frontend will construct a JSON object with the following structure, upload it to IPFS, and pass the resulting URI to the smart contract.

**Schema: `ElectionMetadata`**

```json
{
  "title": "string",
  "description": "string",
  "options": [
    { "id": "a", "text": "Option 1 Description" },
    { "id": "b", "text": "Option 2 Description" },
    { "id": "c", "text": "Option 3 Description" }
  ]
}
```

-   **`title`**: The official title of the election.
-   **`description`**: A detailed explanation of the election's purpose.
-   **`options`**: An array of objects, where each object represents a votable option. The `id` should be a unique, simple identifier used for casting votes.

### 2.2. Vote Data

To maintain voter privacy and support complex voting mechanisms, the details of each vote are also stored on IPFS. The structure of this JSON object will vary depending on the election's voting mechanism.

**Schema: `VoteData` (Simple Majority)**

```json
{
  "electionId": "string", // On-chain address/ID of the election
  "selectedOption": "string" // The 'id' of the chosen option
}
```

**Schema: `VoteData` (Quadratic & Cumulative)**

```json
{
  "electionId": "string",
  "votes": {
    "a": 5, // 'id' of option A receives 5 votes
    "c": 2  // 'id' of option C receives 2 votes
  }
}
```

**Schema: `VoteData` (Ranked-Choice)**

```json
{
  "electionId": "string",
  "ranks": [
    "c", // 1st choice
    "a", // 2nd choice
    "b"  // 3rd choice
  ]
}
```

---

## 3. Smart Contract Architecture

The smart contract is the core of the decentralized application, responsible for managing the state of elections, authorizing actions, and tallying votes securely.

### 3.1. On-Chain State: The `Election` Account

Each election will be represented by a dedicated account on the blockchain. This account stores the minimal, essential data required for the contract's logic.

**`Election` Account Structure:**

-   **`id` (Pubkey)**: The unique identifier/address for this election account.
-   **`creator` (Pubkey)**: The wallet address of the user who created the election.
-   **`status` (Enum)**: The current state of the election (`Upcoming`, `Active`, `Ended`).
-   **`election_type` (Enum)**: The voting mechanism (`SimpleMajority`, `Quadratic`, `RankedChoice`, `Cumulative`).
-   **`end_date` (Timestamp)**: The timestamp when the election automatically closes.
-   **`metadata_uri` (String)**: The IPFS URI pointing to the `ElectionMetadata` JSON.
-   **`results` (Map<String, u64>)**: A map to store the vote tally. The key is the option `id` and the value is the vote count. For ranked-choice, this could store first-preference votes.
-   **`voters` (Set<Pubkey>)**: A set of wallet addresses that have already voted, to prevent duplicate voting.

### 3.2. Required Contract Functions (Instructions)

The following functions are required to power the frontend application.

#### **`create_election`**

Creates a new election account on the blockchain.

-   **Description**: Initializes a new `Election` account with the provided details. Sets the initial status to `Active` (or `Upcoming` if a start date is implemented).
-   **Caller**: Any user.
-   **Parameters**:
    -   `metadata_uri: String` - The IPFS URI for the `ElectionMetadata`.
    -   `end_date: Timestamp` - The election's closing time.
    -   `election_type: Enum` - The chosen voting mechanism.
-   **Actions**:
    1.  Creates and initializes a new `Election` account.
    2.  Stores the creator's public key.
    3.  Sets the `status`, `end_date`, `election_type`, and `metadata_uri`.
    4.  Initializes the `results` map with all option IDs set to 0.

#### **`cast_vote`**

Casts a vote in a specific election.

-   **Description**: Allows a user to participate in an active election. The contract must validate the vote against the election's rules.
-   **Caller**: Any user who has not yet voted in this election.
-   **Parameters**:
    -   `election_id: Pubkey` - The address of the `Election` account.
    -   `vote_data_uri: String` - The IPFS URI for the `VoteData` JSON.
-   **Actions**:
    1.  Fetch the `Election` account using `election_id`.
    2.  Verify that the election `status` is `Active`.
    3.  Check that the caller's public key is not already in the `voters` set.
    4.  **Crucially, the contract must fetch the `vote_data_uri` from IPFS (via an oracle or off-chain computation) to get the vote details.**
    5.  Based on the `election_type`, validate and process the vote from the fetched JSON.
        -   *Simple Majority*: Increment the count for the `selectedOption`.
        -   *Quadratic/Cumulative*: Validate the total number of votes/credits used and update the counts for each option in the `votes` map.
        -   *Ranked-Choice*: Increment the first-preference vote count for the first item in the `ranks` array.
    6.  Add the caller's public key to the `voters` set.
    7.  Update the `results` map in the `Election` account.

#### **`get_election_data`**

Retrieves the on-chain data for a given election.

-   **Description**: A read-only function to fetch the current state of an election.
-   **Caller**: Any user.
-   **Parameters**:
    -   `election_id: Pubkey` - The address of the `Election` account.
-   **Returns**: The full `Election` account data structure.

#### **`close_election`**

(Optional but Recommended) A function to finalize an election's results.

-   **Description**: Can be called by anyone after the `end_date` has passed. It formally changes the election `status` to `Ended`.
-   **Caller**: Any user.
-   **Parameters**:
    -   `election_id: Pubkey` - The address of the `Election` account.
-   **Actions**:
    1.  Fetch the `Election` account.
    2.  Verify that the current timestamp is past the `end_date`.
    3.  Change the `status` to `Ended`.
    4.  (For Ranked-Choice): Perform the runoff calculation to determine the final winner.