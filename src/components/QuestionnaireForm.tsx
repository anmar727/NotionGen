"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const fields = [
  ["servicesProducts", "Services/products"],
  ["salesProcess", "Sales process"],
  ["mainWorkflows", "Main workflows"],
  ["contentNeeds", "Content needs"],
  ["financeTrackingNeeds", "Finance tracking needs"],
  ["teamRoles", "Team roles"],
] as const;

export function QuestionnaireForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/generate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Template generation failed.");
      router.push(`/blueprint?template=${data.templateId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Template generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Business OS Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="grid gap-5">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Generation failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input id="businessName" name="businessName" required minLength={2} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="businessType">Business type</Label>
              <Input id="businessType" name="businessType" required minLength={2} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Solo or team</Label>
              <Select name="teamSize" defaultValue="solo">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo">Solo</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Preferred template style</Label>
              <Select name="preferredTemplateStyle" defaultValue="operator">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {fields.map(([name, label]) => (
            <div className="grid gap-2" key={name}>
              <Label htmlFor={name}>{label}</Label>
              <Textarea id={name} name={name} required minLength={2} className="min-h-24" />
            </div>
          ))}

          <Button type="submit" disabled={loading} className="w-full md:w-fit">
            <WandSparkles className="size-4" />
            {loading ? "Generating blueprint..." : "Generate blueprint"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
