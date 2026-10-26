const path = require('path');
const grpc = require('@grpc/grpc-js');
const loader = require('@grpc/proto-loader');

const def = loader.loadSync(path.join(__dirname, '../proto/metrics.proto'), {
  keepCase: true, longs: Number, defaults: true,
});
const pkg = grpc.loadPackageDefinition(def).monitor;

// Cada agente tem um "estado" e varia aos poucos (parece uma máquina de verdade)
const state = {};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const gen = (agent_id) => {
  const s = (state[agent_id] = state[agent_id] || {
    cpu: 20 + Math.random() * 50,
    ram: 45 + Math.random() * 20,
  });
  s.cpu = clamp(s.cpu + (Math.random() - 0.5) * 18, 3, 99);
  s.ram = clamp(s.ram + (Math.random() - 0.5) * 4, 30, 92);
  return {
    agent_id,
    cpu_percent: +s.cpu.toFixed(1),
    ram_percent: +s.ram.toFixed(1),
    timestamp: Date.now(),
  };
};

const server = new grpc.Server();
server.addService(pkg.MonitorService.service, {
  // Unary: 1 pedido -> 1 resposta
  GetSnapshot: (call, cb) => cb(null, gen('agente-1')),

  // Server Streaming: 1 pedido -> N respostas pela mesma conexão
  StreamMetrics: (call) => {
    const id = call.request.agent_id || 'agente-1';
    const interval = call.request.interval_ms || 1000;
    console.log(`Cliente conectado: ${id} (a cada ${interval}ms)`);
    const timer = setInterval(() => call.write(gen(id)), interval);
    const stop = () => clearInterval(timer);
    call.on('cancelled', stop);
    call.on('close', stop);
  },
});

server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
  console.log('Servidor gRPC rodando na porta 50051');
});