export type LeadContact = {
  name: string;
  email: string;
  phone: string;
  role: string;
};

export type LeadFormState = {
  responsibleId: string;
  responsibleName: string;
  leadName: string;
  cnpj: string;
  contacts: LeadContact[];
  date: string;
  location: string;
  interestedServices: string;
  proposalLink: string;
  hasBeenContacted: boolean;
};

export type Lead = {
  id: string;
  responsibleId: string;
  responsibleName: string;
  leadName: string;
  cnpj: string;
  contacts: LeadContact[];
  date: string;
  location: string;
  interestedServices: string[];
  proposalLink: string;
  hasBeenContacted?: boolean;
};

export type LeadComment = {
  id: string;
  authorId: string | null;
  authorName: string;
  text: string;
  createdAt?: unknown;
};
