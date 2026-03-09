import React, { useEffect, useState } from "react";
import Icon from "../../components/AppIcon";
import MobileHeader from "./components/MobileHeader";
import { formatCurrency } from "../../utils/formatters";
import { getDriverBills, getBillInvoiceHtml } from "../../lib/tvpManagementAPI";

export default function DriverBills({ driver }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionBillId, setActionBillId] = useState(null); // loading view/download for this bill

  useEffect(() => {
    if (!driver?.id) return;
    getDriverBills(driver.id).then(setBills).catch(() => setBills([])).finally(() => setLoading(false));
  }, [driver?.id]);

  const formatDateRange = (bill) => {
    if (!bill?.week_start && !bill?.created_at) return "—";
    const start = bill.week_start ? new Date(bill.week_start) : new Date(bill.created_at);
    const end = bill.week_end ? new Date(bill.week_end) : new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
    return `${start.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} - ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  };

  const totalPayable = bills.reduce((sum, b) => sum + Number(b.current_os ?? 0), 0);

  const openInvoiceWindow = (html, forPrint = false) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    if (forPrint) {
      w.onload = () => {
        w.print();
        w.onafterprint = () => w.close();
      };
    }
  };

  const handleView = async (bill) => {
    if (actionBillId) return;
    setActionBillId(bill.id);
    try {
      const html = await getBillInvoiceHtml(bill.id);
      openInvoiceWindow(html, false);
    } catch (err) {
      console.error(err);
    } finally {
      setActionBillId(null);
    }
  };

  const handleDownload = async (bill) => {
    if (actionBillId) return;
    setActionBillId(bill.id);
    try {
      const html = await getBillInvoiceHtml(bill.id);
      openInvoiceWindow(html, true);
    } catch (err) {
      console.error(err);
    } finally {
      setActionBillId(null);
    }
  };

  return (
    <div className="min-h-full bg-muted/30">
      <MobileHeader title="Bills" />
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-4">Your billing history</p>
        {loading ? (
          <div className="rounded-xl bg-card border border-border p-8 text-center text-muted-foreground">Loading…</div>
        ) : bills.length === 0 ? (
          <div className="rounded-xl bg-card border border-border shadow-sm p-8 text-center">
            <Icon name="FileText" size={40} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-foreground font-medium">No bills yet</p>
            <p className="text-sm text-muted-foreground mt-1">Bills will appear here once generated.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-card border border-border shadow-sm p-4">
              <p className="text-sm text-muted-foreground">Total payable</p>
              <p className="text-xl font-bold text-destructive tabular-nums">{formatCurrency(totalPayable)}</p>
            </div>
            {bills.map((bill) => (
              <div key={bill.id} className="rounded-xl bg-card border border-border shadow-sm p-4">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <p className="font-semibold text-foreground truncate">{bill.bill_number || "—"}</p>
                  <span className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary font-medium shrink-0">
                    {bill.status || "GENERATED"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{formatDateRange(bill)}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle</span>
                    <span className="text-foreground">{bill.vehicle_number || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rental days</span>
                    <span className="text-foreground">{bill.rental_days ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current OS</span>
                    <span className="font-bold text-destructive tabular-nums">{formatCurrency(bill.current_os ?? 0)}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => handleView(bill)}
                    disabled={actionBillId === bill.id}
                    className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Icon name="Eye" size={14} />
                    {actionBillId === bill.id ? "…" : "View"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(bill)}
                    disabled={actionBillId === bill.id}
                    className="flex-1 py-2 rounded-lg border border-border text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Icon name="Download" size={14} />
                    {actionBillId === bill.id ? "…" : "Download"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
