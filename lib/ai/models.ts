// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: 'llama2',
    label: 'Llama 2',
    apiIdentifier: 'llama2',
    description: 'Fast and efficient open source model',
  },
  {
    id: 'mistral',
    label: 'Mistral',
    apiIdentifier: 'mistral',
    description: 'Powerful open source model for complex tasks',
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'llama2';
