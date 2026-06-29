import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import type { MedicalRepVisitHistoryItem } from "../../types/medical-rep.types";

const { useHistoryMock, loadMoreMock } = vi.hoisted(() => ({
  useHistoryMock: vi.fn(),
  loadMoreMock: vi.fn(),
}));

vi.mock("../../hooks/useMedicalRepVisitHistory", () => ({
  useMedicalRepVisitHistory: (source: unknown) => useHistoryMock(source),
}));

import { RepVisitsHistoryList } from "./RepVisitsHistoryList";

function makeItem(over: Partial<MedicalRepVisitHistoryItem> = {}): MedicalRepVisitHistoryItem {
  return {
    id: "v1",
    scheduled_at: "2026-06-01T09:00:00.000Z",
    completed_at: null,
    status: "COMPLETED",
    purpose: "SAMPLE_DROP",
    outcome: null,
    samples_received: true,
    follow_up_date: null,
    notes: null,
    products: [{ id: "p1", name: "Aspirin" }],
    ...over,
  };
}

function mockHistory(over: Partial<ReturnType<typeof useHistoryMock>> = {}) {
  useHistoryMock.mockReturnValue({
    entries: [],
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    loadMore: loadMoreMock,
    ...over,
  });
}

describe("RepVisitsHistoryList", () => {
  beforeEach(() => {
    useHistoryMock.mockReset();
    loadMoreMock.mockReset();
  });

  it("renders skeletons while loading", () => {
    mockHistory({ isLoading: true });

    const { container } = renderWithIntl(
      <RepVisitsHistoryList source={{ visitId: "vis-1" }} />,
    );

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByText("No previous visits")).not.toBeInTheDocument();
  });

  it("renders the empty state when there are no entries", () => {
    mockHistory({ entries: [] });

    renderWithIntl(<RepVisitsHistoryList source={{ visitId: "vis-1" }} />);

    expect(screen.getByText("No previous visits")).toBeInTheDocument();
  });

  it("renders entry cards with purpose and products", () => {
    mockHistory({ entries: [makeItem()] });

    renderWithIntl(<RepVisitsHistoryList source={{ visitId: "vis-1" }} />);

    expect(screen.getByText("Sample drop")).toBeInTheDocument();
    expect(screen.getByText("Aspirin")).toBeInTheDocument();
  });

  it("opens the details dialog from a card", () => {
    mockHistory({ entries: [makeItem()] });

    renderWithIntl(<RepVisitsHistoryList source={{ visitId: "vis-1" }} />);

    fireEvent.click(screen.getByRole("button", { name: /Visit Details/i }));

    expect(screen.getByText("Visit details")).toBeInTheDocument();
  });

  it("shows a load-more button and triggers loadMore", () => {
    mockHistory({ entries: [makeItem()], hasMore: true });

    renderWithIntl(<RepVisitsHistoryList source={{ visitId: "vis-1" }} />);

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));

    expect(loadMoreMock).toHaveBeenCalledTimes(1);
  });
});
