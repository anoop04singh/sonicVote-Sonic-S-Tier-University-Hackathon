import {
  ElectionCreated as ElectionCreatedEvent,
} from "../generated/ElectionFactory/ElectionFactory"
import {
  VoteCast as VoteCastEvent,
  Election as ElectionContract,
} from "../generated/templates/Election/Election"
import { Election, Vote } from "../generated/schema"
import { Election as ElectionTemplate } from "../generated/templates"

// Handler for when the factory creates a new election
export function handleElectionCreated(event: ElectionCreatedEvent): void {
  let electionAddress = event.params.electionAddress
  let election = new Election(electionAddress.toHexString())
  
  // Fetch details directly from the new contract
  let contract = ElectionContract.bind(electionAddress)
  election.creator = contract.creator()
  election.startDate = contract.startDate()
  election.endDate = contract.endDate()
  election.metadataURI = contract.metadataURI()

  let type = contract.electionType()
  if (type == 0) election.electionType = "Simple Majority"
  if (type == 1) election.electionType = "Quadratic"
  if (type == 2) election.electionType = "Ranked-Choice"
  if (type == 3) election.electionType = "Cumulative"

  election.save()

  // Tell the subgraph to start indexing this new election contract
  ElectionTemplate.create(electionAddress)
}

// Handler for when a vote is cast in any election
export function handleVoteCast(event: VoteCastEvent): void {
  // Create a unique ID for the vote
  let voteId = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  let vote = new Vote(voteId)

  vote.election = event.address.toHexString() // The address of the election contract
  vote.voter = event.params.voter
  vote.ipfsURI = event.params.ipfsURI
  vote.timestamp = event.block.timestamp

  vote.save()
}