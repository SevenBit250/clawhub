import { useDebounceFn } from "@vueuse/core";

const api = useApi();

export function useSearch() {
  const query = ref("");
  const results = ref<Array<{
    id: string;
    slug: string;
    displayName: string;
    summary: string | null;
    ownerHandle: string | null;
    ownerName: string | null;
    statsStars: number;
    statsDownloads: number;
    score: number;
  }>>([]);
  const pending = ref(false);
  const error = ref<string | null>(null);

  async function search(q: string) {
    if (!q || q.trim().length === 0) {
      results.value = [];
      return;
    }

    pending.value = true;
    error.value = null;

    try {
      const response = await api.get<{
        results: typeof results.value;
        query: string;
      }>(`/search?q=${encodeURIComponent(q)}`);
      results.value = response.results;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Search failed";
      results.value = [];
    } finally {
      pending.value = false;
    }
  }

  const debouncedSearch = useDebounceFn(search, 300);

  watch(query, (newQuery) => {
    if (newQuery.trim().length > 0) {
      debouncedSearch(newQuery);
    } else {
      results.value = [];
    }
  });

  return {
    query,
    results,
    pending,
    error,
    search,
  };
}
