const path = require('path');
const grpc = require('@grpc/grpc-js');
const loader = require('@grpc/proto-loader');

const def = loader.loadSync(path.join(__dirname, '../proto/metrics.proto'), {
  keepCase: true, longs: Number, defaults: true,
});
const pkg = grpc.loadPackageDefinition(def).monitor;
const client = new pkg.MonitorService('localhost:50051', grpc.credentials.createInsecure());

client.GetSnapshot({}, (err, m) => console.log('UNARY:', m));

const stream = client.StreamMetrics({ agent_id: 'agent-1', interval_ms: 1000 });
stream.on('data', (m) => console.log('STREAM:', m));
stream.on('error', (e) => console.log('Stream encerrado:', e.message));