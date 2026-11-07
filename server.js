process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const ATENAS_API_KEY = process.env.ATENAS_PAY_API_KEY || 'atenaspay_live_6d19d42aead11728e90b8d993973fcbe62770ac44e5258a35b66a1638412001b';

app.post('/api/gerar-pix', (req, res) => {
    try {
        const { valor } = req.body;
        const valorNumerico = parseFloat(valor) || 10;

        const postData = JSON.stringify({
            amount: valorNumerico,
            description: "Doacao Capela Divina Esperanca",
            customer: {
                name: "Doador Capela",
                email: "doador@capela.org",
                cpf: "00000000000"
            }
        });

        const options = {
            hostname: 'api.atenaspay.com',
            port: 443,
            path: '/v1/pix/cashin',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'api-key': ATENAS_API_KEY,
                'Content-Length': Buffer.byteLength(postData)
            },
            rejectUnauthorized: false
        };

        const request = https.request(options, (response) => {
            let data = '';

            response.on('data', (chunk) => { data += chunk; });

            response.on('end', () => {
                console.log('=== RESPOSTA DA ATENAS PAY ===', data);

                try {
                    const parsedData = JSON.parse(data);

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
                        error: parsedData.message || parsedData.error || "Erro retornado pela API da Atenas Pay",
                        pix_copy_paste: null
                    });

                } catch (e) {
                    res.status(200).json({ success: false, error: "A API da Atenas Pay devolveu página HTML/Cloudflare em vez de JSON." });
                }
            });
        });

        request.on('error', (error) => {
            console.error('Erro HTTPS:', error);
            res.status(200).json({ success: false, error: 'Erro de comunicação: ' + error.message });
        });

        request.write(postData);
        request.end();

    } catch (error) {
        console.error('Erro interno:', error);
        res.status(200).json({ success: false, error: 'Erro interno: ' + error.message });
    }
});

app.post('/api/webhook/atenas', (req, res) => {
    console.log('=== WEBHOOK RECEBIDO ===', req.body);
    res.status(200).send('OK');
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
