import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, Vote, Users, Clock, Info, ShieldCheck, ShieldAlert } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useWallet } from "@/context/WalletContext";
import CountdownTimer from "@/components/CountdownTimer";
import { ethers } from "ethers";
import { ELECTION_ABI } from "@/contracts";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchFromIPFS, uploadToPinata } from "@/lib/ipfs";
import { LoadingModal } from "@/components/modals/LoadingModal";
import { electionTypeDetails } from "@/data/electionTypes";
import ElectionWinner from "@/components/ElectionWinner";

const COLORS = ["#FF8042", "#0088FE", "#00C49F", "#FFBB28"];
const ELECTION_TYPES = ["Simple Majority", "Quadratic", "Ranked-Choice", "Cumulative"];

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
  const { address: electionAddress } = useParams();
  const { isConnected, signer, provider, address: userAddress } = useWallet();
  const [election, setElection] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [isCheckingVoteStatus, setIsCheckingVoteStatus] = useState(true);

  useEffect(() => {
    const fetchElectionDetails = async () => {
      if (!provider || !electionAddress) return;
      setIsLoading(true);
      try {
        const electionContract = new ethers.Contract(electionAddress, ELECTION_ABI, provider);
        const details = await electionContract.getElectionDetails();
        
        const onChainData = {
          address: electionAddress,
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
  }, [provider, electionAddress]);

  useEffect(() => {
    const checkVoteStatus = async () => {
      if (!provider || !electionAddress || !userAddress) {
        setIsCheckingVoteStatus(false);
        return;
      }
      setIsCheckingVoteStatus(true);
      try {
        const electionContract = new ethers.Contract(electionAddress, ELECTION_ABI, provider);
        const userHasVoted = await electionContract.voters(userAddress);
        setHasVoted(userHasVoted);
      } catch (error) {
        console.error("Failed to check vote status:", error);
        setHasVoted(false);
      } finally {
        setIsCheckingVoteStatus(false);
      }
    };

    if (election) {
      checkVoteStatus();
    }
  }, [provider, electionAddress, userAddress, election]);

  const handleVote = async (voteData: any) => {
    if (!isConnected || !signer || !electionAddress || !userAddress) {
      showError("Please connect your wallet to vote.");
      return;
    }

    setIsVoting(true);
    setLoadingMessage("Verifying your voting eligibility...");

    try {
      const electionContract = new ethers.Contract(electionAddress, ELECTION_ABI, signer);
      const userHasVoted = await electionContract.voters(userAddress);
      if (userHasVoted) {
        showError("You have already voted in this election.");
        setHasVoted(true);
        setIsVoting(false);
        return;
      }

      let voteJSON: object;
      let tx;

      setLoadingMessage("Uploading vote data to IPFS...");
      
      switch (election.electionType) {
        case 0: // Simple Majority
          voteJSON = { electionId: electionAddress, selectedOption: voteData, voter: userAddress };
          const simpleVoteIpfsHash = await uploadToPinata(voteJSON);
          setLoadingMessage("Submitting your vote on-chain...");
          tx = await electionContract.castVoteSimple(voteData, `ipfs://${simpleVoteIpfsHash}`);
          break;
        case 1: // Quadratic
        case 3: // Cumulative
          voteJSON = { electionId: electionAddress, votes: voteData, voter: userAddress };
          const distVoteIpfsHash = await uploadToPinata(voteJSON);
          setLoadingMessage("Submitting your vote on-chain...");
          const optionIds = Object.keys(voteData);
          const votes = optionIds.map(id => voteData[id]);
          tx = await electionContract.castVoteDistribution(optionIds, votes, `ipfs://${distVoteIpfsHash}`);
          break;
        case 2: // Ranked-Choice
          const rankedOptions = Object.entries(voteData)
            .sort(([, rankA], [, rankB]) => (rankA as number) - (rankB as number))
            .map(([optionText]) => optionText);
          voteJSON = { electionId: electionAddress, ranks: rankedOptions, voter: userAddress };
          const rankedVoteIpfsHash = await uploadToPinata(voteJSON);
          setLoadingMessage("Submitting your vote on-chain...");
          tx = await electionContract.castVoteRankedChoice(rankedOptions, `ipfs://${rankedVoteIpfsHash}`);
          break;
        default:
          throw new Error("Unknown election type");
      }

      await tx.wait();
      showSuccess("Your vote has been cast successfully!");
      setHasVoted(true);
    } catch (error: any) {
      console.error("Vote failed:", error);
      showError(error?.reason || "An error occurred while voting.");
    } finally {
      setIsVoting(false);
    }
  };

  const getEffectiveStatus = (status: number, startDate: number, endDate: number) => {
    const nowInSeconds = Date.now() / 1000;
    if (status !== 2 && nowInSeconds >= endDate) {
      return 2; // Ended
    }
    if (status === 0 && nowInSeconds >= startDate) {
      return 1; // Active
    }
    return status;
  };

  const renderVotingCard = () => {
    if (!election || !userAddress) return null;
    
    if (hasVoted) {
      return (
        <Alert variant="default" className="bg-green-900/50 text-green-300 border-green-700/60">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Vote Submitted</AlertTitle>
          <AlertDescription>
            Your vote has been successfully recorded for this election. Thank you for your participation.
          </AlertDescription>
        </Alert>
      );
    }

    const effectiveStatus = getEffectiveStatus(election.status, Number(election.startDate), Number(election.endDate));
    const isWhitelisted = election.isRestricted 
      ? election.voterList.map((a: string) => a.toLowerCase()).includes(userAddress.toLowerCase())
      : true;
    
    const canVote = effectiveStatus === 1 && isWhitelisted;
    const voteDisabled = !canVote || isVoting || isCheckingVoteStatus;
    const type = ELECTION_TYPES[election.electionType];

    return (
      <div>
        {election.isRestricted && !isWhitelisted && effectiveStatus === 1 && (
          <Alert variant="destructive" className="mb-4">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Not Eligible to Vote</AlertTitle>
            <AlertDescription>
              This is a restricted election and your connected wallet is not on the voter list.
            </AlertDescription>
          </Alert>
        )}
        {(() => {
          switch (type) {
            case 'Simple Majority':
              return <SimpleVotingCard options={election.options} onVote={handleVote} disabled={voteDisabled} />;
            case 'Quadratic':
              return <QuadraticVotingCard options={election.options} onVote={handleVote} disabled={voteDisabled} voteCredits={election.voteCredits} />;
            case 'Ranked-Choice':
              return <RankedChoiceVotingCard options={election.options} onVote={handleVote} disabled={voteDisabled} />;
            case 'Cumulative':
              return <CumulativeVotingCard options={election.options} onVote={handleVote} disabled={voteDisabled} voteCredits={election.voteCredits} />;
            default:
              return null;
          }
        })()}
      </div>
    );
  };

  if (isLoading) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-8 w-3/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Skeleton className="h-24 w-full" />
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

  const effectiveStatus = getEffectiveStatus(election.status, Number(election.startDate), Number(election.endDate));
  const electionTypeName = ELECTION_TYPES[election.electionType];
  const typeDetails = electionTypeDetails[electionTypeName];

  return (
    <>
      <LoadingModal isOpen={isVoting} message={loadingMessage} />
      <div className="space-y-8">
        <div>
          <Button asChild variant="ghost" className="mb-4"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Elections</Link></Button>
          <h1 className="text-4xl font-bold tracking-tight">{election.title}</h1>
          <p className="mt-2 text-muted-foreground">{election.description}</p>
        </div>

        {effectiveStatus === 2 && <ElectionWinner election={election} />}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-0"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Status</CardTitle><Info className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={`text-2xl font-bold ${effectiveStatus === 1 ? 'text-green-400' : effectiveStatus === 0 ? 'text-blue-400' : 'text-gray-400'}`}>{["Upcoming", "Active", "Ended"][effectiveStatus]}</div></CardContent></Card>
          <Card className="bg-card/50 backdrop-blur-sm border-0"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Voters</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{election.totalVoters.toString()}</div></CardContent></Card>
          <Card className="bg-card/50 backdrop-blur-sm border-0"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Eligibility</CardTitle>{election.isRestricted ? <ShieldAlert className="h-4 w-4 text-muted-foreground" /> : <ShieldCheck className="h-4 w-4 text-muted-foreground" />}</CardHeader><CardContent><div className="text-2xl font-bold">{election.isRestricted ? "Restricted" : "Open to All"}</div></CardContent></Card>
          <Card className="bg-card/50 backdrop-blur-sm border-0"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{effectiveStatus === 0 ? "Time Until Start" : "Time Remaining"}</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><CountdownTimer endDate={new Date(Number(effectiveStatus === 0 ? election.startDate : election.endDate) * 1000).toISOString()} /></CardContent></Card>
        </div>

        {typeDetails && (
          <Card className="bg-card/50 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="mr-2 h-5 w-5 text-primary" />
                About {electionTypeName} Voting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{typeDetails.description}</p>
              <div>
                <h4 className="font-semibold text-card-foreground/90">How Results are Calculated</h4>
                <p className="text-muted-foreground mt-1">{typeDetails.resultCalculation}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {effectiveStatus !== 2 && renderVotingCard()}
          <Card className="bg-card/50 backdrop-blur-sm border-0 md:col-span-2">
            <CardHeader><CardTitle>Results</CardTitle><CardDescription>Final vote distribution.</CardDescription></CardHeader>
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