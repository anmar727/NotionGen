import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from "@notionhq/client";
import { APIResponseError } from "@notionhq/client";
import type { TemplateBlueprint, BlueprintDatabase } from "@/lib/blueprint-schema";

export type NotionOAuthTokenResponse = {
  access_token: string;
  workspace_id: string;
  workspace_name?: string;
  bot_id: string;
  owner?: unknown;
};

export type InstallationLog = {
  step: string;
  status: "success" | "error";
  message: string;
  notionId?: string;
};

export class NotionInstallationError extends Error {
  logs: InstallationLog[];

  constructor(message: string, logs: InstallationLog[]) {
    super(message);
    this.name = "NotionInstallationError";
    this.logs = logs;
  }
}

export function buildNotionOAuthUrl(state: string) {
  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = process.env.NOTION_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    throw new Error("Notion OAuth env vars are missing.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    owner: "user",
    redirect_uri: redirectUri,
    state,
  });

  return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
}

export async function exchangeNotionCode(code: string) {
  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  const redirectUri = process.env.NOTION_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Notion OAuth env vars are missing.");
  }

  const response = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notion OAuth token exchange failed: ${body}`);
  }

  return (await response.json()) as NotionOAuthTokenResponse;
}

export function getNotionClient(accessToken: string) {
  return new Client({ auth: accessToken });
}

export async function searchAccessiblePages(accessToken: string) {
  const notion = getNotionClient(accessToken);
  const response = await notion.search({
    filter: { property: "object", value: "page" },
    sort: { direction: "descending", timestamp: "last_edited_time" },
    page_size: 25,
  });

  return response.results
    .filter((result: any) => result.object === "page")
    .map((page: any) => ({
      id: page.id,
      title: extractPageTitle(page),
      lastEditedTime: page.last_edited_time,
    }));
}

function extractPageTitle(page: any) {
  const titleProperty = Object.values(page.properties ?? {}).find(
    (property: any) => property.type === "title",
  ) as any;

  return titleProperty?.title?.map((part: any) => part.plain_text).join("") || "Untitled page";
}

function richText(content: string) {
  return [{ type: "text", text: { content: content.slice(0, 1900) } }];
}

function titleText(content: string) {
  return [{ type: "text", text: { content: content.slice(0, 200) } }];
}

function databaseProperties(database: BlueprintDatabase) {
  return database.properties.reduce<Record<string, any>>((acc, property) => {
    if (property.type === "title") acc[property.name] = { title: {} };
    if (property.type === "rich_text") acc[property.name] = { rich_text: {} };
    if (property.type === "number") acc[property.name] = { number: { format: "number" } };
    if (property.type === "date") acc[property.name] = { date: {} };
    if (property.type === "checkbox") acc[property.name] = { checkbox: {} };
    if (property.type === "url") acc[property.name] = { url: {} };
    if (property.type === "select") {
      acc[property.name] = {
        select: { options: property.options.map((name) => ({ name })) },
      };
    }
    if (property.type === "multi_select") {
      acc[property.name] = {
        multi_select: { options: property.options.map((name) => ({ name })) },
      };
    }
    return acc;
  }, {});
}

function pageProperties(database: BlueprintDatabase, entry: { title: string; properties: Record<string, string | number | boolean> }) {
  const properties: Record<string, any> = {};
  for (const property of database.properties) {
    const value = property.type === "title" ? entry.title : entry.properties[property.name];
    if (value === undefined) continue;

    if (property.type === "title") properties[property.name] = { title: titleText(String(value)) };
    if (property.type === "rich_text") properties[property.name] = { rich_text: richText(String(value)) };
    if (property.type === "number" && typeof value === "number") properties[property.name] = { number: value };
    if (property.type === "checkbox" && typeof value === "boolean") properties[property.name] = { checkbox: value };
    if (property.type === "url") properties[property.name] = { url: String(value) };
    if (property.type === "date") properties[property.name] = { date: { start: String(value) } };
    if (property.type === "select") properties[property.name] = { select: { name: String(value) } };
    if (property.type === "multi_select") {
      properties[property.name] = {
        multi_select: String(value)
          .split(",")
          .map((name) => ({ name: name.trim() }))
          .filter((option) => option.name),
      };
    }
  }
  return properties;
}

async function withLog<T>(
  logs: InstallationLog[],
  step: string,
  action: () => Promise<T>,
  getId?: (result: T) => string | undefined,
) {
  try {
    const result = await action();
    logs.push({ step, status: "success", message: `${step} completed.`, notionId: getId?.(result) });
    return result;
  } catch (error) {
    const message = error instanceof APIResponseError ? error.message : error instanceof Error ? error.message : "Unknown Notion error";
    logs.push({ step, status: "error", message });
    throw error;
  }
}

export async function createNotionTemplate({
  accessToken,
  destinationPageId,
  blueprint,
}: {
  accessToken: string;
  destinationPageId: string;
  blueprint: TemplateBlueprint;
}) {
  const notion = getNotionClient(accessToken);
  const logs: InstallationLog[] = [];

  try {
    const dashboard = await withLog(
      logs,
      "Create main dashboard",
      () =>
        notion.pages.create({
          parent: { page_id: destinationPageId },
          properties: {
            title: { title: titleText(blueprint.dashboard.title) },
          },
          children: [
            { object: "block", type: "heading_2", heading_2: { rich_text: richText("Operating command center") } },
            { object: "block", type: "paragraph", paragraph: { rich_text: richText(blueprint.summary) } },
            ...blueprint.dashboard.sections.map((section) => ({
              object: "block",
              type: "bulleted_list_item",
              bulleted_list_item: { rich_text: richText(section) },
            })),
          ],
        } as any),
      (result: any) => result.id,
    );

    const dashboardId = (dashboard as any).id as string;
    const createdDatabases: Record<string, string> = {};

    for (const database of blueprint.databases) {
      const created = await withLog(
        logs,
        `Create ${database.name}`,
        () =>
          notion.databases.create({
            parent: { page_id: dashboardId },
            title: titleText(database.name),
            description: richText(database.description),
            properties: databaseProperties(database),
          } as any),
        (result: any) => result.id,
      );
      createdDatabases[database.key] = (created as any).id;

      for (const entry of database.sampleEntries) {
        await withLog(logs, `Add sample ${database.name} entry`, () =>
          notion.pages.create({
            parent: { database_id: (created as any).id },
            properties: pageProperties(database, entry),
          } as any),
        );
      }
    }

    for (const page of blueprint.pages) {
      await withLog(
        logs,
        `Create ${page.title}`,
        () =>
          notion.pages.create({
            parent: { page_id: dashboardId },
            properties: { title: { title: titleText(page.title) } },
            children: [
              { object: "block", type: "paragraph", paragraph: { rich_text: richText(page.purpose) } },
              ...page.sections.map((section) => ({
                object: "block",
                type: "to_do",
                to_do: { rich_text: richText(section), checked: false },
              })),
            ],
          } as any),
        (result: any) => result.id,
      );
    }

    return { dashboardId, createdDatabases, logs };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notion installation failed.";
    throw new NotionInstallationError(message, logs);
  }
}
