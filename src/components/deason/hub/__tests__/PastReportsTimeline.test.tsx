// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  PastReportsTimeline,
  threadHrefForReport,
  type DocumentLinkContext,
} from "../PastReportsTimeline";
import type { MonthlyReport, LibraryDoc } from "@/hooks/useDeasonHub";

function makeReport(id: string, period_month: string, extras: Partial<MonthlyReport> = {}): MonthlyReport {
  return {
    id,
    period_month,
    dollars_saved: 42,
    bonus_tokens: 0,
    narrative: `Report ${id}`,
    structured_report: {},
    status: "ready",
    ...extras,
  };
}

function makeDoc(id: string, period_month: string | null, kind: LibraryDoc["kind"], label: string): LibraryDoc {
  return {
    id,
    kind,
    label,
    storage_path: `path/${id}`,
    source: "monthly_ritual",
    period_month,
    uploaded_at: new Date().toISOString(),
  };
}

describe("PastReportsTimeline document linking", () => {
  const reportMarch = makeReport("r-march", "2026-03-01");
  const reportApril = makeReport("r-april", "2026-04-01");
  const reports = [reportApril, reportMarch];

  const docMarchBill = makeDoc("d-mar-bill", "2026-03-01", "utility_bill", "Oncor bill — March");
  const docMarchPpa = makeDoc("d-mar-ppa", "2026-03-01", "ppa", "Sunnova PPA");
  const docAprilBill = makeDoc("d-apr-bill", "2026-04-01", "utility_bill", "Oncor bill — April");
  const library = [docMarchBill, docMarchPpa, docAprilBill];

  it("links each document to the matching monthly report and chat thread href", () => {
    const onOpenDocument = vi.fn();
    render(
      <PastReportsTimeline reports={reports} library={library} onOpenDocument={onOpenDocument} />,
    );

    // Expand March row → reveals the two March docs.
    fireEvent.click(screen.getByTestId("report-row-r-march"));
    const marchBillBtn = screen.getByTestId("doc-link-d-mar-bill");
    const marchPpaBtn = screen.getByTestId("doc-link-d-mar-ppa");

    // Both March docs advertise the March report id + March thread href.
    expect(marchBillBtn.getAttribute("data-report-id")).toBe("r-march");
    expect(marchBillBtn.getAttribute("data-thread-href")).toBe(threadHrefForReport("r-march"));
    expect(marchPpaBtn.getAttribute("data-report-id")).toBe("r-march");

    fireEvent.click(marchBillBtn);
    expect(onOpenDocument).toHaveBeenCalledTimes(1);
    const callArg = onOpenDocument.mock.calls[0][0] as DocumentLinkContext;
    expect(callArg.doc.id).toBe("d-mar-bill");
    expect(callArg.report?.id).toBe("r-march");
    expect(callArg.threadHref).toBe(threadHrefForReport("r-march"));

    // Now expand April → only the April bill should appear, linked to r-april.
    fireEvent.click(screen.getByTestId("report-row-r-april"));
    const aprilBillBtn = screen.getByTestId("doc-link-d-apr-bill");
    expect(aprilBillBtn.getAttribute("data-report-id")).toBe("r-april");
    expect(aprilBillBtn.getAttribute("data-thread-href")).toBe(threadHrefForReport("r-april"));

    // March docs must not leak into April's expanded row.
    expect(screen.queryByTestId("doc-link-d-mar-bill")).toBeNull();

    fireEvent.click(aprilBillBtn);
    const aprilArg = onOpenDocument.mock.calls[1][0] as DocumentLinkContext;
    expect(aprilArg.doc.id).toBe("d-apr-bill");
    expect(aprilArg.report?.id).toBe("r-april");
    expect(aprilArg.threadHref).toBe(threadHrefForReport("r-april"));
  });
});
