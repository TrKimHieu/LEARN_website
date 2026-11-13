import { DeckDetailView } from '@/features/flashcards/deck-detail-view';

export default async function DeckPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params;
  return <DeckDetailView deckId={deckId} />;
}
