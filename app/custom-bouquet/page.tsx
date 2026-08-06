'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type {
  Flower,
  WrappingPaper,
  Ribbon,
  GreetingCard,
  GiftAddon,
  CustomBouquetFlower,
} from '@/types';
import { SiteLayout } from '@/components/layout/site-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Flower2,
  Gift,
  Package,
  Ribbon as RibbonIcon,
  Mail,
  Upload,
  Plus,
  Minus,
  ShoppingCart,
  Sparkles,
  Check,
} from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/features/cart/cart-context';
import { useAuth } from '@/features/auth/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CustomBouquetPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const { session } = useAuth();

  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [papers, setPapers] = useState<WrappingPaper[]>([]);
  const [ribbons, setRibbons] = useState<Ribbon[]>([]);
  const [cards, setCards] = useState<GreetingCard[]>([]);
  const [addons, setAddons] = useState<GiftAddon[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFlowers, setSelectedFlowers] = useState<CustomBouquetFlower[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
  const [selectedRibbon, setSelectedRibbon] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [cardMessage, setCardMessage] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [inspirationUrl, setInspirationUrl] = useState('');

  useEffect(() => {
    async function load() {
      const [f, p, r, c, a] = await Promise.all([
        supabase.from('flowers').select('*').eq('is_active', true).order('name'),
        supabase.from('wrapping_papers').select('*').eq('is_active', true).order('name'),
        supabase.from('ribbons').select('*').eq('is_active', true).order('name'),
        supabase.from('greeting_cards').select('*').eq('is_active', true).order('name'),
        supabase.from('gift_addons').select('*').eq('is_active', true).order('name'),
      ]);
      setFlowers(f.data as Flower[]);
      setPapers(p.data as WrappingPaper[]);
      setRibbons(r.data as Ribbon[]);
      setCards(c.data as GreetingCard[]);
      setAddons(a.data as GiftAddon[]);
      setLoading(false);
    }
    load();
  }, []);

  const totalPrice = useMemo(() => {
    let sum = 0;
    selectedFlowers.forEach((sf) => {
      sum += sf.price_cents * sf.quantity;
    });
    const paper = papers.find((p) => p.id === selectedPaper);
    if (paper) sum += paper.price_cents;
    const ribbon = ribbons.find((r) => r.id === selectedRibbon);
    if (ribbon) sum += ribbon.price_cents;
    const card = cards.find((c) => c.id === selectedCard);
    if (card) sum += card.price_cents;
    selectedAddons.forEach((id) => {
      const addon = addons.find((a) => a.id === id);
      if (addon) sum += addon.price_cents;
    });
    return sum;
  }, [selectedFlowers, selectedPaper, selectedRibbon, selectedCard, selectedAddons, papers, ribbons, cards, addons]);

  const budgetCents = budget ? parseInt(budget, 10) * 100 : 0;
  const overBudget = budgetCents > 0 && totalPrice > budgetCents;

  function toggleFlower(flower: Flower) {
    const existing = selectedFlowers.find((sf) => sf.flower_id === flower.id);
    if (existing) {
      setSelectedFlowers(selectedFlowers.filter((sf) => sf.flower_id !== flower.id));
    } else {
      setSelectedFlowers([
        ...selectedFlowers,
        {
          flower_id: flower.id,
          name: flower.name,
          quantity: 1,
          price_cents: flower.price_cents,
        },
      ]);
    }
  }

  function updateFlowerQty(flowerId: string, delta: number) {
    setSelectedFlowers(
      selectedFlowers.map((sf) =>
        sf.flower_id === flowerId
          ? { ...sf, quantity: Math.max(1, sf.quantity + delta) }
          : sf
      )
    );
  }

  function toggleAddon(id: string) {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  function handleAddToCart() {
    if (selectedFlowers.length === 0) {
      toast.error('Please select at least one flower');
      return;
    }
    if (overBudget) {
      toast.error('Your bouquet is over budget. Adjust your selections.');
      return;
    }

    const flowerNames = selectedFlowers
      .map((sf) => `${sf.quantity}× ${sf.name}`)
      .join(', ');

    addItem({
      type: 'custom',
      custom_bouquet: {
        id: crypto.randomUUID(),
        user_id: session?.user?.id ?? '',
        name: 'Custom Bouquet',
        flowers: selectedFlowers,
        wrapping_paper_id: selectedPaper,
        ribbon_id: selectedRibbon,
        greeting_card_id: selectedCard,
        card_message: cardMessage || null,
        gift_addon_ids: selectedAddons,
        budget_cents: budgetCents || null,
        inspiration_image_url: inspirationUrl || null,
        total_price_cents: totalPrice,
        created_at: new Date().toISOString(),
      },
      name: `Custom Bouquet (${flowerNames})`,
      unit_price_cents: totalPrice,
      quantity: 1,
    });
    toast.success('Custom bouquet added to cart!');
  }

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="space-y-4">
            <div className="h-10 w-1/2 rounded shimmer" />
            <div className="h-64 rounded-2xl shimmer" />
            <div className="h-64 rounded-2xl shimmer" />
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-rose-50 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Design Your Own
          </div>
          <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Custom Bouquet Builder
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Create a one-of-a-kind arrangement. Pick your flowers, wrapping, and extras.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            {/* Flowers */}
            <BuilderSection icon={Flower2} title="Choose Your Flowers" step={1}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {flowers.map((flower) => {
                  const selected = selectedFlowers.find(
                    (sf) => sf.flower_id === flower.id
                  );
                  return (
                    <button
                      key={flower.id}
                      onClick={() => toggleFlower(flower)}
                      className={cn(
                        'rounded-xl border-2 p-3 text-left transition-all',
                        selected
                          ? 'border-primary bg-rose-50'
                          : 'border-border/40 bg-card hover:border-primary/30'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-serif text-sm font-semibold">
                            {flower.name}
                          </p>
                          {flower.color && (
                            <p className="text-xs text-muted-foreground">
                              {flower.color}
                            </p>
                          )}
                          <p className="mt-1 text-xs font-medium text-primary">
                            {formatPrice(flower.price_cents)} each
                          </p>
                        </div>
                        {selected && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      {selected && (
                        <div
                          className="mt-2 flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateFlowerQty(flower.id, -1);
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-xs font-bold">
                            {selected.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateFlowerQty(flower.id, 1);
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </BuilderSection>

            {/* Wrapping Paper */}
            <BuilderSection icon={Package} title="Wrapping Paper" step={2}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {papers.map((paper) => (
                  <button
                    key={paper.id}
                    onClick={() =>
                      setSelectedPaper(
                        selectedPaper === paper.id ? null : paper.id
                      )
                    }
                    className={cn(
                      'rounded-xl border-2 p-3 text-left transition-all',
                      selectedPaper === paper.id
                        ? 'border-primary bg-rose-50'
                        : 'border-border/40 bg-card hover:border-primary/30'
                    )}
                  >
                    <p className="font-serif text-sm font-semibold">{paper.name}</p>
                    {paper.color && (
                      <p className="text-xs text-muted-foreground">{paper.color}</p>
                    )}
                    <p className="mt-1 text-xs font-medium text-primary">
                      {formatPrice(paper.price_cents)}
                    </p>
                  </button>
                ))}
              </div>
            </BuilderSection>

            {/* Ribbon */}
            <BuilderSection icon={RibbonIcon} title="Ribbon Color" step={3}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {ribbons.map((ribbon) => (
                  <button
                    key={ribbon.id}
                    onClick={() =>
                      setSelectedRibbon(
                        selectedRibbon === ribbon.id ? null : ribbon.id
                      )
                    }
                    className={cn(
                      'rounded-xl border-2 p-3 text-left transition-all',
                      selectedRibbon === ribbon.id
                        ? 'border-primary bg-rose-50'
                        : 'border-border/40 bg-card hover:border-primary/30'
                    )}
                  >
                    <p className="font-serif text-sm font-semibold">{ribbon.name}</p>
                    {ribbon.color && (
                      <p className="text-xs text-muted-foreground">{ribbon.color}</p>
                    )}
                    <p className="mt-1 text-xs font-medium text-primary">
                      {formatPrice(ribbon.price_cents)}
                    </p>
                  </button>
                ))}
              </div>
            </BuilderSection>

            {/* Greeting Card */}
            <BuilderSection icon={Mail} title="Greeting Card" step={4}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() =>
                      setSelectedCard(selectedCard === card.id ? null : card.id)
                    }
                    className={cn(
                      'rounded-xl border-2 p-3 text-left transition-all',
                      selectedCard === card.id
                        ? 'border-primary bg-rose-50'
                        : 'border-border/40 bg-card hover:border-primary/30'
                    )}
                  >
                    <p className="font-serif text-sm font-semibold">{card.name}</p>
                    {card.design && (
                      <p className="text-xs text-muted-foreground">{card.design}</p>
                    )}
                    <p className="mt-1 text-xs font-medium text-primary">
                      {formatPrice(card.price_cents)}
                    </p>
                  </button>
                ))}
              </div>
              {selectedCard && (
                <div className="mt-4">
                  <Label htmlFor="cardMessage">Card Message</Label>
                  <Textarea
                    id="cardMessage"
                    placeholder="Write your heartfelt message..."
                    value={cardMessage}
                    onChange={(e) => setCardMessage(e.target.value)}
                    rows={3}
                    className="mt-1"
                    maxLength={300}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cardMessage.length}/300 characters
                  </p>
                </div>
              )}
            </BuilderSection>

            {/* Gift Addons */}
            <BuilderSection icon={Gift} title="Add a Gift" step={5}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {addons.map((addon) => (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={cn(
                      'rounded-xl border-2 p-3 text-left transition-all',
                      selectedAddons.includes(addon.id)
                        ? 'border-primary bg-rose-50'
                        : 'border-border/40 bg-card hover:border-primary/30'
                    )}
                  >
                    <p className="font-serif text-sm font-semibold">{addon.name}</p>
                    <Badge variant="outline" className="mt-1 text-xs capitalize">
                      {addon.type}
                    </Badge>
                    <p className="mt-1 text-xs font-medium text-primary">
                      {formatPrice(addon.price_cents)}
                    </p>
                  </button>
                ))}
              </div>
            </BuilderSection>

            {/* Budget & Inspiration */}
            <BuilderSection icon={Upload} title="Budget & Inspiration" step={6}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget">Your Budget (optional)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="e.g. 1500"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    We&apos;ll help you stay within your budget.
                  </p>
                </div>
                <div>
                  <Label htmlFor="inspiration">Inspiration Image URL (optional)</Label>
                  <Input
                    id="inspiration"
                    type="url"
                    placeholder="https://..."
                    value={inspirationUrl}
                    onChange={(e) => setInspirationUrl(e.target.value)}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Share a reference image for our florists.
                  </p>
                </div>
              </div>
            </BuilderSection>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
              <h3 className="font-serif text-lg font-semibold">Your Bouquet</h3>

              <ScrollArea className="mt-4 max-h-[300px]">
                <div className="space-y-3 pr-4">
                  {selectedFlowers.length > 0 ? (
                    selectedFlowers.map((sf) => (
                      <div
                        key={sf.flower_id}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {sf.quantity}× {sf.name}
                        </span>
                        <span className="font-medium">
                          {formatPrice(sf.price_cents * sf.quantity)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No flowers selected yet.
                    </p>
                  )}

                  {selectedPaper &&
                    papers.find((p) => p.id === selectedPaper) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {papers.find((p) => p.id === selectedPaper)?.name}
                        </span>
                        <span className="font-medium">
                          {formatPrice(
                            papers.find((p) => p.id === selectedPaper)?.price_cents ?? 0
                          )}
                        </span>
                      </div>
                    )}

                  {selectedRibbon &&
                    ribbons.find((r) => r.id === selectedRibbon) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {ribbons.find((r) => r.id === selectedRibbon)?.name}
                        </span>
                        <span className="font-medium">
                          {formatPrice(
                            ribbons.find((r) => r.id === selectedRibbon)?.price_cents ?? 0
                          )}
                        </span>
                      </div>
                    )}

                  {selectedCard &&
                    cards.find((c) => c.id === selectedCard) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {cards.find((c) => c.id === selectedCard)?.name}
                        </span>
                        <span className="font-medium">
                          {formatPrice(
                            cards.find((c) => c.id === selectedCard)?.price_cents ?? 0
                          )}
                        </span>
                      </div>
                    )}

                  {selectedAddons.map((id) => {
                    const addon = addons.find((a) => a.id === id);
                    if (!addon) return null;
                    return (
                      <div key={id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{addon.name}</span>
                        <span className="font-medium">
                          {formatPrice(addon.price_cents)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="mt-4 border-t border-border/40 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                {budgetCents > 0 && (
                  <div
                    className={cn(
                      'mt-2 text-sm',
                      overBudget ? 'text-red-500' : 'text-green-600'
                    )}
                  >
                    {overBudget
                      ? `${formatPrice(totalPrice - budgetCents)} over budget`
                      : `${formatPrice(budgetCents - totalPrice)} under budget`}
                  </div>
                )}
              </div>

              <Button
                className="mt-4 w-full"
                size="lg"
                onClick={handleAddToCart}
                disabled={selectedFlowers.length === 0 || overBudget}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              {!session && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  You can add to cart without signing in.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function BuilderSection({
  icon: Icon,
  title,
  step,
  children,
}: {
  icon: React.ElementType;
  title: string;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Step {step}</p>
          <h2 className="font-serif text-lg font-semibold">{title}</h2>
        </div>
      </div>
      {children}
    </div>
  );
}
