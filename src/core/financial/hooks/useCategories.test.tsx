import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "../lib/categories.api";

const ctx = vi.hoisted(() => ({ organizationId: "org-1" as string | null }));

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: { organizationId: string | null }) => unknown) =>
    selector({ organizationId: ctx.organizationId }),
}));
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "./useCategories";

vi.mock("../lib/categories.api", () => ({
  fetchCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("financial category hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ctx.organizationId = "org-1";
  });

  describe("useCategories", () => {
    it("returns the unwrapped categories list", async () => {
      vi.mocked(fetchCategories).mockResolvedValue({
        data: [{ id: "cat-1" }],
      } as never);

      const { result } = renderHook(() => useCategories(), {
        wrapper: wrapperFor(makeClient()),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(fetchCategories).toHaveBeenCalledWith("org-1", { limit: 100 });
      expect(result.current.categories).toEqual([{ id: "cat-1" }]);
    });

    it("stays disabled without an org", () => {
      ctx.organizationId = null;

      const { result } = renderHook(() => useCategories(), {
        wrapper: wrapperFor(makeClient()),
      });

      expect(result.current.categories).toEqual([]);
      expect(fetchCategories).not.toHaveBeenCalled();
    });
  });

  describe("useCreateCategory", () => {
    it("creates and invalidates + success toast", async () => {
      vi.mocked(createCategory).mockResolvedValue({ id: "cat-1" } as never);
      const queryClient = makeClient();
      const invalidate = vi
        .spyOn(queryClient, "invalidateQueries")
        .mockResolvedValue();

      const { result } = renderHook(() => useCreateCategory(), {
        wrapper: wrapperFor(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ name: "Lab" } as never);
      });

      expect(createCategory).toHaveBeenCalledWith("org-1", { name: "Lab" });
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: financialQueryKeys.categories.all(),
      });
      expect(toast.success).toHaveBeenCalledWith("Category created");
    });

    it("toasts on failure", async () => {
      vi.mocked(createCategory).mockRejectedValue(new Error("nope"));

      const { result } = renderHook(() => useCreateCategory(), {
        wrapper: wrapperFor(makeClient()),
      });

      await act(async () => {
        await result.current.mutateAsync({ name: "Lab" } as never).catch(() => {});
      });

      expect(toast.error).toHaveBeenCalledWith("Failed to create category");
    });
  });

  describe("useUpdateCategory", () => {
    it("updates and invalidates + success toast", async () => {
      vi.mocked(updateCategory).mockResolvedValue({ id: "cat-1" } as never);

      const { result } = renderHook(() => useUpdateCategory(), {
        wrapper: wrapperFor(makeClient()),
      });

      await act(async () => {
        await result.current.mutateAsync({
          id: "cat-1",
          payload: { name: "X" } as never,
        });
      });

      expect(updateCategory).toHaveBeenCalledWith("org-1", "cat-1", { name: "X" });
      expect(toast.success).toHaveBeenCalledWith("Category updated");
    });
  });

  describe("useDeleteCategory", () => {
    it("deletes and invalidates + success toast", async () => {
      vi.mocked(deleteCategory).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteCategory(), {
        wrapper: wrapperFor(makeClient()),
      });

      await act(async () => {
        await result.current.mutateAsync("cat-1");
      });

      expect(deleteCategory).toHaveBeenCalledWith("org-1", "cat-1");
      expect(toast.success).toHaveBeenCalledWith("Category deleted");
    });

    it("toasts on failure", async () => {
      vi.mocked(deleteCategory).mockRejectedValue(new Error("nope"));

      const { result } = renderHook(() => useDeleteCategory(), {
        wrapper: wrapperFor(makeClient()),
      });

      await act(async () => {
        await result.current.mutateAsync("cat-1").catch(() => {});
      });

      expect(toast.error).toHaveBeenCalledWith("Failed to delete category");
    });
  });
});
