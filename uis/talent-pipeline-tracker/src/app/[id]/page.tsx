import { CandidateDetailPage } from "@/src/components/candidate-detail-page";

interface CandidatePageProps {
  params: Promise<{ id: string }>;
}

export default async function CandidatePage({ params }: CandidatePageProps) {
  const { id } = await params;
  return <CandidateDetailPage id={id} />;
}
