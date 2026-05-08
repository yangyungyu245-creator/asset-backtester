import { FeedbackDetail } from "@/components/board/FeedbackDetail";

type FeedbackDetailPageProps = {
  params: {
    id: string;
  };
};

export default function FeedbackDetailPage({ params }: FeedbackDetailPageProps) {
  return <FeedbackDetail id={params.id} />;
}
