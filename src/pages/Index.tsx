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
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center py-16 md:py-24">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-br from-primary to-red-500 bg-clip-text text-transparent">
          SonicVote
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
          Streamlining the entire voting experience by letting you effortlessly create, manage, and participate in decentralized elections, all in one place.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button className="animated-hero-button group">
            <div className="flex items-center">
              <PlusCircle className="mr-2 h-5 w-5 transition-colors duration-500 group-hover:text-background z-10 relative" />
              <span className="button-content" data-text="Create Election">Create Election</span>
            </div>
          </button>
        </div>
      </div>

      {/* Elections List */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-center mb-8">
          Active Elections
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {elections.map((election) => (
            <Card key={election.id} className="flex flex-col bg-card/50 backdrop-blur-sm border-0 transition-all hover:bg-card/75 hover:scale-105">
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
                <Button variant="secondary" className="w-full group">
                  View Details <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;