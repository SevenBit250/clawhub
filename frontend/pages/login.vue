<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="bg-white p-8 rounded-lg shadow-md w-96">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold mb-2">Login to ClawHub</h1>
        <p class="text-gray-500 text-sm">Mock login for development</p>
      </div>

      <div v-if="loading" class="text-center py-8">
        <p class="text-gray-500">Logging in...</p>
      </div>

      <div v-else-if="error" class="text-center py-8">
        <p class="text-red-500 mb-4">{{ error }}</p>
        <button @click="goBack" class="btn btn-secondary">Go Back</button>
      </div>

      <div v-else>
        <div class="space-y-3">
          <button
            @click="loginAs('mock_admin')"
            class="w-full py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">A</div>
            <div class="text-left">
              <div class="font-medium">Admin User</div>
              <div class="text-sm text-gray-500">Full access</div>
            </div>
          </button>

          <button
            @click="loginAs('mock_user')"
            class="w-full py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">T</div>
            <div class="text-left">
              <div class="font-medium">Test User</div>
              <div class="text-sm text-gray-500">Standard access</div>
            </div>
          </button>

          <button
            @click="loginAs('mock_new')"
            class="w-full py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">N</div>
            <div class="text-left">
              <div class="font-medium">New User</div>
              <div class="text-sm text-gray-500">Creates a new account</div>
            </div>
          </button>
        </div>

        <p class="text-center text-gray-400 text-sm mt-6">
          This is a mock login for development only
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { login } = useAuth()
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const error = ref('')

  async function loginAs(code: string) {
  loading.value = true
  error.value = ''

  try {
    await login(code)
    const redirect = route.query.redirect as string || '/'
    router.push(redirect)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed'
    loading.value = false
  }
}

function goBack() {
  router.back()
}
</script>
