import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, Vote, Users, Clock, Info } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useWallet } from "@/context/WalletContext";
import CountdownTimer from "@/components/CountdownTimer";

// Mock data
const mockElection = {
  id: 1,
  title: "Community Governance Vote",
  description: "Vote on the next major feature for the platform. This is a critical decision that will shape the future of our ecosystem. Please review all options carefully before casting your vote.",
  status: "Active",
  type: "Quadratic",
  endDate: "2024-12-15T23:59:59Z",
  totalVoters: 315,
  totalVotes: 415,
  options: [
    { id: 'a', text: "Decentralized Identity Integration", votes: 120 },
    { id: 'b', text: "Advanced Gamification Features", votes: 85 },
    { id: 'c', text: "Mobile App Development", votes: 210 },
  ],
};

const COLORS = ["#FF8042", "#0088FE", "#00C49F", "#FFBB28"];

const QuadraticVotingCard = ({ options, onVote, disabled }: any) => {
  const [votes, setVotes] = useState<{ [key: string]: number }>({});
  const [credits, setCredits] = useState(100);

  const handleVoteChange = (optionId: string, value: string) => {
    const numVotes = parseInt(value) || 0;
    const newVotes = { ...votes, [optionId]: numVotes };
    
    const totalCost = Object.values(newVotes).reduce((acc, v) => acc + (v * v), 0);
    
    if (totalCost <= 100) {
      setVotes(newVotes);
      setCredits(100 - totalCost);
    } else {
      showError("Not enough vote credits.");
    }
  };

  const totalVotes = Object.values(votes).reduce((acc, v) => acc + v, 0);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-0">
      <CardHeader>
        <CardTitle className="flex items-center">
          Cast Your Vote
          <span className="ml-2 text-sm font-normal text-primary">(Quadratic)</span>
        </CardTitle>
        <CardDescription>Allocate your 100 vote credits. Cost per vote increases quadratically (1 vote = 1 credit, 2 votes = 4 credits, etc).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-2 rounded-lg bg-primary/10">
          <p className="font-bold text-primary text-2xl">{credits}</p>
          <p className="text-sm text-muted-foreground">Vote Credits Remaining</p>
        </div>
        {options.map((option: any) => (
          <div key={option.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/70">
            <span className="font-medium">{option.text}</span>
            <Input 
              type="number" 
              min="0"
              className="w-20" 
              placeholder="0"
              value={votes[option.id] || ''}
              onChange={(e) => handleVoteChange(option.id, e.target.value)}
              disabled={disabled}
            />
          </div>
        ))}
        <Button onClick={() => onVote(votes)} disabled={disabled || totalVotes === 0} className="w-full">
          <Vote className="mr-2 h-4 w-4" /> Submit {totalVotes} Votes
        </Button>
      </CardContent>
    </Card>
  );
};

const SimpleVotingCard = ({ options, onVote, disabled }: any) => (
  <Card className="bg-card/50 backdrop-blur-sm border-0">
    <CardHeader>
      <CardTitle className="flex items-center">
        Cast Your Vote
        <span className="ml-2 text-sm font-normal text-primary">(Simple Majority)</span>
      </CardTitle>
      <CardDescription>Select one of the options below to cast your vote.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {options.map((option: any) => (
        <div key={option.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/70">
          <span className="font-medium">{option.text}</span>
          <Button onClick={() => onVote(option.id)} disabled={disabled}>
            <Vote className="mr-2 h-4 w-4" /> Vote
          </Button>
        </div>
      ))}
    </CardContent>
  </Card>
);

const ElectionDetails = () => {
  const { id } = useParams();
  const { isConnected } = useWallet();

  // In a real app, you would fetch election data based on the id
  const election = mockElection;

  const handleVote = (voteData: any) => {
    if (!isConnected) {
      showError("Please connect your wallet to vote.");
      return;
    }
    console.log(`Voted in election ${id}`, voteData);
    showSuccess("Your vote has been cast successfully!");
  };

  const isEnded = election.status === 'Ended';

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Elections</Link>
        </Button>
        <h1 className="text-4xl font-bold tracking-tight">{election.title}</h1>
        <p className="mt-2 text-muted-foreground">{election.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-0">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${election.status === 'Active' ? 'text-green-400' : 'text-gray-400'}`}>{election.status}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-0">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Voters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{election.totalVoters}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-0">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Time Remaining</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CountdownTimer endDate={election.endDate} />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {election.type === 'Quadratic' ? (
          <QuadraticVotingCard options={election.options} onVote={handleVote} disabled={isEnded} />
        ) : (
          <SimpleVotingCard options={election.options} onVote={handleVote} disabled={isEnded} />
        )}

        {/* Results Section */}
        <Card className="bg-card/50 backdrop-blur-sm border-0">
          <CardHeader>
            <CardTitle>Live Results</CardTitle>
            <CardDescription>Current vote distribution.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={election.options} margin={{ top: 5, right: 20, left: -10, bottom: 75 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="text" tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} interval={0} angle={-45} textAnchor="end" />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--accent))' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))'
                  }}
                />
                <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                  {election.options.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ElectionDetails;