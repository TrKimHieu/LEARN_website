const PLAN_LABEL: Record<string, string> = { FREE: 'Free', PRO: 'Pro', TEAM: 'Team' };

export const planLabel = (code: string): string => PLAN_LABEL[code] ?? code;
