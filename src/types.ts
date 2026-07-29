export type Agent = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  imageUrl: string;
  category: string;
  videoUrl?: string;
  accessReleased: boolean;
};
