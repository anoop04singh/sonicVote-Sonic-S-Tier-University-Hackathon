import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface ElectionWinnerProps {
  election: any;
}

const ElectionWinner = ({ election }: ElectionWinnerProps) => {
  const calculateWinner = () => {
    if (!election || !election.options || election.options.length === 0) {
      return { winners: [], isTie: false, note: null };
    }

    const maxVotes = Math.max(...election.options.map((o: any) => o.votes));
    
    if (maxVotes === 0) {
        return { winners: [{ text: "No votes cast" }], isTie: false, note: "The election ended with no votes." };
    }

    const winners = election.options.filter((o: any) => o.votes === maxVotes);
    const isTie = winners.length > 1;
    
    let note = null;
    const electionTypeName = ["Simple Majority", "Quadratic", "Ranked-Choice", "Cumulative"][election.electionType];
    if (electionTypeName === "Ranked-Choice") {
      note = "Result based on first-preference votes. A full runoff may yield a different result.";
    }

    return { winners, isTie, note };
  };

  const { winners, isTie, note } = calculateWinner();

  return (
    <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30 shadow-lg shadow-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl text-primary">
          <Trophy className="mr-3 h-8 w-8" />
          Election Result: {isTie ? "It's a Tie!" : "Winner"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {winners.map((winner: any, index: number) => (
          <div key={index} className="text-center">
            <p className="text-3xl font-bold tracking-tight text-foreground">{winner.text}</p>
            {winner.votes !== undefined && (
                <p className="text-lg text-muted-foreground">
                    with {winner.votes.toLocaleString()} votes
                </p>
            )}
          </div>
        ))}
        {note && <p className="text-xs text-center text-muted-foreground pt-4">{note}</p>}
      </CardContent>
    </Card>
  );
};

export default ElectionWinner;