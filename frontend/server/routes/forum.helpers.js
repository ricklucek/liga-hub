export const threadInclude = {
  author: {
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      displayName: true,
      school: true,
      role: true,
    },
  },
  category: { select: { id: true, slug: true, name: true } },
  votes: true,
  _count: { select: { posts: true } },
}

export const postInclude = {
  author: {
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      displayName: true,
      school: true,
      role: true,
    },
  },
}

export const toThreadPayload = (thread, viewerId) => {
  const voteTotal = thread.votes.reduce((sum, vote) => sum + vote.value, 0)
  const viewerVote = thread.votes.find((v) => v.userId === viewerId)?.value ?? 0
  return {
    id: thread.id,
    title: thread.title,
    body: thread.body,
    isPinned: thread.isPinned,
    isLocked: thread.isLocked,
    createdAt: thread.createdAt,
    lastActivityAt: thread.lastActivityAt,
    replyCount: thread._count?.posts ?? 0,
    voteTotal,
    viewerVote,
    category: thread.category,
    author: thread.author,
  }
}

export const toPostPayload = (post) => ({
  id: post.id,
  threadId: post.threadId,
  body: post.deletedAt ? null : post.body,
  isDeleted: Boolean(post.deletedAt),
  parentId: post.parentId,
  createdAt: post.createdAt,
  deletedAt: post.deletedAt,
  author: post.author,
})
