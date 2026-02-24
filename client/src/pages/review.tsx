import { useQuery } from "@tanstack/react-query";

export default function Review() {

  const { data, isLoading } = useQuery({
    queryKey: ["daily"],
    queryFn: async () => {
      const res = await fetch("/api/questions/daily");
      return res.json();
    }
  });

  if (isLoading) return <div>Loading...</div>;

  if (!data) return <div>No questions today 🎉</div>;

  return (
    <div>
      <h2>{data.questionText}</h2>
      <p>{data.answerText}</p>
    </div>
  );
}