import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  questionnaireSchema,
  templateBlueprintSchema,
  type QuestionnaireInput,
  type TemplateBlueprint,
} from "@/lib/blueprint-schema";

let openaiClient: OpenAI | null = null;

function getOpenAI() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required to generate templates.");
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

const systemPrompt = `You generate Notion operating system blueprints.
Return only JSON matching the schema.
Do not mention Notion API calls.
Do not include markdown, prose, comments, or code fences.
The blueprint must include Main Dashboard, CRM database, Projects database, Tasks database, SOP Hub, Content Calendar, Finance Tracker, Team Wiki, and sample data.`;

function buildPrompt(input: QuestionnaireInput) {
  return `Create a Notion OS blueprint for this customer:
Business name: ${input.businessName}
Business type: ${input.businessType}
Solo or team: ${input.teamSize}
Services/products: ${input.servicesProducts}
Sales process: ${input.salesProcess}
Main workflows: ${input.mainWorkflows}
Content needs: ${input.contentNeeds}
Finance tracking needs: ${input.financeTrackingNeeds}
Team roles: ${input.teamRoles}
Preferred style: ${input.preferredTemplateStyle}`;
}

async function runStructuredGeneration(prompt: string) {
  const client = getOpenAI();
  const response = await client.responses.parse({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    text: {
      format: zodTextFormat(templateBlueprintSchema, "template_blueprint"),
    },
  });

  return response.output_parsed as TemplateBlueprint | null;
}

export async function generateTemplateBlueprint(input: unknown) {
  const questionnaire = questionnaireSchema.parse(input);

  const firstResult = await runStructuredGeneration(buildPrompt(questionnaire));
  const firstValidation = templateBlueprintSchema.safeParse(firstResult);
  if (firstValidation.success) {
    return firstValidation.data;
  }

  const repairPrompt = `Repair this invalid blueprint so it strictly matches the schema.
Original questionnaire:
${JSON.stringify(questionnaire)}

Invalid blueprint:
${JSON.stringify(firstResult)}

Validation errors:
${JSON.stringify(firstValidation.error.flatten())}`;

  const repairedResult = await runStructuredGeneration(repairPrompt);
  return templateBlueprintSchema.parse(repairedResult);
}
