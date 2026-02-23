import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type ReviewInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useDailyQuestion() {
  return useQuery({
    queryKey: [api.questions.getDaily.path],
    queryFn: async () => {
      const res = await fetch(api.questions.getDaily.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch daily question");
      const data = await res.json();
      return api.questions.getDaily.responses[200].parse(data);
    },
  });
}

export function useMemoryStatus() {
  return useQuery({
    queryKey: [api.questions.status.path],
    queryFn: async () => {
      const res = await fetch(api.questions.status.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch memory status");
      const data = await res.json();
      return api.questions.status.responses[200].parse(data);
    },
  });
}

export function useReviewQuestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ReviewInput }) => {
      const validated = api.questions.review.input.parse(data);
      const url = buildUrl(api.questions.review.path, { id });
      
      const res = await fetch(url, {
        method: api.questions.review.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400 || res.status === 404) {
          const errorResponse = await res.json();
          // Type casting to any since error format depends on status code, but both have a message
          throw new Error(errorResponse.message || "Review failed");
        }
        throw new Error("Failed to submit review");
      }
      return api.questions.review.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate to fetch the next question and update stats
      queryClient.invalidateQueries({ queryKey: [api.questions.getDaily.path] });
      queryClient.invalidateQueries({ queryKey: [api.questions.status.path] });
    },
    onError: (error) => {
      toast({
        title: "Review submission failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}
