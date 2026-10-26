const path = require('path');
const express = require('express');
const grpc = require('@grpc/grpc-js');
const loader = require('@grpc/proto-loader');
const protobuf = require('protobufjs');

const protoPath = path.join(__dirname, '../proto/metrics.proto');
const def = loader.loadSync(protoPath, { keepCase: true, longs: Number, defaults: true });
const pkg = grpc.loadPackageDefinition(def).monitor;
// Um único client = um único canal = UMA conexão HTTP/2 para todas as chamadas
const client = new pkg.MonitorService('localhost:50051', grpc.credentials.createInsecure());

const root = new protobuf.Root();
root.loadSync(protoPath, { keepCase: true });
const Metric = root.lookupType('monitor.Metric');

const AGENTS = ['agente-1', 'agente-2', 'agente-3'];
const app = express();
app.use(express.static(path.join(__dirname, '../web')));

// 3 streams gRPC simultâneos (multiplexados) -> navegador via SSE
app.get('/events', (req, res) => {
  const interval = Math.min(5000, Math.max(200, Number(req.query.interval) || 1000));
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();

  const streams = AGENTS.map((id) => {
    const s = client.StreamMetrics({ agent_id: id, interval_ms: interval });
    s.on('data', (m) => {
      if (res.writableEnded) return;
      const pb = Metric.encode(Metric.create(m)).finish().length; // bytes em Protobuf
      const js = Buffer.byteLength(JSON.stringify(m));            // bytes em JSON
      res.write(`data: ${JSON.stringify({ m, pb, js })}\n\n`);
    });
    s.on('error', () => close());
    return s;
  });

  function close() {
    streams.forEach((s) => s.cancel());
    if (!res.writableEnded) res.end();
  }
  req.on('close', close);
});

// Chamada Unary (1 pedido -> 1 resposta) com medição de latência
app.get('/snapshot', (req, res) => {
  const t0 = process.hrtime.bigint();
  client.GetSnapshot({}, (err, m) => {
    if (err) return res.status(503).json({ error: err.message });
    res.json({ m, ms: Number(process.hrtime.bigint() - t0) / 1e6 });
  });
});

app.listen(3000, () => console.log('Front em http://localhost:3000'));