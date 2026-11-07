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

        if (!valor || isNaN(valor) || valor <= 0) {
            return res.status(400).json({ error: 'Informe um valor válido.' });
        }

        const postData = JSON.stringify({
            amount: parseFloat(valor),
            description: "Doacao Capela Divina Esperanca"
        });

        const options = {
            hostname: 'api.atenaspay.com',
            port: 443,
            path: '/v1/pix/cashin',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': ATENAS_API_KEY,
                'Content-Length': Buffer.byteLength(postData)
            },
            rejectUnauthorized: false
        };

        const request = https.request(options, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                console.log('=== RESPOSTA DA ATENAS PAY ===', data);

                try {
                    const parsedData = JSON.parse(data);

                    if (response.statusCode >= 400) {
                        return res.status(response.statusCode).json({
                            error: parsedData.message || parsedData.error || 'Erro na Atenas Pay',
                            detalhes: parsedData
                        });
                    }

                    // Mapeia qualquer variação de nome de chave da Atenas Pay para 'pix_copy_paste'
                    const chavePix = parsedData.pix_copy_paste || 
                                     parsedData.pixCopiaECola || 
                                     parsedData.qrcode || 
                                     parsedData.qr_code ||
                                     parsedData.data?.pix_copy_paste ||
                                     parsedData.data?.qrcode;

                    res.json({
                        success: true,
                        pix_copy_paste: chavePix,
                        raw: parsedData
                    });

                } catch (e) {
                    res.status(500).json({ error: 'Erro ao interpretar resposta da API', raw: data });
                }
            });
        });

        request.on('error', (error) => {
            console.error('Erro na requisição HTTPS:', error);
            res.status(500).json({ error: 'Falha na comunicação com a Atenas Pay', detalhe: error.message });
        });

        request.write(postData);
        request.end();

    } catch (error) {
        console.error('Erro interno no servidor:', error);
        res.status(500).json({ error: 'Falha interna no servidor', detalhe: error.message });
    }
});

app.post('/api/webhook/atenas', (req, res) => {
    console.log('=== WEBHOOK RECEBIDO ===', req.body);
    res.status(200).send('OK');
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
