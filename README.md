# gRPC Monitor

Sistema de monitoramento em tempo real que demonstra comunicação entre microsserviços com **gRPC** (Unary e Server Streaming) em Node.js.

Três agentes transmitem métricas de CPU e RAM por gRPC, sobre HTTP/2 e com Protocol Buffers. Um gateway consome os streams e entrega ao navegador, que exibe gráficos, alertas e a comparação de tamanho entre Protobuf e JSON.

> Os valores de CPU e RAM são **simulados**, mas toda a comunicação entre os serviços é gRPC real.

## Arquitetura

```
Agentes (servidor gRPC :50051) --gRPC / HTTP2 / Protobuf--> Gateway (cliente gRPC) --SSE--> Navegador
```

O navegador não fala gRPC nativamente, então o gateway atua como cliente gRPC e repassa os dados por Server-Sent Events.

## Funcionalidades

- 3 streams gRPC simultâneos multiplexados em uma única conexão HTTP/2
- Gráficos de CPU e RAM em tempo real por agente
- Comparação de CPU e RAM entre agentes
- Alerta quando a CPU passa de 85%
- Comparação acumulada de bytes: Protobuf vs JSON
- Chamada Unary (`GetSnapshot`) com medição de latência
- Controle de intervalo do stream e botão de pausar

## Requisitos

- [Node.js](https://nodejs.org) (versão LTS)

## Como rodar

```bash
git clone https://github.com/PaoBatatus/grpc-monitor.git
cd grpc-monitor
npm install
```

Abra dois terminais na pasta do projeto:

```bash
# Terminal 1 (servidor gRPC, inicie primeiro)
node server/server.js

# Terminal 2 (gateway e painel)
node server/gateway.js
```

Acesse **http://localhost:3000**.

Para testar apenas o gRPC, sem o painel, rode `node server/client.js` no lugar do gateway.

## Estrutura

```
grpc-monitor/
├── proto/
│   └── metrics.proto      # Contrato gRPC (serviço e mensagens)
├── server/
│   ├── server.js          # Servidor gRPC (agentes)
│   ├── gateway.js         # Cliente gRPC e ponte SSE para o navegador
│   └── client.js          # Cliente de terminal para teste
├── web/
│   └── index.html         # Painel (Chart.js)
└── package.json
```

## Tecnologias

gRPC, Protocol Buffers, HTTP/2, Node.js, Express, Chart.js

## Autor

Pedro Luca de Lacerda Alves  
UTFPR, Tecnologia em Desenvolvimento de Sistemas
