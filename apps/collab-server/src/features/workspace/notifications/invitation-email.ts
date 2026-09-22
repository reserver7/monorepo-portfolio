const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_MONTHLY_LIMIT = 3_000;

export interface WorkspaceInvitationEmail {
  to: string;
  workspaceTitle: string;
  inviteUrl: string;
}

interface UsageCounter {
  month: string;
  count: number;
}

interface EmailResponse {
  ok: boolean;
}

export interface InvitationEmailOptions {
  enabled: boolean;
  apiKey?: string;
  from?: string;
  monthlyLimit?: number;
  usage?: UsageCounter;
  now?: () => Date;
  fetcher?: (input: string, init?: RequestInit) => Promise<EmailResponse>;
}

export type InvitationEmailResult =
  | { sent: true }
  | { sent: false; reason: "disabled" | "missing-config" | "monthly-limit" | "provider-error" };

const currentMonth = (date: Date): string => date.toISOString().slice(0, 7);

const escapeHtml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export const sendWorkspaceInvitationEmail = async (
  invitation: WorkspaceInvitationEmail,
  options: InvitationEmailOptions
): Promise<InvitationEmailResult> => {
  if (!options.enabled) return { sent: false, reason: "disabled" };
  if (!options.apiKey || !options.from) return { sent: false, reason: "missing-config" };

  const now = options.now?.() ?? new Date();
  const month = currentMonth(now);
  const usage = options.usage ?? { month, count: 0 };
  if (usage.month !== month) {
    usage.month = month;
    usage.count = 0;
  }

  const monthlyLimit = Math.min(options.monthlyLimit ?? DEFAULT_MONTHLY_LIMIT, DEFAULT_MONTHLY_LIMIT);
  if (usage.count >= monthlyLimit) return { sent: false, reason: "monthly-limit" };

  const title = escapeHtml(invitation.workspaceTitle);
  const inviteUrl = escapeHtml(invitation.inviteUrl);
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: options.from,
      to: [invitation.to],
      subject: `${invitation.workspaceTitle} 작업 공간 초대`,
      text: `${invitation.workspaceTitle} 작업 공간에 초대되었습니다. ${invitation.inviteUrl}`,
      html: `<p><strong>${title}</strong> 작업 공간에 초대되었습니다.</p><p><a href="${inviteUrl}">작업 공간 열기</a></p>`
    })
  });

  if (!response.ok) return { sent: false, reason: "provider-error" };
  usage.count += 1;
  return { sent: true };
};
