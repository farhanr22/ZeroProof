import { useParams, Link, useNavigate } from "react-router-dom";
import { campaignStore } from "@/services/campaign.store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChevronLeft, MessageSquare, Shield } from "lucide-react";
import * as jdenticon from "jdenticon";
import type { Question } from "@/types/campaign";

function formatAnswer(question: Question, value: unknown): React.ReactNode {
  if (value === undefined || value === null || value === "") return null;
  if (Array.isArray(value) && value.length === 0) return null;

  switch (question.type) {
    case "single_choice":
      return <span>{String(value)}</span>;
    case "multi_choice":
      return <span>{(value as string[]).join(", ")}</span>;
    case "rating":
      return (
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">
            {(value as number[])[0]}
          </span>
          <span className="text-muted-foreground">/ 10</span>
        </div>
      );
    case "text":
      return <span className="italic">"{String(value)}"</span>;
    default:
      return <span>{JSON.stringify(value)}</span>;
  }
}

export default function Response() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const campaign = id ? campaignStore.getCampaignById(id) : undefined;
  const draft = id ? campaignStore.getDraftAnswers(id) : null;

  if (!campaign) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4 text-center mt-20 fade-in animate-in">
        <h2 className="text-3xl font-bold tracking-tight">Campaign not found</h2>
        <p className="text-muted-foreground mt-2">
          This campaign does not exist locally or has been removed.
        </p>
        <Button asChild className="mt-8">
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  const answers = (campaign.submittedAnswers as Record<string, unknown>) ?? draft ?? {};

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4 lg:mt-16 mt-8 md:mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 pb-8 border-b border-border/50">
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-3">
          <Link to="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex items-start gap-5">
          <div
            className="bg-muted/30 p-3 rounded-xl shadow-sm border flex items-center justify-center shrink-0"
            dangerouslySetInnerHTML={{
              __html: jdenticon.toSvg(campaign.securityHash, 56),
            }}
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <MessageSquare className="h-7 w-7 text-primary" />
              {campaign.name}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {campaign.serverUrl}
            </p>
            <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Submitted {new Date(campaign.addedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {campaign.questions
          .sort((a, b) => a.order - b.order)
          .map((q, idx) => {
            const answer = answers[q._id];
            const display = formatAnswer(q, answer);
            if (!display) return null;

            return (
              <Card key={q._id} className="shadow-sm border-primary/10 overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3 border-b">
                  <CardTitle className="text-base font-semibold leading-relaxed">
                    {idx + 1}. {q.text}
                  </CardTitle>
                  <CardDescription className="text-xs uppercase tracking-wide">
                    {q.type.replace("_", " ")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 bg-card">
                  <div className="text-foreground text-base">{display}</div>
                </CardContent>
              </Card>
            );
          })}

        {campaign.status === "pending" && (
          <Button
            className="w-full mt-4"
            onClick={() => navigate(`/feedback/${campaign.id}`)}
          >
            Continue Feedback
          </Button>
        )}
      </div>
    </div>
  );
}
