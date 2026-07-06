export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
}

export interface MetricTotals {
  commits: number;
  pullRequests: number;
  mergedPRs: number;
  issuesClosed: number;
  linesAdded: number;
  linesRemoved: number;
  reviewsGiven: number;
  deployments: number;
}

export interface TimelinePoint extends MetricTotals {
  date: string;
}

export interface OverviewData {
  totals: MetricTotals;
  timeline: TimelinePoint[];
}

export interface TeamMember {
  name: string;
  email: string;
  commits: number;
  pullRequests: number;
  mergedPRs: number;
  issuesClosed: number;
  reviewsGiven: number;
  deployments: number;
}

export interface Project {
  id: string;
  name: string;
  repoUrl?: string;
  description?: string;
  _count?: { metrics: number };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
