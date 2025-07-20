
'use client';

import type { Source, FormValues, GeneratedIdea } from '@/types';

const API_BASE_URL = 'https://quarto.nvcr.ai/api';
const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZWRiOTFmZC0yOWFjLTQ4MzEtYjgyMC1hYTNkMTcwNzdlMjQiLCJhdWQiOiIiLCJleHAiOjE3NTMxNjkyMDYsImlhdCI6MTc1Mjk5NjQwNiwiZW1haWwiOiJuaWNrLmhvQG5vdXZlbGxlY3JlYXRpb25zLmFpIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCIsImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS2lLbVVqU19WNjU4dTdNQUJ6QUJnR3pPY1lETUlReUo1dzB6SS1qZmdYR1VzaHFBPXM5Ni1jIiwiY3VzdG9tX2NsYWltcyI6eyJoZCI6Im5vdXZlbGxlY3JlYXRpb25zLmFpIn0sImVtYWlsIjoibmljay5ob0Bub3V2ZWxsZWNyZWF0aW9ucy5haSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJOaWNrIEhvIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6Ik5pY2sgSG8iLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLaUttVWpTX1Y2NTh1N01BQnpBQmdHek9jWURNSVF5SjV3MHpJLWpmZ1hHVXNocUE9czk2LWMiLCJwcm92aWRlcl9pZCI6IjEwMDI4NDE3OTA2OTk2MDk4MzYyOSIsInN1YiI6IjEwMDI4NDE3OTA2OTk2MDk4MzYyOSJ9LCJyb2xlIjoic3VwYWJhc2VfYWRtaW4iLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1Mjk5NjQwNn1dLCJzZXNzaW9uX2lkIjoiZTg3Zjk0NDktMmVkMC00ZDQ4LTk5ZDItYTM1NzgyMDhmODgyIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.544ZFU_7zFyoYYMLkcHQRU4ooHz25hE1FUqJDoC9Eh4";
const SESSION_ID = "2676be630e97cc10";


const getHeaders = () => ({
    'Content-Type': 'application/json',
    "Authorization": `Bearer ${BEARER_TOKEN}`,
    "X-Session-Id": SESSION_ID,
    "X-Version": 'production',
});

interface ApiSource {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  content: string;
}

export const fetchSources = async (): Promise<Source[]> => {
    const response = await fetch(`${API_BASE_URL}/blogs`, {
        headers: {
            "Authorization": `Bearer ${BEARER_TOKEN}`,
        }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch' }));
        const errorMessage = errorData.message + `(Status: ${response.status})`;
        throw new Error(errorMessage);
    }

    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
        return result.data.map((item: ApiSource) => ({
            id: item.id,
            title: item.title,
            link: item.url,
            snippet: item.excerpt,
            content: item.content,
        }));
    } else {
        throw new Error(result.message || 'API returned an unexpected data structure.');
    }
};

export const deleteSource = async (id: string): Promise<Response> => {
    const response = await fetch(`${API_BASE_URL}/blogs/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete source. (Status: ${response.status})`);
    }

    return response;
};

export const generateIdeas = async (data: FormValues, selectedSources: Source[]): Promise<Response> => {
    const references = selectedSources
        .map((source, index) => `${index + 1}. ${source.title}\n${source.content || source.snippet}`)
        .join('\n\n');

    const payload = {
        inputs: {
            topic: data.topic,
            description: data.description || '',
            word_per_post: data.wordPerPost,
            books_to_promote: data.books_to_promote?.map(book => book.value).join('\n'),
            post_type: data.postType,
            tone: data.tone,
            references: references,
        },
        query: 'start',
    };

    return fetch(`${API_BASE_URL}/blogsmith/ideas/create`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: getHeaders(),
    });
};

export const generatePost = async (idea: GeneratedIdea): Promise<Response> => {
    const { formValues, selectedSources, content: ideaContent } = idea;
    const references = selectedSources
        .map((source, index) => `${index + 1}. URL: ${source.link}\nTitle: ${source.title}\nContent: ${source.content || source.snippet}`)
        .join('\n\n');

    const payload = {
        inputs: {
            topic: formValues.topic,
            description: formValues.description || '',
            word_per_post: formValues.wordPerPost,
            books_to_promote: formValues.books_to_promote?.map(book => book.value).join('\n'),
            post_type: formValues.postType,
            tone: formValues.tone,
            references: references,
            blog_idea: ideaContent,
        },
        query: 'start',
        conversation_id: '',
    };
    
    return fetch(`${API_BASE_URL}/blogsmith/chat`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: getHeaders(),
    });
};


export const sendChatMessage = async (message: string, conversationId: string, formValues: FormValues, ideaContent: string): Promise<Response> => {
    const payload = {
        inputs: {
            ...formValues,
            books_to_promote: formValues.books_to_promote?.map(b => b.value).join('\n'),
            blog_idea: ideaContent,
        },
        query: message,
        conversation_id: conversationId,
    };
    
    return fetch(`${API_BASE_URL}/blogsmith/chat`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: getHeaders(),
    });
};
