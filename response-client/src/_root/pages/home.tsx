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
  const [joinError, setJoinError] = useState<{ title: string; desc: string; isCrypto: boolean } | null>(null);

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
        setJoinError(null);
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
    setJoinError(null);
    try {
      const campaign = await registerCampaign(accessUrl, (step) => {
        setCurrentStep(step);
      });
      setJoinedCampaign(campaign);
      setCampaigns(campaignStore.getCampaigns());
      toast.success("Joined campaign successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (
        msg.includes("Cryptographic signature verify failed") ||
        msg.toLowerCase().includes("invalid signature")
      ) {
        setJoinError({
          title: "🚨 POTENTIALLY MALICIOUS SERVER",
          desc: "The server signed the response ticket with a invalid cryptographic key. This might leak your identity. Connection Aborted.",
          isCrypto: true
        });
      } else {
        setJoinError({
          title: "Connection Failed",
          desc: msg,
          isCrypto: false
        });
      }
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
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: '#0F172A' }}>
          <span style={{ color: '#2563EB' }}>Zero-Trust</span>{' '}
          <span style={{ color: '#64748B' }}>Anonymous Feedback</span>
        </h1>
        <p className="text-lg max-w-[600px]" style={{ color: '#64748B' }}>
          Submit your anonymous response. The server can verify it came from an authorized respondent — but it cannot link it to you.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight" style={{ color: '#0F172A' }}>Your Campaigns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Join card */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Card className="flex flex-col items-center justify-center p-6 border-dashed border-2 cursor-pointer transition-colors min-h-45 group shadow-sm col-span-1" style={{ borderColor: '#E2E8F0' }}>
                <div className="rounded-full p-4 mb-3 transition-colors" style={{ backgroundColor: '#EFF6FF' }}>
                  <Plus className="h-8 w-8" style={{ color: '#2563EB' }} />
                </div>
                <h3 className="font-medium text-lg" style={{ color: '#0F172A' }}>Join Campaign</h3>
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
                    https://example.com/start?otp=123456
                  </code>
                  ).
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoinCampaign} className="space-y-4 pt-4 pb-0">
                {joinedCampaign ? (
                  <div className="flex flex-col items-center justify-center pt-6 pb-0 space-y-4 fade-in animate-in">
                    <div
                      className="bg-muted/30 p-4 rounded-xl shadow-sm border w-37.5 h-37.5 flex items-center justify-center"
                      dangerouslySetInnerHTML={{
                        __html: jdenticon.toSvg(joinedCampaign.securityHash, 120),
                      }}
                    />
                    <h3 className="text-xl font-semibold mt-2">
                      {joinedCampaign.name}
                    </h3>
                    <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 w-full text-left mt-2">
                      <h4 className="font-bold text-yellow-700 dark:text-yellow-500 flex items-center gap-2 mb-2">
                        <span>ℹ️</span> Protect Your Privacy
                      </h4>
                      <ul className="text-sm text-yellow-800 dark:text-yellow-400 space-y-2 list-disc pl-5">
                        <li>Compare the security pattern image with your peers to ensure they all match.</li>
                        <li>Submit your response after a few hours or at a coordinated time with your group to prevent your identity from being leaked via timing correlation.</li>
                        <li>Switch networks before submitting your response (such as switching from 4G to Wi-Fi) or use a VPN.</li>
                      </ul>
                    </div>
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
                ) : isJoining || joinError ? (
                  <div className="space-y-4 py-4 px-2">
                    {JOIN_STEPS.map((step, index) => {
                      const isCompleted = currentStep > index;
                      const isCurrent = currentStep === index;
                      const isFailed = joinError && isCurrent;
                      return (
                        <div key={index} className="flex items-center gap-3">
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          ) : isFailed ? (
                            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                          ) : isCurrent && !joinError ? (
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
                    {joinError && (
                      <div className={`mt-4 p-4 rounded-md border text-left animate-in fade-in slide-in-from-top-2 ${joinError.isCrypto ? 'bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
                        <h4 className="font-bold flex items-center gap-2 mb-1">
                          <AlertCircle className="h-4 w-4" /> {joinError.title}
                        </h4>
                        <p className="text-sm font-medium">{joinError.desc}</p>
                      </div>
                    )}
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
                  <DialogFooter className="pt-4 border-t mt-0">
                    {!isJoining && !joinError ? (
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
                    ) : joinError ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setJoinError(null)}
                        >
                          Retry
                        </Button>
                        <Button type="button" onClick={() => setIsDialogOpen(false)}>
                          Close
                        </Button>
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
                className="flex flex-col pt-6 transition-all hover:shadow-md col-span-1 cursor-pointer"
                style={{ borderColor: '#E2E8F0', backgroundColor: '#FAFBFF' }}
                onClick={() =>
                  campaign.status === "pending"
                    ? navigate(`/feedback/${campaign.id}`)
                    : navigate(`/response/${campaign.id}`)
                }
              >
                <CardContent className="flex-1 space-y-3 pb-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="rounded-lg border w-12 h-12 flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }}
                      dangerouslySetInnerHTML={{
                        __html: jdenticon.toSvg(campaign.securityHash, 40),
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base line-clamp-1" style={{ color: '#0F172A' }}>{campaign.name}</h3>
                      <p className="text-xs truncate mt-0.5" style={{ color: '#64748B' }}>
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
                <CardFooter className="pt-4 pb-4 mt-auto">
                  {campaign.status === "pending" ? (
                    <Button
                      className="w-full shadow-sm"
                      style={{ backgroundColor: '#0F172A', color: '#fff' }}
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
                      className="w-full shadow-sm"
                      style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
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
