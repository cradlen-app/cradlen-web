import { loadGuideArticle } from "./registry";

describe("loadGuideArticle", () => {
  it("returns null for an unknown English slug", async () => {
    await expect(loadGuideArticle("en", "does-not-exist")).resolves.toBeNull();
  });

  it("returns null for an unknown Arabic slug", async () => {
    await expect(loadGuideArticle("ar", "does-not-exist")).resolves.toBeNull();
  });

  it("returns null for an empty slug in both locales", async () => {
    await expect(loadGuideArticle("en", "")).resolves.toBeNull();
    await expect(loadGuideArticle("ar", "")).resolves.toBeNull();
  });
});
