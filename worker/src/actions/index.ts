import { executeEmail } from "./email";
import { executeSlack } from "./slack";

export const ActionRegistry: Record<string, Function> = {
  email: executeEmail,
  slack: executeSlack,
};