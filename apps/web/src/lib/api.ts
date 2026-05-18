import { env } from './env';

export interface Tree {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  cover_image: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  member_count?: string;
  person_count?: string;
  user_role?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${env.BELONG_BACKEND_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const treeApi = {
  list: () => request<{ owned: Tree[]; shared: Tree[] }>('/api/trees'),

  get: (id: string) => request<Tree>(`/api/trees/${id}`),

  create: (data: { name: string; description?: string }) =>
    request<Tree>('/api/trees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: Partial<Pick<Tree, 'name' | 'description' | 'cover_image' | 'is_public'>>,
  ) =>
    request<Tree>(`/api/trees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/api/trees/${id}`, {
      method: 'DELETE',
    }),
};

export interface Person {
  id: string;
  tree_id: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  date_of_death: string;
  bio: string;
  avatar_url: string;
  is_deceased: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Relationship {
  id: string;
  tree_id: string;
  person_a_id: string;
  person_b_id: string;
  type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const personApi = {
  get: (personId: string) => request<Person>(`/api/persons/${personId}`),

  list: (treeId: string) => request<Person[]>(`/api/trees/${treeId}/persons`),

  create: (treeId: string, data: Partial<Person>) =>
    request<Person>(`/api/trees/${treeId}/persons`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (treeId: string, personId: string, data: Partial<Person>) =>
    request<Person>(`/api/trees/${treeId}/persons/${personId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (treeId: string, personId: string) =>
    request<{ success: boolean }>(`/api/trees/${treeId}/persons/${personId}`, {
      method: 'DELETE',
    }),
};

export const relationshipApi = {
  list: (treeId: string) => request<Relationship[]>(`/api/trees/${treeId}/relationships`),

  create: (
    treeId: string,
    data: {
      person_a_id: string;
      person_b_id: string;
      type: string;
      metadata?: Record<string, unknown>;
    },
  ) =>
    request<Relationship>(`/api/trees/${treeId}/relationships`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (treeId: string, relationshipId: string) =>
    request<{ success: boolean }>(`/api/trees/${treeId}/relationships/${relationshipId}`, {
      method: 'DELETE',
    }),
};

export interface ImportResult {
  success: boolean;
  person_count: number;
}

export const importApi = {
  gedcom: (
    treeId: string,
    data: {
      persons: {
        first_name: string;
        last_name: string;
        gender: string;
        date_of_birth: string;
        date_of_death: string;
        metadata?: Record<string, unknown>;
      }[];
      relationships: { person_a_id: number; person_b_id: number; type: string }[];
    },
  ) =>
    request<ImportResult>(`/api/trees/${treeId}/import`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export async function uploadCoverImage(
  treeId: string,
  file: File,
): Promise<{ success: boolean; cover_image: string }> {
  const body = new FormData();
  body.append('file', file);
  body.append('treeId', treeId);

  const res = await fetch(`${env.BELONG_BACKEND_URL}/api/upload/cover`, {
    method: 'POST',
    credentials: 'include',
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error ?? 'Upload failed');
  }

  return res.json();
}
