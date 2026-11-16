import { describe, expect, it } from "vitest";
import { CREATE_ITEMS, navItemsFor } from "./nav";

describe("nav", () => {
  it("learner nav is Học, Khóa học, Thẻ, Tôi", () => {
    expect(navItemsFor("LEARNER").map((i) => i.label)).toEqual([
      "Học",
      "Khóa học",
      "Thẻ",
      "Tôi",
    ]);
  });
  it("create menu offers course, deck, AI cards", () => {
    expect(CREATE_ITEMS.map((i) => i.href)).toEqual([
      "/courses/new",
      "/decks?new=1",
      "/decks/generate",
    ]);
  });
});
