import type { Category, Post, Thread } from './types'

export const categories: Category[] = [
  { id: 'general', label: 'General' },
  { id: 'match-threads', label: 'Match Threads' },
  { id: 'news', label: 'News' },
  { id: 'lft', label: 'LFT / Recruiting' },
  { id: 'off-topic', label: 'Off Topic' },
]

export const seedPosts: Post[] = [
  {
    id: 'p1',
    author: 'Ana Souza',
    avatar: 'AS',
    body: 'Olá, mundo! Primeira semana da liga de LoL começa na sexta. Bora?',
    image: 'https://placehold.co/640x360?text=Highlight',
    likes: 33,
    comments: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p2',
    author: 'postLover',
    avatar: 'PL',
    body: 'See you there!',
    image: null,
    likes: 5,
    comments: 1,
    createdAt: new Date().toISOString(),
  },
]

export const seedThreads: Thread[] = [
  {
    id: 't1',
    category: 'match-threads',
    title: '[CBLOL Univ] UFRJ vs USP — Bo3 • 19:00',
    author: 'mod',
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    posts: [
      { id: 'tp1', author: 'mod', body: 'Match thread aberto. Sem spoilers no título.', createdAt: Date.now() - 7200000 },
      { id: 'tp2', author: 'gui', body: 'Mapa 1 foi insano!', createdAt: Date.now() - 3500000 },
    ],
    up: 21,
    down: 2,
    pinned: false,
  },
  {
    id: 't2',
    category: 'general',
    title: 'Qual faculdade tem o melhor time de CS2 em SP?',
    author: 'bruna',
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
    posts: [{ id: 'tp3', author: 'bruna', body: 'Quero organizar amistoso.', createdAt: Date.now() - 600000 }],
    up: 5,
    down: 0,
    pinned: false,
  },
]
