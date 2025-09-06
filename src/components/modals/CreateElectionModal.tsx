import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarIcon, PlusCircle, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";
import { useWallet } from "@/context/WalletContext";
import { ethers } from "ethers";
import { ELECTION_FACTORY_ADDRESS, ELECTION_FACTORY_ABI } from "@/contracts";
import { uploadToPinata } from "@/lib/ipfs";
import { LoadingModal } from "./LoadingModal";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  description: z.string().min(10, "Description must be at least 10 characters long."),
  electionType: z.enum(["Simple Majority", "Quadratic", "Ranked-Choice", "Cumulative"], { required_error: "Please select an election type." }),
  options: z.array(z.object({ value: z.string().min(1, "Option cannot be empty.") })).min(2, "Must have at least two options."),
  startDate: z.date({ required_error: "A start date is required." }),
  endDate: z.date({ required_error: "An end date is required." }),
  voteCredits: z.coerce.number().optional(),
}).refine((data) => data.startDate < data.endDate, {
  message: "End date must be after the start date.",
  path: ["endDate"],
});

interface CreateElectionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const CreateElectionModal = ({ isOpen, onOpenChange }: CreateElectionModalProps) => {
  const { signer } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      options: [{ value: "" }, { value: "" }],
      startDate: undefined,
      endDate: undefined,
      voteCredits: 100,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const electionType = form.watch("electionType");
  const startDate = form.watch("startDate");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!signer) {
      showError("Please connect your wallet to create an election.");
      return;
    }
    
    setLoadingMessage("Uploading election data to IPFS...");
    setIsLoading(true);

    try {
      const metadata = {
        title: values.title,
        description: values.description,
        options: values.options.map((opt, index) => ({ id: String.fromCharCode(97 + index), text: opt.value })),
        ...(values.electionType === "Quadratic" || values.electionType === "Cumulative" ? { voteCredits: values.voteCredits } : {}),
      };
      const ipfsHash = await uploadToPinata(metadata);
      const metadataURI = `ipfs://${ipfsHash}`;
      
      setLoadingMessage("Deploying your election contract...");

      const factoryContract = new ethers.Contract(ELECTION_FACTORY_ADDRESS, ELECTION_FACTORY_ABI, signer);
      
      const electionTypeMap = { "Simple Majority": 0, "Quadratic": 1, "Ranked-Choice": 2, "Cumulative": 3 };
      const electionTypeEnum = electionTypeMap[values.electionType];
      const startDateTimestamp = Math.floor(values.startDate.getTime() / 1000);
      const endDateTimestamp = Math.floor(values.endDate.getTime() / 1000);
      const optionIds = metadata.options.map((opt: any) => opt.text);

      const tx = await factoryContract.createElection(
        startDateTimestamp,
        endDateTimestamp,
        electionTypeEnum,
        metadataURI,
        optionIds
      );

      await tx.wait();

      showSuccess("Election created successfully!");
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error("Failed to create election:", error);
      showError(error?.data?.message || error?.reason || "An error occurred during creation.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <LoadingModal isOpen={isLoading} message={loadingMessage} />
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Election</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new election. This will deploy a new smart contract.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Title</FormLabel> <FormControl> <Input placeholder="e.g., Community Governance Vote" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Description</FormLabel> <FormControl> <Textarea placeholder="Describe the purpose of this election." {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="electionType" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center"> Election Type <TooltipProvider> <Tooltip> <TooltipTrigger asChild> <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-pointer" /> </TooltipTrigger> <TooltipContent side="bottom" className="max-w-xs p-4"> <div className="space-y-2 text-sm"> <p><b>Simple Majority:</b> Each voter gets one vote.</p> <p><b>Quadratic Voting:</b> Voters buy votes using credits.</p> <p><b>Ranked-Choice:</b> Voters rank options by preference.</p> <p><b>Cumulative Voting:</b> Voters distribute a block of votes.</p> </div> </TooltipContent> </Tooltip> </TooltipProvider> </FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select a voting method" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="Simple Majority">Simple Majority</SelectItem> <SelectItem value="Quadratic">Quadratic Voting</SelectItem> <SelectItem value="Ranked-Choice">Ranked-Choice Voting</SelectItem> <SelectItem value="Cumulative">Cumulative Voting</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                {(electionType === "Quadratic" || electionType === "Cumulative") && ( <FormField control={form.control} name="voteCredits" render={({ field }) => ( <FormItem> <FormLabel> {electionType === "Quadratic" ? "Vote Credits per User" : "Votes per User"} </FormLabel> <FormControl> <Input type="number" placeholder="e.g., 100" {...field} /> </FormControl> <FormMessage /> </FormItem> )} /> )}
              </div>
              <div>
                <FormLabel>Options</FormLabel>
                <div className="space-y-2 mt-2">
                  {fields.map((field, index) => ( <FormField key={field.id} control={form.control} name={`options.${index}.value`} render={({ field }) => ( <FormItem> <div className="flex items-center gap-2"> <FormControl> <Input placeholder={`Option ${index + 1}`} {...field} /> </FormControl> {fields.length > 2 && ( <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}> <X className="h-4 w-4" /> </Button> )} </div> <FormMessage /> </FormItem> )} /> ))}
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ value: "" })}> <PlusCircle className="h-4 w-4 mr-2" /> Add Option </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="startDate" render={({ field }) => ( <FormItem className="flex flex-col"> <FormLabel>Start Date</FormLabel> <Popover> <PopoverTrigger asChild> <FormControl> <Button variant={"outline"} className={cn( "w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground" )}> <div className="flex items-center justify-between w-full"> {field.value ? ( format(field.value, "PPP") ) : ( <span>Pick a date</span> )} <CalendarIcon className="h-4 w-4 opacity-50" /> </div> </Button> </FormControl> </PopoverTrigger> <PopoverContent className="w-auto p-0" align="start"> <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus /> </PopoverContent> </Popover> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="endDate" render={({ field }) => ( <FormItem className="flex flex-col"> <FormLabel>End Date</FormLabel> <Popover> <PopoverTrigger asChild> <FormControl> <Button variant={"outline"} className={cn( "w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground" )}> <div className="flex items-center justify-between w-full"> {field.value ? ( format(field.value, "PPP") ) : ( <span>Pick a date</span> )} <CalendarIcon className="h-4 w-4 opacity-50" /> </div> </Button> </FormControl> </PopoverTrigger> <PopoverContent className="w-auto p-0" align="start"> <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < (startDate || new Date(new Date().setHours(0,0,0,0)))} initialFocus /> </PopoverContent> </Popover> <FormMessage /> </FormItem> )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">Create Election</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};