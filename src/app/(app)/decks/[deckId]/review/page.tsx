import { ReviewView } from '@/features/flashcards/review-view';

export default async function ReviewPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params;
  return <ReviewView deckId={deckId} />;
}
