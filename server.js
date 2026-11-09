const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;
const ATENAS_API_KEY = process.env.ATENAS_PAY_API_KEY;

app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/gerar-pix", async (req, res) => {
  try {
    const valor = parseFloat(req.body?.valor);
    if (!ATENAS_API_KEY) {
      return res.status(500).json({ success: false, error: "Chave da Atenas Pay não configurada." });
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      return res.status(400).json({ success: false, error: "Informe um valor válido." });
    }

    const response = await fetch("https://nexuspag.com/api/pix/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ATENAS_API_KEY,
      },
      body: JSON.stringify({
        amount: valor,
        description: "Doacao Capela Divina Esperanca",
        external_id: `capela-${Date.now()}`,
      }),
    });

    const data = await response.json().catch(() => ({}));
    const pixCode = data.transaction && data.transaction.pix_copia_cola;

    if (!response.ok || !pixCode) {
      return res.status(502).json({
        success: false,
        error: data.message || data.error || "Atenas Pay não retornou código PIX",
      });
    }

    return res.json({
      success: true,
      id: data.transaction.id,
      pix_copy_paste: pixCode,
      qrcode_base64: data.transaction.qr_code_base64 || null,
    });
  } catch {
    return res.status(500).json({ success: false, error: "Falha ao falar com a Atenas Pay." });
  }
});

app.get("/api/pix-status/:id", async (req, res) => {
  try {
    const response = await fetch("https://nexuspag.com/api/pix/" + encodeURIComponent(req.params.id), {
      headers: { "x-api-key": ATENAS_API_KEY },
    });
    const data = await response.json().catch(() => ({}));
    const status = String((data.transaction && data.transaction.status) || data.status || "").toLowerCase();
    const paid = ["paid", "confirmed", "approved", "completed", "pago", "received", "settled", "done", "success", "credited"].includes(status);
    return res.json({ success: true, status, paid });
  } catch {
    return res.json({ success: false, paid: false });
  }
});

app.listen(PORT);
