export interface QuestionnaireQuestion {
  prompt: string;
  answer: string;
}

export interface QuestionnaireTopic {
  title: string;
  questions: QuestionnaireQuestion[];
}

export interface MonthlyQuestionnaireData {
  clientId: string;
  clientName: string;
  jobCoach: string;
  month: string;
  packetTitle: string;
  topics: QuestionnaireTopic[];
}