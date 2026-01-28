export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'PENDING';

export interface Article {
  id?: string;
  title: string;
  shortDescription: string;
  content: string; 
  tags: string;
  thumbUrl: string;
  menu?: string; // BỔ SUNG TRƯỜNG MENU
  seoTitle: string;
  seoDescription: string;
  status: ArticleStatus;
  createdDate?: string;
  publishedDate?: string;
}