import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  MessageSquare,
  CheckCircle2,
  Circle,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import * as jdenticon from "jdenticon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { campaignStore } from "@/services/campaign.store";
import { registerCampaign } from "@/services/campaign.service";
import { AccessUrlSchema } from "@/schemas/api.schemas";
import type { Campaign } from "@/types/campaign";

const JOIN_STEPS = [
  "Verifying access link...",
  "Generating anonymous token...",
  "Requesting blind signature...",
  "Finalizing & verifying signature...",
  "Computing security pattern...",
];

export default function Home() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [accessUrl, setAccessUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [joinedCampaign, setJoinedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    setCampaigns(campaignStore.getCampaigns());
  }, []);

  useEffect(() => {
    if (!isDialogOpen) {
      setTimeout(() => {
        setIsJoining(false);
        setCurrentStep(-1);
        setJoinedCampaign(null);
        setAccessUrl("");
        setUrlError(null);
      }, 300);
    }
  }, [isDialogOpen]);

  const validateUrl = (url: string) => {
    const result = AccessUrlSchema.safeParse(url);
    if (!result.success) {
      setUrlError(result.error.issues[0]?.message ?? "Invalid URL");
      return false;
    }
    setUrlError(null);
    return true;
  };

  const handleJoinCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUrl(accessUrl)) return;
    setIsJoining(true);
    setCurrentStep(0);
    try {
      const campaign = await registerCampaign(accessUrl, (step) => {
        setCurrentStep(step);
      });
      setJoinedCampaign(campaign);
      setCampaigns(campaignStore.getCampaigns());
      toast.success("Joined campaign successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to join campaign", { description: msg });
      setIsDialogOpen(false);
    } finally {
      setIsJoining(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    campaignStore.deleteCampaign(id);
    setCampaigns(campaignStore.getCampaigns());
    toast.info("Campaign removed from device.");
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 lg:mt-16 mt-8 md:mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground">
          Anonymous Feedback
        </h1>
        <p className="text-muted-foreground text-lg">
          Zero-knowledge. Your response is cryptographically anonymous.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Your Campaigns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Join card */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Card className="flex flex-col items-center justify-center p-6 border-dashed border-2 hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-colors min-h-45 group shadow-sm col-span-1">
                <div className="rounded-full bg-primary/10 p-4 mb-3 group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-medium text-lg">Join Campaign</h3>
                <p className="text-sm text-muted-foreground mt-1 text-center">
                  Paste the access URL from your invite.
                </p>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Join Campaign</DialogTitle>
                <DialogDescription>
                  Paste the full access URL you received (e.g.{" "}
                  <code className="text-xs bg-muted px-1 rounded">
                    http://server/api/public/start?otp=123456
                  </code>
                  ).
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoinCampaign} className="space-y-4 py-4">
                {joinedCampaign ? (
                  <div className="flex flex-col items-center justify-center py-6 space-y-4 fade-in animate-in">
                    <div
                      className="bg-muted/30 p-4 rounded-xl shadow-sm border w-37.5 h-37.5 flex items-center justify-center"
                      dangerouslySetInnerHTML={{
                        __html: jdenticon.toSvg(joinedCampaign.securityHash, 120),
                      }}
                    />
                    <h3 className="text-xl font-semibold mt-2">
                      {joinedCampaign.name}
                    </h3>
                    <p className="text-center text-muted-foreground text-sm">
                      Compare your Security Pattern with peers before submitting.
                    </p>
                    <Button
                      type="button"
                      className="w-full mt-4"
                      onClick={() => {
                        setIsDialogOpen(false);
                        navigate(`/feedback/${joinedCampaign.id}`);
                      }}
                    >
                      Go to Feedback Form
                    </Button>
                  </div>
                ) : isJoining ? (
                  <div className="space-y-4 py-4 px-2">
                    {JOIN_STEPS.map((step, index) => {
                      const isCompleted = currentStep > index;
                      const isCurrent = currentStep === index;
                      return (
                        <div key={index} className="flex items-center gap-3">
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          ) : isCurrent ? (
                            <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                          )}
                          <span
                            className={
                              isCompleted || isCurrent
                                ? "text-foreground font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="access-url">Access URL</Label>
                    <Input
                      id="access-url"
                      placeholder="http://localhost:3000/api/public/start?otp=..."
                      value={accessUrl}
                      onChange={(e) => {
                        setAccessUrl(e.target.value);
                        if (urlError) validateUrl(e.target.value);
                      }}
                      required
                      className={urlError ? "border-destructive" : ""}
                    />
                    {urlError && (
                      <p className="text-destructive text-xs flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {urlError}
                      </p>
                    )}
                  </div>
                )}
                {!joinedCampaign && (
                  <DialogFooter>
                    {!isJoining ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Join</Button>
                      </>
                    ) : (
                      <Button type="button" disabled className="w-full">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Please wait
                      </Button>
                    )}
                  </DialogFooter>
                )}
              </form>
            </DialogContent>
          </Dialog>

          {/* Empty state */}
          {campaigns.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-6 border-dashed border-2 bg-muted/20 min-h-45 shadow-sm col-span-1 md:col-span-1 lg:col-span-2">
              <div className="rounded-full bg-muted p-4 mb-3">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">No Campaigns Yet</h3>
              <p className="text-sm text-muted-foreground mt-1 text-center">
                Join a campaign using an access URL from your invite.
              </p>
            </Card>
          ) : (
            campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="flex flex-col pt-6 transition-all hover:shadow-md border-primary/20 bg-muted/10 col-span-1 cursor-pointer"
                onClick={() =>
                  campaign.status === "pending"
                    ? navigate(`/feedback/${campaign.id}`)
                    : navigate(`/response/${campaign.id}`)
                }
              >
                <CardContent className="flex-1 space-y-3 pb-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="bg-muted/30 rounded-lg border w-12 h-12 flex items-center justify-center shrink-0"
                      dangerouslySetInnerHTML={{
                        __html: jdenticon.toSvg(campaign.securityHash, 40),
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base line-clamp-1">{campaign.name}</h3>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {campaign.serverUrl}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 rounded-full"
                      onClick={(e) => handleDelete(campaign.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    {campaign.status === "pending" ? (
                      <><Circle className="h-4 w-4 text-orange-500" /> Pending</>
                    ) : (
                      <><CheckCircle2 className="h-4 w-4 text-green-500" /> Submitted</>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-6 mt-auto">
                  {campaign.status === "pending" ? (
                    <Button
                      className="w-full shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/feedback/${campaign.id}`);
                      }}
                    >
                      Give Feedback
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full shadow-sm border-primary/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/response/${campaign.id}`);
                      }}
                    >
                      View Response
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
