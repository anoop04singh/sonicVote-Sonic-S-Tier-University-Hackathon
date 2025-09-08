export interface ElectionTypeInfo {
  name: string;
  description: string;
  resultCalculation: string;
}

export const electionTypeDetails: { [key: string]: ElectionTypeInfo } = {
  "Simple Majority": {
    name: "Simple Majority",
    description: "In a Simple Majority election, each participant gets a single vote. You can cast your vote for only one of the available options.",
    resultCalculation: "The winner is the option that receives the highest number of individual votes. The results are straightforward and based on a direct count."
  },
  "Quadratic": {
    name: "Quadratic Voting",
    description: "Quadratic Voting allows participants to express the intensity of their preference. You are given a budget of 'vote credits' and can buy votes for any option. The cost of each additional vote for the same option increases quadratically (1 vote = 1 credit, 2 votes = 4 credits, 3 votes = 9 credits, etc.).",
    resultCalculation: "The winner is the option with the highest total number of votes purchased. This method balances the influence of passionate minorities against the preferences of a less-invested majority."
  },
  "Ranked-Choice": {
    name: "Ranked-Choice Voting",
    description: "In a Ranked-Choice election, you don't just pick one option; you rank them in order of preference (1st, 2nd, 3rd, etc.). This allows for a more nuanced expression of your choices.",
    resultCalculation: "If an option wins a majority of first-preference votes, it is the winner. If not, the option with the fewest first-preference votes is eliminated. Voters who picked the eliminated option as their first choice have their votes transferred to their next choice. This process repeats until one option has a majority."
  },
  "Cumulative": {
    name: "Cumulative Voting",
    description: "Cumulative Voting provides each participant with a block of votes (e.g., 10 votes) that they can distribute among the available options in any way they see fit. You can give all your votes to one option, or spread them across multiple options.",
    resultCalculation: "The winner is the option that accumulates the highest total number of votes from all participants. This system is often used to help minority groups achieve representation."
  }
};