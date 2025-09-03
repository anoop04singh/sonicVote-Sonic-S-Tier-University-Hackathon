import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Vote } from "lucide-react";
import { showSuccess } from "@/utils/toast";

// Mock data
const mockElection = {
  id: 1,
  title: "Community Governance Vote",
  description: "Vote on the next major feature for the platform. This is a critical decision that will shape the future of our ecosystem. Please review all options carefully before casting your vote.",
  status: "Active",
  endDate: "2024-08-15",
  options: [
    { id: 'a', text: "Decentralized Identity Integration", votes: 120 },
    { id: 'b', text: "Advanced Gamification Features", votes: 85 },
    { id: 'c', text: "Mobile App Development", votes: 210 },
  ],
};

const ElectionDetails = () => {
  const { id } = useParams();

  // In a real app, you would fetch election data based on the id
  const election = mockElection;

  const handleVote = (optionId: string) => {
    console.log(`Voted for option ${optionId} in election ${id}`);
    showSuccess("Your vote has been cast successfully!");
  };

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Elections</Link>
        </Button>
        <h1 className="text-4xl font-bold tracking-tight">{election.title}</h1>
        <p className="mt-2 text-muted-foreground">{election.description}</p>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span className={`font-medium px-2.5 py-0.5 rounded-full ${
            election.status === 'Active' ? 'bg-green-900/50 text-green-300' : 'bg-gray-700/50 text-gray-300'
          }`}>
            {election.status}
          </span>
          <span className="text-muted-foreground">
            Ends: {election.endDate}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Voting Section */}
        <Card className="bg-card/50 backdrop-blur-sm border-0">
          <CardHeader>
            <CardTitle>Cast Your Vote</CardTitle>
            <CardDescription>Select one of the options below to cast your vote.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {election.options.map((option) => (
              <div key={option.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/70">
                <span className="font-medium">{option.text}</span>
                <Button onClick={() => handleVote(option.id)} disabled={election.status !== 'Active'}>
                  <Vote className="mr-2 h-4 w-4" /> Vote
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="bg-card/50 backdrop-blur-sm border-0">
          <CardHeader>
            <CardTitle>Live Results</CardTitle>
            <CardDescription>Current vote distribution.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={election.options} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="text" tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} interval={0} angle={-30} textAnchor="end" height={80} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--accent))' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))'
                  }}
                />
                <Bar dataKey="votes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ElectionDetails;