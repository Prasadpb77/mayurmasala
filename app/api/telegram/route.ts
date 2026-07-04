import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TG_API = `https://api.telegram.org/bot${TOKEN}`;

async function sendMessage(chatId: number, text: string) {
  await fetch(`${TG_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

// Parses:  /sale 1500 Category name here rest is description
function parseCommand(text: string) {
  const match = text.match(/^\/(sale|purchase|expense)\s+([\d.]+)\s*(.*)$/i);
  if (!match) return null;
  const [, type, amountStr, rest] = match;
  const [category, ...descParts] = rest.split(" - ");
  return {
    type: type.toLowerCase(),
    amount: parseFloat(amountStr),
    category: category?.trim() || null,
    description: descParts.join(" - ").trim() || rest.trim() || null,
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = body.message;
  if (!message?.text) return NextResponse.json({ ok: true });

  const chatId = message.chat.id;
  const telegramId = message.from.id;
  const text = message.text.trim();
  const supabase = createServiceClient();

  // Whitelist check
  const { data: allowed } = await supabase
    .from("allowed_telegram_users")
    .select("telegram_id, name")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (!allowed) {
    await sendMessage(chatId, `Sorry, you're not authorized. Ask the admin to whitelist your Telegram ID: \`${telegramId}\``);
    return NextResponse.json({ ok: true });
  }

  if (text === "/summary") {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const { data } = await supabase.from("transactions").select("type, amount").gte("txn_date", monthStart);
    const totals: Record<string, number> = { sale: 0, purchase: 0, expense: 0 };
    (data || []).forEach((r: any) => (totals[r.type] += Number(r.amount)));
    await sendMessage(
      chatId,
      `*This month*\nSales: ₹${totals.sale.toFixed(0)}\nPurchases: ₹${totals.purchase.toFixed(0)}\nExpenses: ₹${totals.expense.toFixed(0)}`
    );
    return NextResponse.json({ ok: true });
  }

  if (text === "/start" || text === "/help") {
    await sendMessage(
      chatId,
      "Commands:\n/sale <amount> <category> - <description>\n/purchase <amount> <category> - <description>\n/expense <amount> <category> - <description>\n/summary — this month's totals"
    );
    return NextResponse.json({ ok: true });
  }

  const parsed = parseCommand(text);
  if (!parsed) {
    await sendMessage(chatId, "Didn't understand. Try:\n`/sale 1500 Garam Masala - 1kg x3`");
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("transactions").insert({
    type: parsed.type,
    amount: parsed.amount,
    category: parsed.category,
    description: parsed.description,
    txn_date: new Date().toISOString().slice(0, 10),
    source: "telegram",
    created_by: String(telegramId),
  });

  if (error) {
    await sendMessage(chatId, `Failed to save: ${error.message}`);
  } else {
    await sendMessage(chatId, `✅ Logged ${parsed.type}: ₹${parsed.amount} ${parsed.category ? `(${parsed.category})` : ""}`);
  }

  return NextResponse.json({ ok: true });
}
