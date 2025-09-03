import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, ArrowRight } from "lucide-react";

const elections = [
  {
    id: 1,
    title: "Community Governance Vote",
    description: "Vote on the next major feature for the platform.",
    status: "Active",
    endDate: "2024-08-15",
  },
  {
    id: 2,
    title: "Hackathon Winner Selection",
    description: "Choose the best project from the hackathon finalists.",
    status: "Active",
    endDate: "2024-08-10",
  },
  {
    id: 3,
    title: "DAO Treasury Allocation",
    description: "Decide how to allocate the treasury funds for Q3.",
    status: "Ended",
    endDate: "2024-07-30",
  },
];

const Index = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Elections Dashboard</h1>
          <p className="text-muted-foreground">
            View active elections or create a new one.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Election
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {elections.map((election) => (
          <Card key={election.id} className="flex flex-col bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>{election.title}</CardTitle>
              <CardDescription>{election.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                  election.status === 'Active' ? 'bg-green-900/50 text-green-300' : 'bg-gray-700/50 text-gray-300'
                }`}>
                  {election.status}
                </span>
                <span className="text-sm text-muted-foreground">
                  Ends: {election.endDate}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" className="w-full">
                View Details <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Index;