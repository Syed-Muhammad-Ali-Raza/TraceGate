export {};

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        id: string;
        email: string;
        role: string;
      };
      apiKey?: {
        id: string;
        projectId: string;
        rateLimit: number;
        budgetUsd: string | null;
        cacheTtl: number;
      };
    }
  }
}
