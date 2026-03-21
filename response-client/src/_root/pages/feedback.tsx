import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, Send, Loader2, Shield } from "lucide-react";
import * as jdenticon from "jdenticon";
import { toast } from "sonner";

import { campaignStore } from "@/services/campaign.store";
import { submitResponse } from "@/services/campaign.service";
import type { Campaign, Question } from "@/types/campaign";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";

// Dynamically build a Zod schema from the question array
function buildFormSchema(questions: Question[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const q of questions) {
    switch (q.type) {
      case "single_choice":
        shape[q._id] = z.string({ message: "Please select an option." });
        break;
      case "multi_choice":
        shape[q._id] = z
          .array(z.string())
          .min(1, "Please select at least one option.");
        break;
      case "rating":
        shape[q._id] = z.array(z.number()).length(1, "Please set a rating.");
        break;
      case "text":
        shape[q._id] = z
          .string()
          .min(1, "Please provide a response.")
          .max(1000, "Response must be under 1000 characters.");
        break;
    }
  }
  return z.object(shape);
}

function buildDefaultValues(
  questions: Question[],
  draft: Record<string, unknown> | null,
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const q of questions) {
    const saved = draft?.[q._id];
    if (saved !== undefined) {
      defaults[q._id] = saved;
    } else if (q.type === "multi_choice") {
      defaults[q._id] = [];
    } else if (q.type === "rating") {
      defaults[q._id] = [5];
    } else {
      defaults[q._id] = "";
    }
  }
  return defaults;
}

export default function Feedback() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const schema = campaign ? buildFormSchema(campaign.questions) : z.object({});
  type FormValues = Record<string, unknown>;

  const draft = id ? campaignStore.getDraftAnswers(id) : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: campaign
      ? buildDefaultValues(campaign.questions, draft)
      : {},
  });

  useEffect(() => {
    if (!id) return;
    const c = campaignStore.getCampaignById(id);
    if (!c) {
      toast.error("Campaign not found.");
      navigate("/");
      return;
    }
    if (c.status === "submitted") {
      navigate(`/response/${id}`);
      return;
    }
    setCampaign(c);
    form.reset(buildDefaultValues(c.questions, campaignStore.getDraftAnswers(id)));
  }, [id]);

  // Autosave draft on changes
  useEffect(() => {
    if (!id || !campaign) return;
    const sub = form.watch((values) => {
      campaignStore.saveDraftAnswers(id, values as Record<string, unknown>);
    });
    return () => sub.unsubscribe();
  }, [form.watch, id, campaign]);

  async function onSubmit(values: FormValues) {
    if (!campaign || !id) return;
    setIsSubmitting(true);
    try {
      // Map form values to backend answer format
      const answers = campaign.questions.map((q) => ({
        question_id: q._id,
        type: q.type,
        value: values[q._id] as string | string[] | number,
      }));

      // Force save exactly what is being submitted to prevent unmount race conditions
      campaignStore.saveDraftAnswers(id, values);

      await submitResponse(id, answers, values);
      toast.success("Response submitted anonymously!");
      navigate("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Submission failed", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!campaign) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4 text-center mt-20">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4 lg:mt-16 mt-8 md:mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 flex items-start justify-between">
        <div className="flex flex-col items-start min-w-0 pr-4">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-3">
            <Link to="/">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">{campaign.serverUrl}</p>
        </div>

        {/* Security hash / jdenticon */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            className="bg-muted/30 p-2 rounded-xl shadow-sm border w-16 h-16 flex items-center justify-center"
            dangerouslySetInnerHTML={{
              __html: jdenticon.toSvg(campaign.securityHash, 48),
            }}
          />
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Shield className="h-3 w-3" /> Security Pattern
          </span>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">Feedback Form</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {campaign.questions.length} question{campaign.questions.length !== 1 ? "s" : ""} · Your response is anonymous and cryptographically protected.
        </p>
      </div>

      <form id="feedback-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FieldGroup className="space-y-6">
          {campaign.questions
            .sort((a, b) => a.order - b.order)
            .map((question, idx) => (
              <Controller
                key={question._id}
                name={question._id}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Card className="shadow-sm border-primary/10 overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold leading-relaxed">
                          {idx + 1}. {question.text}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-xs uppercase tracking-wide">
                        {question.type.replace("_", " ")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 bg-card">
                      <Field data-invalid={fieldState.invalid} className="block">

                        {/* single_choice → Radio */}
                        {question.type === "single_choice" && (
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value as string}
                            className="flex flex-col space-y-2 mt-1"
                          >
                            {question.options.map((opt) => (
                              <div
                                key={opt}
                                className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors"
                              >
                                <RadioGroupItem value={opt} id={`${question._id}-${opt}`} />
                                <Label
                                  htmlFor={`${question._id}-${opt}`}
                                  className="flex-1 cursor-pointer font-normal"
                                >
                                  {opt}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}

                        {/* multi_choice → Checkboxes */}
                        {question.type === "multi_choice" && (
                          <div className="flex flex-col space-y-2 mt-1">
                            {question.options.map((opt) => {
                              const selected = (field.value as string[]) || [];
                              return (
                                <div
                                  key={opt}
                                  className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors"
                                >
                                  <Checkbox
                                    id={`${question._id}-${opt}`}
                                    checked={selected.includes(opt)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([...selected, opt]);
                                      } else {
                                        field.onChange(selected.filter((v) => v !== opt));
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor={`${question._id}-${opt}`}
                                    className="flex-1 cursor-pointer font-normal"
                                  >
                                    {opt}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* rating → Slider */}
                        {question.type === "rating" && (
                          <div className="mt-1 mb-2 flex items-center gap-4 rounded-md bg-muted/20 p-4 border">
                            <span className="text-sm font-medium text-muted-foreground bg-background px-2 py-1 rounded shadow-sm select-none">
                              1
                            </span>
                            <div className="flex-1 px-2">
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={(field.value as number[]) || [5]}
                                onValueChange={field.onChange}
                                className="w-full cursor-pointer"
                              />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground bg-background px-2 py-1 rounded shadow-sm select-none">
                              10
                            </span>
                            <div className="ml-2 flex flex-col items-center justify-center min-w-[3rem] border-l pl-4 border-border">
                              <span className="font-bold text-primary text-2xl leading-none">
                                {(field.value as number[])?.[0] ?? 5}
                              </span>
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-semibold">
                                Score
                              </span>
                            </div>
                          </div>
                        )}

                        {/* text → Textarea */}
                        {question.type === "text" && (
                          <InputGroup className="mt-1">
                            <InputGroupTextarea
                              {...field}
                              value={(field.value as string) || ""}
                              placeholder="Type your response here..."
                              rows={4}
                              className="min-h-24 resize-y"
                              aria-invalid={fieldState.invalid}
                            />
                            <InputGroupAddon align="block-end">
                              <InputGroupText className="tabular-nums">
                                {(field.value as string)?.length || 0}/1000 chars
                              </InputGroupText>
                            </InputGroupAddon>
                          </InputGroup>
                        )}

                        {fieldState.invalid && (
                          <FieldError
                            errors={[fieldState.error]}
                            className="mt-3 block"
                          />
                        )}
                      </Field>
                    </CardContent>
                  </Card>
                )}
              />
            ))}
        </FieldGroup>

        <div className="mt-8 bg-muted/20 border rounded-xl flex flex-col gap-6 p-3 shadow-sm">
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 w-full text-left">
            <h4 className="font-bold text-yellow-700 dark:text-yellow-500 flex items-center gap-2 mb-2">
              <span>ℹ️</span> Protect Your Privacy
            </h4>
            <ul className="text-sm text-yellow-800 dark:text-yellow-400 space-y-2 list-disc pl-5">
              <li>Compare the security pattern image with your peers to ensure they all match.</li>
              <li>Submit your response after a few hours or at a coordinated time with your group to prevent your identity from being leaked via timing correlation.</li>
              <li>Switch networks before submitting your response (such as switching from 4G to Wi-Fi) or use a VPN.</li>
            </ul>
          </div>
          <div className="flex items-center space-x-3 self-start w-full px-1">
            <Checkbox
              id="acknowledge-privacy"
              checked={hasAcknowledged}
              onCheckedChange={(checked) => setHasAcknowledged(!!checked)}
            />
            <Label htmlFor="acknowledge-privacy" className="font-normal cursor-pointer text-sm leading-tight text-muted-foreground hover:text-foreground transition-colors">
              I understand the above instructions concerning my privacy.
            </Label>
          </div>
          <div className="flex justify-end pt-4 border-t border-border/60">
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto group mt-2"
              disabled={isSubmitting || !hasAcknowledged}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              )}
              Submit Anonymously
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
