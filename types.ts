
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Question {
  id: string;
  title: string;
  url: string;
  difficulty: Difficulty;
  completed: boolean;
  companies?: string[];
  notes?: string;
}

export interface SubTopic {
  id: string;
  title: string;
  questions: Question[];
}

export interface Topic {
  id: string;
  title: string;
  subTopics: SubTopic[];
}

export interface SheetState {
  topics: Topic[];
  title: string;
  lastUpdated: string;
}

export type ModalType = 'TOPIC' | 'SUBTOPIC' | 'QUESTION';
export type ModalMode = 'ADD' | 'EDIT';

export interface ModalState {
  isOpen: boolean;
  type: ModalType | null;
  mode: ModalMode;
  parentId?: string; // topicId for subtopics, subtopicId for questions
  grandParentId?: string; // topicId for questions
  editId?: string;
  initialData?: any;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  createdBy: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentData?: string; // Base64 encoding
}

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  createdBy: string;
  fileName?: string;
  fileType?: string;
  fileData?: string; // Base64 encoding
  externalUrl?: string; // Optional URL link
}

