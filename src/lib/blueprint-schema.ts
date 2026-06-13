import { z } from "zod";

export const questionnaireSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  businessType: z.string().trim().min(2).max(120),
  teamSize: z.enum(["solo", "team"]),
  servicesProducts: z.string().trim().min(5).max(1500),
  salesProcess: z.string().trim().min(5).max(1500),
  mainWorkflows: z.string().trim().min(5).max(1500),
  contentNeeds: z.string().trim().min(2).max(1500),
  financeTrackingNeeds: z.string().trim().min(2).max(1500),
  teamRoles: z.string().trim().min(2).max(1500),
  preferredTemplateStyle: z.enum(["minimal", "operator", "executive", "creative"]),
});

export const blueprintPropertySchema = z.discriminatedUnion("type", [
  z.object({ name: z.string().min(1).max(80), type: z.literal("title") }),
  z.object({ name: z.string().min(1).max(80), type: z.literal("rich_text") }),
  z.object({ name: z.string().min(1).max(80), type: z.literal("number") }),
  z.object({ name: z.string().min(1).max(80), type: z.literal("date") }),
  z.object({
    name: z.string().min(1).max(80),
    type: z.literal("select"),
    options: z.array(z.string().min(1).max(40)).min(1).max(12),
  }),
  z.object({
    name: z.string().min(1).max(80),
    type: z.literal("multi_select"),
    options: z.array(z.string().min(1).max(40)).min(1).max(12),
  }),
  z.object({ name: z.string().min(1).max(80), type: z.literal("checkbox") }),
  z.object({ name: z.string().min(1).max(80), type: z.literal("url") }),
]);

export const sampleEntrySchema = z.object({
  title: z.string().min(1).max(120),
  properties: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});

export const blueprintDatabaseSchema = z.object({
  key: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(120),
  description: z.string().min(5).max(500),
  properties: z.array(blueprintPropertySchema).min(2).max(20),
  sampleEntries: z.array(sampleEntrySchema).min(1).max(8),
});

export const blueprintPageSchema = z.object({
  key: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(2).max(120),
  purpose: z.string().min(5).max(500),
  sections: z.array(z.string().min(2).max(160)).min(1).max(12),
});

export const templateBlueprintSchema = z.object({
  version: z.literal("1.0"),
  templateName: z.string().min(2).max(140),
  businessName: z.string().min(2).max(120),
  style: z.enum(["minimal", "operator", "executive", "creative"]),
  summary: z.string().min(20).max(1200),
  dashboard: z.object({
    title: z.string().min(2).max(120),
    sections: z.array(z.string().min(2).max(160)).min(4).max(12),
  }),
  databases: z
    .array(blueprintDatabaseSchema)
    .min(6)
    .max(10)
    .superRefine((databases, ctx) => {
      const required = [
        "crm",
        "projects",
        "tasks",
        "content-calendar",
        "finance-tracker",
      ];
      for (const key of required) {
        if (!databases.some((database) => database.key === key)) {
          ctx.addIssue({
            code: "custom",
            message: `Missing required database: ${key}`,
          });
        }
      }
      for (const database of databases) {
        if (!database.properties.some((property) => property.type === "title")) {
          ctx.addIssue({
            code: "custom",
            message: `${database.name} must include a title property`,
          });
        }
      }
    }),
  pages: z
    .array(blueprintPageSchema)
    .min(3)
    .max(12)
    .superRefine((pages, ctx) => {
      for (const key of ["sop-hub", "team-wiki"]) {
        if (!pages.some((page) => page.key === key)) {
          ctx.addIssue({ code: "custom", message: `Missing required page: ${key}` });
        }
      }
    }),
});

export type QuestionnaireInput = z.infer<typeof questionnaireSchema>;
export type TemplateBlueprint = z.infer<typeof templateBlueprintSchema>;
export type BlueprintDatabase = z.infer<typeof blueprintDatabaseSchema>;
export type BlueprintProperty = z.infer<typeof blueprintPropertySchema>;

export function validateBlueprint(input: unknown) {
  return templateBlueprintSchema.safeParse(input);
}
