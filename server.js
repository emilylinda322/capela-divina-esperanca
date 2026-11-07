process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const cors = require('cors');
const cloudscraper = require('cloudscraper');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const ATENAS_API_KEY = process.env.ATENAS_PAY_API_KEY || 'atenaspay_live_6d19d42aead11728e90b8d993973fcbe62770ac44e5258a35b66a1638412001b';

app.post('/api/gerar-pix', async (req, res) => {
    try {
        const { valor } = req.body;
        const valorNumerico = parseFloat(valor) || 10;

        const options = {
            uri: 'https://api.atenaspay.com/v1/pix/cashin',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': ATENAS_API_KEY
            },
            body: {
                amount: valorNumerico,
                description: "Doacao Capela Divina Esperanca",
                customer: {
                    name: "Doador Capela",
                    email: "doador@capela.org",
                    cpf: "00000000000"
                }
            },
            json: true
        };

        const parsedData = await cloudscraper(options);
        console.log('=== RESPOSTA DA ATENAS PAY VIA CLOUDSCRAPER ===', parsedData);

        const pixCode = parsedData.pix_copy_paste || 
                        parsedData.pixCopiaECola || 
                        parsedData.qrcode || 
                        parsedData.qr_code ||
                        parsedData.data?.pix_copy_paste ||
                        parsedData.data?.qrcode ||
                        parsedData.point_of_interaction?.transaction_data?.qr_code;

        if (pixCode) {
            return res.status(200).json({
                success: true,
                pix_copy_paste: pixCode,
                raw: parsedData
            });
        }

        return res.status(200).json({
            success: false,
            error: parsedData.message || parsedData.error || "Atenas Pay não retornou código PIX",
            pix_copy_paste: null
        });

    } catch (error) {
        console.error('Erro no Cloudscraper:', error);
        res.status(200).json({ 
            success: false, 
            error: 'Erro de bypass Cloudflare: ' + (error.message || JSON.stringify(error)) 
        });
    }
});

app.post('/api/webhook/atenas', (req, res) => {
    console.log('=== WEBHOOK RECEBIDO ===', req.body);
    res.status(200).send('OK');
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
