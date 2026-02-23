import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type NoteInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useNotes() {
  return useQuery({
    queryKey: [api.notes.list.path],
    queryFn: async () => {
      const res = await fetch(api.notes.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notes");
      const data = await res.json();
      return api.notes.list.responses[200].parse(data);
    },
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: NoteInput) => {
      const validated = api.notes.create.input.parse(data);
      const res = await fetch(api.notes.create.path, {
        method: api.notes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.notes.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create note");
      }
      return api.notes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.notes.list.path] });
      // Creating a note generates new questions, so invalidate question queries
      queryClient.invalidateQueries({ queryKey: [api.questions.status.path] });
      queryClient.invalidateQueries({ queryKey: [api.questions.getDaily.path] });
      
      toast({
        title: "Notes processed",
        description: "Your notes have been analyzed and added to your learning queue.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving notes",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}
