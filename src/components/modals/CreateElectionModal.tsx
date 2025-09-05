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
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { useWallet } from "@/context/WalletContext";
import { ethers } from "ethers";
import { ELECTION_FACTORY_ADDRESS, ELECTION_FACTORY_ABI } from "@/contracts";
import { uploadToPinata } from "@/lib/ipfs";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  description: z.string().min(10, "Description must be at least 10 characters long."),
  electionType: z.enum(["Simple Majority", "Quadratic", "Ranked-Choice", "Cumulative"], { required_error: "Please select an election type." }),
  options: z.array(z.object({ value: z.string().min(1, "Option cannot be empty.") })).min(2, "Must have at least two options."),
  endDate: z.date({ required_error: "An end date is required." }),
});

interface CreateElectionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const CreateElectionModal = ({ isOpen, onOpenChange }: CreateElectionModalProps) => {
  const { signer } = useWallet();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      options: [{ value: "" }, { value: "" }],
      endDate: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!signer) {
      showError("Please connect your wallet to create an election.");
      return;
    }
    const toastId = showLoading("Uploading election data to IPFS...");
    try {
      // 1. Prepare and upload metadata to IPFS
      const metadata = {
        title: values.title,
        description: values.description,
        options: values.options.map((opt, index) => ({ id: String.fromCharCode(97 + index), text: opt.value })),
      };
      const ipfsHash = await uploadToPinata(metadata, `Election: ${values.title}`);
      const metadataURI = `ipfs://${ipfsHash}`;
      
      dismissToast(toastId);
      showLoading("Deploying your election contract...");

      // 2. Create election on-chain with the IPFS URI
      const factoryContract = new ethers.Contract(ELECTION_FACTORY_ADDRESS, ELECTION_FACTORY_ABI, signer);
      
      const electionTypeMap = {
        "Simple Majority": 0,
        "Quadratic": 1,
        "Ranked-Choice": 2,
        "Cumulative": 3,
      };
      const electionTypeEnum = electionTypeMap[values.electionType];
      const endDateTimestamp = Math.floor(values.endDate.getTime() / 1000);
      const optionIds = metadata.options.map(opt => opt.id); // Use the short ID

      const tx = await factoryContract.createElection(
        endDateTimestamp,
        electionTypeEnum,
        metadataURI,
        optionIds
      );

      await tx.wait();

      dismissToast(toastId);
      showSuccess("Election created successfully!");
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      dismissToast(toastId);
      console.error("Failed to create election:", error);
      showError(error?.message || error?.reason || "An error occurred during creation.");
    }
  }

  return (
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
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Community Governance Vote" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the purpose of this election." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="electionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Election Type
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs p-4">
                          <div className="space-y-2 text-sm">
                            <p><b>Simple Majority:</b> Each voter gets one vote. The option with the most votes wins.</p>
                            <p><b>Quadratic Voting:</b> Voters buy votes using credits. The cost per vote increases quadratically, allowing for nuanced preference expression.</p>
                            <p><b>Ranked-Choice:</b> Voters rank options by preference. If no option wins a majority, the last-place option is eliminated and its votes are redistributed.</p>
                            <p><b>Cumulative Voting:</b> Voters receive a block of votes to distribute among options as they see fit, including giving all votes to one option.</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a voting method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Simple Majority">Simple Majority</SelectItem>
                      <SelectItem value="Quadratic">Quadratic Voting</SelectItem>
                      <SelectItem value="Ranked-Choice">Ranked-Choice Voting</SelectItem>
                      <SelectItem value="Cumulative">Cumulative Voting</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <FormLabel>Options</FormLabel>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`options.${index}.value`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input placeholder={`Option ${index + 1}`} {...field} />
                          </FormControl>
                          {fields.length > 2 && (
                            <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ value: "" })}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Create Election</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};