import { FreeDetail } from "@/components/board/FreeDetail";

type FreeDetailPageProps = {
  params: {
    id: string;
  };
};

export default function FreeDetailPage({ params }: FreeDetailPageProps) {
  return <FreeDetail id={params.id} />;
}
