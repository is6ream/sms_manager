import api from './client';

export interface AskQuestionDto {
  message: string;
  routeId?: string;
}

export interface ChatAnswerDto {
  answer: string;
}

export const chatApi = {
  ask: (dto: AskQuestionDto): Promise<ChatAnswerDto> =>
    api.post('/chat/ask', dto).then((r) => r.data),
};
