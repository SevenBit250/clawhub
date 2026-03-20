<template>
  <div class="container py-8">
    <div v-if="pending" class="text-center py-20">Loading...</div>
    <div v-else-if="error || !skill" class="text-center py-20">
      Skill not found
    </div>
    <div v-else>
      <div class="flex items-start justify-between mb-6">
        <div>
          <h1 class="text-4xl font-bold mb-2">{{ skill.displayName }}</h1>
          <p class="text-gray-600">by {{ skill.owner?.handle || skill.owner?.displayName || 'Unknown' }}</p>
        </div>
        <div class="flex gap-4">
          <button @click="toggleStar" class="btn btn-secondary">
            {{ isStarred ? '⭐ Starred' : '☆ Star' }} {{ starCount > 0 ? `(${starCount})` : '' }}
          </button>
          <button class="btn btn-primary">Install</button>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-8">
        <div class="col-span-2">
          <div class="border rounded-lg p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">Description</h2>
            <p class="text-gray-700">{{ skill.summary || 'No description available' }}</p>
          </div>

          <div v-if="version" class="border rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold">Version {{ version.version }}</h2>
              <span class="text-gray-500">{{ new Date(version.createdAt).toLocaleDateString() }}</span>
            </div>
            <div>
              <p>{{ version.changelog }}</p>
            </div>

            <div v-if="version.files?.length" class="mt-6">
              <h3 class="font-semibold mb-2">Files</h3>
              <ul class="space-y-2">
                <li v-for="file in version.files" :key="file.path" class="flex items-center gap-2">
                  <span class="text-gray-600">{{ file.path }}</span>
                  <span class="text-sm text-gray-400">({{ formatSize(file.size) }})</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="border rounded-lg p-6 mt-6">
            <h2 class="text-xl font-semibold mb-4">Comments</h2>

            <div v-if="isAuthenticated" class="mb-6">
              <textarea
                v-model="newComment"
                placeholder="Write a comment..."
                class="w-full border rounded-lg p-3 mb-2"
                rows="3"
              />
              <button
                @click="submitComment"
                :disabled="submitting || !newComment.trim()"
                class="btn btn-primary"
              >
                {{ submitting ? 'Posting...' : 'Post Comment' }}
              </button>
            </div>
            <div v-else class="mb-6 text-gray-500">
              Please login to leave a comment.
            </div>

            <div v-if="commentsLoading" class="text-center py-4">Loading comments...</div>
            <div v-else-if="comments.length === 0" class="text-gray-500 text-center py-4">
              No comments yet. Be the first to comment!
            </div>
            <div v-else class="space-y-4">
              <div v-for="comment in comments" :key="comment.id" class="border-b pb-4">
                <div class="flex items-start justify-between">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-medium">{{ comment.user?.displayName || comment.user?.handle || 'Anonymous' }}</span>
                      <span class="text-gray-400 text-sm">{{ formatDate(comment.createdAt) }}</span>
                    </div>
                    <p class="text-gray-700">{{ comment.body }}</p>
                  </div>
                  <button
                    v-if="user?.id === comment.userId"
                    @click="deleteComment(comment.id)"
                    class="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="border rounded-lg p-6 sticky top-4">
            <h3 class="font-semibold mb-4">Stats</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">Downloads</span>
                <span class="font-medium">{{ skill.statsDownloads || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Stars</span>
                <span class="font-medium">{{ skill.statsStars || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Installs</span>
                <span class="font-medium">{{ skill.statsInstallsCurrent || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface CommentUser {
  id: string
  handle: string | null
  displayName: string | null
}

interface Comment {
  id: string
  userId: string
  body: string
  createdAt: string
  user: CommentUser | null
}

const api = useApi()
const { isAuthenticated, token, user } = useAuth()
const route = useRoute()
const slug = route.params.slug as string

const { data, pending, error } = await useAsyncData(
  `skill-${slug}`,
  () => api.get<{
    skill: {
      id: string
      slug: string
      displayName: string
      summary: string | null
      statsDownloads: number
      statsStars: number
      statsInstallsCurrent: number
      badges: Record<string, unknown> | null
      owner: { handle: string | null; displayName: string | null } | null
    }
    version: {
      version: string
      changelog: string
      createdAt: string
      files: Array<{ path: string; size: number }>
    } | null
  }>(`/skills/${slug}`)
)

const skill = computed(() => data.value?.skill)
const version = computed(() => data.value?.version)
const isStarred = ref(false)
const starCount = ref(0)
const comments = ref<Comment[]>([])
const commentsLoading = ref(true)
const newComment = ref('')
const submitting = ref(false)

const { data: starData } = await useAsyncData(
  `skill-${slug}-star`,
  () => api.get<{ starred: boolean; starCount: number }>(`/skills/${skill.value?.id}/star`, {
    token: token.value,
  })
)

if (starData.value) {
  isStarred.value = starData.value.starred
  starCount.value = starData.value.starCount
}

const { data: commentsData, refresh: refreshComments } = await useAsyncData(
  `skill-${slug}-comments`,
  async () => {
    if (!skill.value?.id) return { comments: [] }
    return api.get<{ comments: Comment[] }>(`/skills/${skill.value.id}/comments`)
  }
)

if (commentsData.value) {
  comments.value = commentsData.value.comments
}
commentsLoading.value = false

async function toggleStar() {
  if (!isAuthenticated.value) {
    alert('Please login first')
    return
  }
  if (!skill.value?.id) return

  try {
    const result = await api.post<{ starred: boolean; starCount: number }>(
      `/skills/${skill.value.id}/star`,
      {},
      { token: token.value }
    )
    isStarred.value = result.starred
    starCount.value = result.starCount
  } catch (err) {
    console.error('Failed to toggle star:', err)
  }
}

async function submitComment() {
  if (!isAuthenticated.value || !skill.value?.id || !newComment.value.trim()) return

  submitting.value = true
  try {
    const result = await api.post<{ comment: Comment }>(
      `/skills/${skill.value.id}/comments`,
      { body: newComment.value.trim() },
      { token: token.value }
    )
    comments.value = [result.comment, ...comments.value]
    newComment.value = ''
  } catch (err) {
    console.error('Failed to post comment:', err)
  } finally {
    submitting.value = false
  }
}

async function deleteComment(commentId: string) {
  if (!confirm('Delete this comment?')) return

  try {
    await api.delete(`/comments/${commentId}`, { token: token.value })
    comments.value = comments.value.filter(c => c.id !== commentId)
  } catch (err) {
    console.error('Failed to delete comment:', err)
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>
