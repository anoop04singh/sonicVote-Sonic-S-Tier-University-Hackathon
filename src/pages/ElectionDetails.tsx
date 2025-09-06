import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, Vote, Users, Clock, Info } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useWallet } from "@/context/WalletContext";
import CountdownTimer from "@/components/CountdownTimer";
import { ethers } from "ethers";
import { ELECTION_ABI } from "@/contracts";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchFromIPFS } from "@/lib/ipfs";
import { LoadingModal } from "@/components/modals/LoadingModal";

const COLORS = ["#FF8042", "#0088FE", "#00C49F", "#FFBB28"];

// --- Voting Card Components ---
const SimpleVotingCard = ({ options, onVote, disabled }: any) => (
    <Card className="bg-card/50 backdrop-blur-sm border-0">
      <CardHeader>
        <CardTitle className="flex items-center">Cast Your Vote <span className="ml-2 text-sm font-normal text-primary">(Simple Majority)</span></CardTitle>
        <CardDescription>Select one of the options below to cast your vote.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {options.map((option: any) => (
          <div key={option.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/70">
            <span className="font-medium">{option.text}</span>
            <Button onClick={() => onVote(option.text)} disabled={disabled}><Vote className="mr-2 h-4 w-4" /> Vote</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
  
  const QuadraticVotingCard = ({ options, onVote, disabled, voteCredits = 100 }: any) => {
    const [votes, setVotes] = useState<{ [key: string]: number }>({});
    const [credits, setCredits] = useState(voteCredits);
  
    const handleVoteChange = (optionText: string, value: string) => {
      const numVotes = parseInt(value) || 0;
      const newVotes = { ...votes, [optionText]: numVotes };
      const totalCost = Object.values(newVotes).reduce((acc, v) => acc + (v * v), 0);
      if (totalCost <= voteCredits) {
        setVotes(newVotes);
        setCredits(voteCredits - totalCost);
      } else {
        showError("Not enough vote credits.");
      }
    };
    const totalVotes = Object.values(votes).reduce((acc, v) => acc + v, 0);
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center">Cast Your Vote <span className="ml-2 text-sm font-normal text-primary">(Quadratic)</span></CardTitle>
          <CardDescription>Allocate your {voteCredits} vote credits. Cost per vote increases quadratically (1 vote = 1 credit, 2 votes = 4 credits, etc).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-2 rounded-lg bg-primary/10"><p className="font-bold text-primary text-2xl">{credits}</p><p className="text-sm text-muted-foreground">Vote Credits Remaining</p></div>
          {options.map((option: any) => (
            <div key={option.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/70">
              <span className="font-medium">{option.text}</span>
              <Input type="number" min="0" className="w-20" placeholder="0" value={votes[option.text] || ''} onChange={(e) => handleVoteChange(option.text, e.target.value)} disabled={disabled} />
            </div>
          ))}
          <Button onClick={() => onVote(votes)} disabled={disabled || totalVotes === 0} className="w-full"><Vote className="mr-2 h-4 w-4" /> Submit {totalVotes} Votes</Button>
        </CardContent>
      </Card>
    );
  };
  
  const RankedChoiceVotingCard = ({ options, onVote, disabled }: any) => {
    const [ranks, setRanks] = useState<{ [key: string]: number | undefined }>({});
    const usedRanks = Object.values(ranks).filter(r => r !== undefined);
    const handleRankChange = (optionText: string, rank: string) => {
      setRanks(prev => ({ ...prev, [optionText]: parseInt(rank) || undefined }));
    };
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center">Cast Your Vote <span className="ml-2 text-sm font-normal text-primary">(Ranked-Choice)</span></CardTitle>
          <CardDescription>Rank the options in order of your preference. 1 is your top choice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {options.map((option: any) => (
            <div key={option.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/70">
              <span className="font-medium">{option.text}</span>
              <Select onValueChange={(value) => handleRankChange(option.text, value)} disabled={disabled}>
                <SelectTrigger className="w-24"><SelectValue placeholder="Rank" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: options.length }, (_, i) => i + 1).map(rank => (
                    <SelectItem key={rank} value={String(rank)} disabled={usedRanks.includes(rank) && ranks[option.text] !== rank}>
                      {rank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <Button onClick={() => onVote(ranks)} disabled={disabled || usedRanks.length !== options.length} className="w-full"><Vote className="mr-2 h-4 w-4" /> Submit Ranks</Button>
        </CardContent>
      </Card>
    );
  };
  
  const CumulativeVotingCard = ({ options, onVote, disabled, voteCredits = 10 }: any) => {
    const [votes, setVotes] = useState<{ [key: string]: number }>({});
    const [credits, setCredits] = useState(voteCredits);
    const handleVoteChange = (optionText: string, value: string) => {
      const numVotes = parseInt(value) || 0;
      const newVotes = { ...votes, [optionText]: numVotes };
      const totalCost = Object.values(newVotes).reduce((acc, v) => acc + v, 0);
      if (totalCost <= voteCredits) {
        setVotes(newVotes);
        setCredits(voteCredits - totalCost);
      } else {
        showError("Not enough votes.");
      }
    };
    const totalVotes = Object.values(votes).reduce((acc, v) => acc + v, 0);
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center">Cast Your Vote <span className="ml-2 text-sm font-normal text-primary">(Cumulative)</span></CardTitle>
          <CardDescription>Distribute your {voteCredits} votes among the options as you see fit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-2 rounded-lg bg-primary/10"><p className="font-bold text-primary text-2xl">{credits}</p><p className="text-sm text-muted-foreground">Votes Remaining</p></div>
          {options.map((option: any) => (
            <div key={option.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/70">
              <span className="font-medium">{option.text}</span>
              <Input type="number" min="0" className="w-20" placeholder="0" value={votes[option.text] || ''} onChange={(e) => handleVoteChange(option.text, e.target.value)} disabled={disabled} />
            </div>
          ))}
          <Button onClick={() => onVote(votes)} disabled={disabled || totalVotes === 0} className="w-full"><Vote className="mr-2 h-4 w-4" /> Submit {totalVotes} Votes</Button>
        </CardContent>
      </Card>
    );
  };

const ElectionDetails = () => {
  const { address } = useParams();
  const { isConnected, signer, provider } = useWallet();
  const [election, setElection] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const fetchElectionDetails = async () => {
      if (!provider || !address) return;
      setIsLoading(true);
      try {
        const electionContract = new ethers.Contract(address, ELECTION_ABI, provider);
        const details = await electionContract.getElectionDetails();
        
        const onChainData = {
          address,
          creator: details[0],
          status: Number(details[1]),
          electionType: Number(details[2]),
          endDate: details[3],
          metadataURI: details[4],
          totalVoters: details[5],
          startDate: details[6],
        };

        const ipfsHash = onChainData.metadataURI.replace('ipfs://', '');
        const metadata = await fetchFromIPFS(ipfsHash);

        const optionsWithVotes = await Promise.all(
            metadata.options.map(async (option: any) => {
                const votes = await electionContract.results(option.text);
                return { ...option, votes: Number(votes) };
            })
        );

        setElection({
          ...onChainData,
          ...metadata,
          options: optionsWithVotes,
        });
      } catch (error) {
        console.error("Failed to fetch election details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchElectionDetails();
  }, [provider, address]);

  const handleVote = async (voteData: any) => {
    if (!isConnected || !signer || !address) {
      showError("Please connect your wallet to vote.");
      return;
    }
    setIsVoting(true);
    try {
      const electionContract = new ethers.Contract(address, ELECTION_ABI, signer);
      let tx;
      const voteURI = "ipfs://placeholder_vote_data"; // Simulated IPFS URI for vote receipt

      switch (election.electionType) {
        case 0: // Simple Majority
          tx = await electionContract.castVoteSimple(voteData, voteURI);
          break;
        case 1: // Quadratic
        case 3: // Cumulative
          const optionIds = Object.keys(voteData);
          const votes = optionIds.map(id => voteData[id]);
          tx = await electionContract.castVoteDistribution(optionIds, votes, voteURI);
          break;
        case 2: // Ranked-Choice
          const rankedOptions = Object.entries(voteData)
            .sort(([, rankA], [, rankB]) => (rankA as number) - (rankB as number))
            .map(([optionText]) => optionText);
          tx = await electionContract.castVoteRankedChoice(rankedOptions, voteURI);
          break;
        default:
          throw new Error("Unknown election type");
      }

      await tx.wait();
      showSuccess("Your vote has been cast successfully!");
    } catch (error: any) {
      console.error("Vote failed:", error);
      showError(error?.reason || "An error occurred while voting.");
    } finally {
      setIsVoting(false);
    }
  };

  const renderVotingCard = () => {
    if (!election) return null;
    const isNotActive = election.status !== 1;
    const electionTypes = ["Simple Majority", "Quadratic", "Ranked-Choice", "Cumulative"];
    const type = electionTypes[election.electionType];

    switch (type) {
      case 'Simple Majority':
        return <SimpleVotingCard options={election.options} onVote={handleVote} disabled={isNotActive} />;
      case 'Quadratic':
        return <QuadraticVotingCard options={election.options} onVote={handleVote} disabled={isNotActive} voteCredits={election.voteCredits} />;
      case 'Ranked-Choice':
        return <RankedChoiceVotingCard options={election.options} onVote={handleVote} disabled={isNotActive} />;
      case 'Cumulative':
        return <CumulativeVotingCard options={election.options} onVote={handleVote} disabled={isNotActive} voteCredits={election.voteCredits} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-8 w-3/4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    );
  }

  if (!election) {
    return <div>Election not found.</div>;
  }

  return (
    <>
      <LoadingModal isOpen={isVoting} message="Submitting your vote on-chain..." />
      <div className="space-y-8">
        <div>
          <Button asChild variant="ghost" className="mb-4"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Elections</Link></Button>
          <h1 className="text-4xl font-bold tracking-tight">{election.title}</h1>
          <p className="mt-2 text-muted-foreground">{election.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-0"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Status</CardTitle><Info className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={`text-2xl font-bold ${election.status === 1 ? 'text-green-400' : 'text-gray-400'}`}>{["Upcoming", "Active", "Ended"][election.status]}</div></CardContent></Card>
          <Card className="bg-card/50 backdrop-blur-sm border-0"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Voters</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{election.totalVoters.toString()}</div></CardContent></Card>
          <Card className="bg-card/50 backdrop-blur-sm border-0"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Time Remaining</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><CountdownTimer endDate={new Date(Number(election.endDate) * 1000).toISOString()} /></CardContent></Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {renderVotingCard()}
          <Card className="bg-card/50 backdrop-blur-sm border-0">
            <CardHeader><CardTitle>Live Results</CardTitle><CardDescription>Current vote distribution.</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={election.options} margin={{ top: 5, right: 20, left: -10, bottom: 75 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="text" tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} interval={0} angle={-45} textAnchor="end" />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip cursor={{ fill: 'hsl(var(--accent))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
                  <Bar dataKey="votes" radius={[4, 4, 0, 0]}>{election.options.map((_entry: any, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ElectionDetails;