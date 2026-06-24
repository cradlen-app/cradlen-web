"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FaqItem = { q: string; a: string };
type FaqCategory = { id: string; title: string; items: FaqItem[] };

type Props = {
  categories: FaqCategory[];
};

/**
 * Help Center FAQ — questions grouped by category, each an expand/collapse
 * accordion (one open item per category). Client component; the page passes in
 * already-translated content.
 */
export default function HelpCenterFaq({ categories }: Props) {
  return (
    <div className="space-y-10">
      {categories.map((category) => (
        <section key={category.id} id={category.id} className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-brand-black">
            {category.title}
          </h2>
          <Accordion
            type="single"
            collapsible
            className="mt-2 border-t border-black/10"
          >
            {category.items.map((item, index) => (
              <AccordionItem
                key={index}
                value={`${category.id}-${index}`}
                className="border-black/10"
              >
                <AccordionTrigger className="text-brand-black/85 hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="leading-7 text-brand-black/70">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}
    </div>
  );
}
