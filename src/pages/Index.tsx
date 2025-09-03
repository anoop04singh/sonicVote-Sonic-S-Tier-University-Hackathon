import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Hero from "@/components/Hero";

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
    <div>
      <Hero />
      <section className="relative py-16 mt-[-200px]">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-12">
              <h2 className="mb-5 text-3xl font-bold text-center">
                <span>Active Elections</span>
              </h2>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {elections.map((election) => (
                  <Card key={election.id} className="flex flex-col bg-card/80 backdrop-blur-sm border-0 shadow-lg transition-transform duration-300 hover:-translate-y-2">
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
        </div>
      </section>
    </div>
  );
};

export default Index;