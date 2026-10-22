/**
 * Supabase service for Inventory purchase orders, goods receipts, and bills.
 * All records are scoped by business_id and child rows are returned in UI shape.
 */

import { supabase } from "../lib/supabase";
import { inventoryMovementsService } from "./inventoryMovements";
import type {
  GoodsReceivedNote,
  POStatus,
  PurchaseBill,
  PurchaseOrder,
  PurchaseOrderItem,
  PaymentStatus,
} from "../lib/inventory-data";

export interface DbPurchaseOrder {
  id: string;
  business_id: string;
  po_number: string;
  supplier_id: string;
  status: POStatus;
  created_date: string;
  expected_date: string;
  notes: string;
  supplier_notes: string | null;
  approved_by: string | null;
  approved_date: string | null;
  reference_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  business_id: string;
  product_id: string;
  quantity: number;
  received_qty: number;
  unit_price: number;
}

export interface DbGoodsReceivedNote extends GoodsReceivedNote {
  business_id: string;
  created_at: string;
}

export interface DbPurchaseBill {
  id: string;
  business_id: string;
  bill_number: string;
  purchase_order_id: string | null;
  po_number: string;
  supplier_id: string;
  bill_date: string;
  due_date: string;
  subtotal: number;
  gst_amount: number;
  total: number;
  payment_status: PaymentStatus;
  amount_paid: number;
  created_at: string;
  updated_at: string;
}

interface DbGoodsReceivedNoteItemRow {
  product_id: string;
  ordered_qty: number;
  received_qty: number;
  quality_status: "ok" | "partial" | "rejected";
}

interface DbGoodsReceivedNoteRow {
  id: string;
  grn_number: string;
  purchase_order_id: string;
  supplier_id: string;
  received_date: string;
  received_by: string;
  notes: string;
  reference_number: string | null;
  goods_received_note_items: DbGoodsReceivedNoteItemRow[] | null;
}

export interface PurchaseOrderInput {
  supplierId: string;
  status: POStatus;
  expectedDate: string;
  notes: string;
  supplierNotes?: string;
  referenceNumber?: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
}

export interface GoodsReceiptInput {
  orderId: string;
  receivedBy: string;
  referenceNumber?: string;
  notes: string;
  items: { purchaseOrderItemId: string; receivedQty: number }[];
}

export interface PurchaseBillInput {
  purchaseOrderId?: string;
  supplierId: string;
  poNumber: string;
  billDate: string;
  dueDate: string;
  subtotal: number;
  gstAmount: number;
  total: number;
  amountPaid: number;
}

function isOverdue(bill: Pick<DbPurchaseBill, "payment_status" | "due_date" | "amount_paid" | "total">) {
  return bill.amount_paid < bill.total && bill.due_date < new Date().toISOString().slice(0, 10);
}

function dbBillToUi(bill: DbPurchaseBill): PurchaseBill {
  return {
    id: bill.id,
    billNumber: bill.bill_number,
    poNumber: bill.po_number,
    purchaseOrderId: bill.purchase_order_id ?? undefined,
    supplierId: bill.supplier_id,
    billDate: bill.bill_date,
    dueDate: bill.due_date,
    subtotal: bill.subtotal,
    gstAmount: bill.gst_amount,
    total: bill.total,
    paymentStatus: isOverdue(bill) ? "overdue" : bill.payment_status,
    amountPaid: bill.amount_paid,
  };
}

function dbOrderToUi(order: DbPurchaseOrder, items: DbPurchaseOrderItem[]): PurchaseOrder {
  const orderItems = items.filter((item) => item.purchase_order_id === order.id);
  return {
    id: order.id,
    poNumber: order.po_number,
    supplierId: order.supplier_id,
    status: order.status,
    createdDate: order.created_date,
    expectedDate: order.expected_date,
    itemIds: Object.fromEntries(orderItems.map((item) => [item.product_id, item.id])),
    items: orderItems
      .map<PurchaseOrderItem>((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
        receivedQty: item.received_qty,
        unitPrice: item.unit_price,
      })),
    notes: order.notes,
    supplierNotes: order.supplier_notes ?? undefined,
    approvedBy: order.approved_by ?? undefined,
    approvedDate: order.approved_date ?? undefined,
    referenceNumber: order.reference_number ?? undefined,
  };
}

function dbGrnToUi(row: DbGoodsReceivedNoteRow): GoodsReceivedNote {
  return {
    id: row.id,
    grnNumber: row.grn_number,
    poId: row.purchase_order_id,
    supplierId: row.supplier_id,
    receivedDate: row.received_date,
    receivedBy: row.received_by,
    notes: row.notes,
    referenceNumber: row.reference_number ?? undefined,
    items: (row.goods_received_note_items ?? []).map((item) => ({
      productId: item.product_id,
      orderedQty: item.ordered_qty,
      receivedQty: item.received_qty,
      qualityStatus: item.quality_status,
    })),
  };
}

export const purchaseFlowService = {
  async getOrders(businessId: string): Promise<{ orders: PurchaseOrder[]; grns: GoodsReceivedNote[] }> {
    const [{ data: orders, error: ordersError }, { data: items, error: itemsError }, { data: grns, error: grnsError }] =
      await Promise.all([
        supabase.from("purchase_orders").select("*").eq("business_id", businessId).order("created_at", { ascending: false }),
        supabase.from("purchase_order_items").select("*").eq("business_id", businessId),
        supabase
          .from("goods_received_notes")
          .select("*, goods_received_note_items(*)")
          .eq("business_id", businessId)
          .order("received_date", { ascending: false }),
      ]);
    if (ordersError) throw new Error(ordersError.message);
    if (itemsError) throw new Error(itemsError.message);
    if (grnsError) throw new Error(grnsError.message);
    return {
      orders: ((orders ?? []) as DbPurchaseOrder[]).map((order) =>
        dbOrderToUi(order, (items ?? []) as DbPurchaseOrderItem[])
      ),
      grns: (grns ?? []).map((row) => dbGrnToUi(row as DbGoodsReceivedNoteRow)),
    };
  },

  async createOrder(input: PurchaseOrderInput, businessId: string): Promise<void> {
    const { error } = await supabase.rpc("create_purchase_order", {
      p_business_id: businessId,
      p_supplier_id: input.supplierId,
      p_status: input.status,
      p_expected_date: input.expectedDate || null,
      p_notes: input.notes,
      p_supplier_notes: input.supplierNotes ?? null,
      p_reference_number: input.referenceNumber ?? null,
      p_items: input.items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
    });
    if (error) throw new Error(error.message);
  },

  async updateOrder(id: string, businessId: string, patch: Partial<{
    status: POStatus;
    approvedBy: string | null;
    approvedDate: string | null;
    referenceNumber: string | null;
  }>): Promise<void> {
    const update: Record<string, string | null> = {};
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.approvedBy !== undefined) update.approved_by = patch.approvedBy;
    if (patch.approvedDate !== undefined) update.approved_date = patch.approvedDate;
    if (patch.referenceNumber !== undefined) update.reference_number = patch.referenceNumber;
    const { error } = await supabase.from("purchase_orders").update(update).eq("id", id).eq("business_id", businessId);
    if (error) throw new Error(error.message);
  },

  async receiveGoods(input: GoodsReceiptInput, businessId: string, createdBy?: string): Promise<void> {
    const { error } = await supabase.rpc("receive_purchase_goods", {
      p_business_id: businessId,
      p_purchase_order_id: input.orderId,
      p_received_by: input.receivedBy,
      p_reference_number: input.referenceNumber ?? null,
      p_notes: input.notes,
      p_items: input.items.map((item) => ({
        purchase_order_item_id: item.purchaseOrderItemId,
        received_qty: item.receivedQty,
      })),
    });
    if (error) throw new Error(error.message);
    void createdBy;
  },

  async getBills(businessId: string): Promise<PurchaseBill[]> {
    const { data, error } = await supabase
      .from("purchase_bills")
      .select("*")
      .eq("business_id", businessId)
      .order("bill_date", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbPurchaseBill[]).map(dbBillToUi);
  },

  async createBill(input: PurchaseBillInput, businessId: string): Promise<void> {
    const { error } = await supabase.rpc("create_purchase_bill", {
      p_business_id: businessId,
      p_purchase_order_id: input.purchaseOrderId ?? null,
      p_supplier_id: input.supplierId,
      p_po_number: input.poNumber,
      p_bill_date: input.billDate || null,
      p_due_date: input.dueDate || null,
      p_subtotal: input.subtotal,
      p_gst_amount: input.gstAmount,
      p_total: input.total,
      p_amount_paid: input.amountPaid,
    });
    if (error) throw new Error(error.message);
  },

  async recordPayment(billId: string, amount: number, businessId: string, createdBy?: string): Promise<void> {
    const { error } = await supabase.rpc("record_purchase_bill_payment", {
      p_business_id: businessId,
      p_purchase_bill_id: billId,
      p_amount: amount,
      p_created_by: createdBy ?? null,
    });
    if (error) throw new Error(error.message);
  },
};

export { dbGrnToUi };
