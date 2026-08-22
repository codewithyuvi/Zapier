import { executeEmail } from "./email";
import { executeSlack } from "./slack";
import { executeDiscordAi } from "./discord_ai";

export const ActionRegistry: Record<string, Function> = {
  email: executeEmail,
  slack: executeSlack,
  discord_ai: executeDiscordAi,
};