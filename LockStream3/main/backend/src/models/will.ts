export interface Will {
  owner: string;
  contentHash: string;
  beneficiaries: string[];
  executed?: boolean;
}