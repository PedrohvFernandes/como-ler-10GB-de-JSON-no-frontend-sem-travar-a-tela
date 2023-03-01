# Como ler 10GB de JSON no frontend sem travar a tela usando as web streams/paradigmas de streams

## Do que o projeto aborda:

O projeto aborda como ler 10GB de JSON sob demanda no frontend sem travar a tela usando as web streams. Funciona tanto em navegadores quanto em Node.js ou em qualquer lugar que execute JS sem usar bibliotecas adicionais.

## Como o projeto funciona:

O back-end vai utilizar web streams para ler o arquivo CSV, converter cada linha individual para JSON, então responder de forma gradual aos pedido HTTP pro front-end. O front-end vai usar web streams para ler/consumir o JSON/dados sob demanda de forma gradual, respeitando os paradigmas das streams, e consumindo e renderizando cada linha individualmente. Ou seja iremos converter node.js streams em web streams. Alem disso, o front-end vai poder cancelar operações de forma inteligente usando as apis nativas, somente com as web api. 

A streams deixa o dado/linha de tal arquivo/database na memoria e depois retira apos terminar de ler e tratar aquela linha do momento, assim nao travando a tela, fazendo tudo sob demanda.

## Como rodar o projeto:

- Back-end: `npm run dev`
- Front-end: `npm run dev`

## Tecnologias principais usadas no back-end:

- Back-end: Libs nativas do Node.js
  - createServer
  - createReadStream
  - Readable
  - WritableStream
  - Csvtojson

- Front-end: Libs nativas do JS


- Front-end:
 - http-server (para rodar o front-end localmente)

## Referencia:

- [Erick Wendel](https://www.youtube.com/watch?v=-IpRYbL4yMk)
- [Database](https://www.kaggle.com/datasets/danielalbarracinm/list-of-anime-from-1990-to-2022?resource=download)
- [Streaming requests with the fetch API](https://developer.chrome.com/articles/fetch-streaming-requests/)
- [Fetch API, Streams API, NDJSON, and ASP.NET Core MVC](https://www.tpeczek.com/2019/10/fetch-api-streams-api-ndjson-and-aspnet.html)
- [Using writable streams](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams)
- [É capaz de usar o abort controller no react, melhorando a requisição](https://www.youtube.com/watch?v=xYC95EXsh8M)