import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
// Usado para manipular dados, como fonte dados. Ele cria uma readable stream, a partir da stream do node createReadStream
import { Transform, Readable } from 'node:stream'
// writable é usado para escrever dados, como destino de dados, para a web streams temos que usar o writableStream
import { TransformStream, WritableStream } from 'node:stream/web'
import csvtojson from 'csvtojson'
// O setTimeout ele é um async, uma promise, diferente do normal que é um callback.
import { setTimeout } from 'node:timers/promises'

const PORT = 3333
// O req e res são node.js streams trabalhando com sockets
// curl -N localhost:3333 Ou curl -i -X OPTIONS -N localhost:3333
createServer(async (req, res) => {
  // Cors
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
  }
  // Verifica se a minha api esta livre para ser acessada
  // O OPTIONS é um metodo do HTTP ou primeira req que ele faz, que é usado para verificar se a api esta livre para ser acessada
  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers)
    res.end()
    return
  }

  // A medida que eu ler o arquivo voce ja retorna pro response de acordo com as node streams, mas como as web streams tem uma outra forma de trabalhar então temos que tratar
  // createReadStream('./animeflv.csv').pipe(res)

  // Criando uma readable stream. Pegamos as strems do node crateReadStream e depois convertos para as streams da web, depois tiramos o pipe, porque ele é somente do node e não da web

  // So pra contar quantos itens foram processados
  let items = 0

  // Caso o front-end não queira receber mais os dados, ele pode fechar a conexão. Então vamos usar o close para saber quando fechar a conexão e quando fechar ele vai mostrar quantos itens foram processados
  req.once('close', () => console.log('connection was closed!', items))

  // Fonte de dados. Se nos estivermos lendo(createReadStream) e escrevendo os dados rapidos de mais e o cliente não aguentar, ele fala pro node não mandar nada mais e esperar ele ler tudo que esta na fila e com isso, vai ser pausado, esperar terminar a fila de mandar os dados, acumulando o restante dos dados na memoria, pra depois mandar tudo junto, apos o browser falar que esta disponivel novamente e por conta disso é importante ter a quebra de linha antes de enviar, dessa maneira tudo o que ficar para traz/na memoria que não conseguiu ser enviado por agora, vai tendo uma quebra de linha, separando cada JSON, para não ter uma quebra de dados na validação dos dados.
  Readable.toWeb(createReadStream('./animeflv.csv'))
    // Antes de mandar para web, vamos converter o csv para json, injetando o csvtojson junto com o trasnform que muda o tipo. Dessa forma cada stream da web(node stream para readble to web) vai ser um json
    // Diferenças entre pipeTo e pipeThrough é que o pipeTo é usado para escrever dados, usado na ultima etapa, e o pipeThrough é usado para transformar dados
    // O pipeThrough é o passo a passo que cada item individual vai trafegar, passando por cada etapa, transformando/manipulando o dado, e o pipeTo é o destino final dos dados
    .pipeThrough(Transform.toWeb(csvtojson()))
    // Alem de consumir como JSON, vamos mapear como JSON
    .pipeThrough(
      new TransformStream({
        // O controller vai ser usado para mandar info para o proximo passo
        transform(chunk, controller) {
          // Cada chunk é uma linha do arquivo csv
          // Para ver o que tem dentro de cada chunk. So que o chunk retorna array de binarios, então para ver o que tem dentro eu converto para string usando o Buffer.from
          // console.log('chunk', Buffer.from(chunk).toString())

          // Aqui eu converto o chunk para JSON. A mas o csvtojson já faz isso? na verdade ele tranforma o dado em uma string de json, então eu preciso converter para json para poder manipular/mapear. E apos mapear eu converto para JSON string novamente
          const data = JSON.parse(Buffer.from(chunk))
          // Aqui eu mando/escrevo o chunk/dado para o proximo passo. Poderia mandar tudo que vem do csv, passando o chunk direto, mas se eu quiser mapear, colocar somente o que eu quero, eu posso fazer isso aqui. Mas como que você sabe o que tem dentro do chunk? Eu posso ver no console.log acima ou no arquivo csv. De acordo com itens do header do csv eu vou mapear. Porque o csvtoJson basicamente pega a primeira linha do csv que é um header e o transforma as colunas em chaves e pra cada chave/coluna um valor e pra cada linha do csv um objeto json, sendo que a primeira se tranforma em chaves que era as colunas no header e as demais são os valores de cada chave.
          const mapperData = {
            title: data.title,
            description: data.description,
            url_anime: data.url_anime
          }
          // Temos o \n no final porque é um NDJSON. Uma string json que usa o \n para separar cada objeto json. Com isso ele volta a ser um binario
          controller.enqueue(JSON.stringify(mapperData).concat('\n'))
        }
      })
    )
    // Destino de dados. A ultima etapa é o pipeTo.
    .pipeTo(
      // Saida dos dados
      new WritableStream({
        // No write eu recebo um pedaço do dado, que eu vou escrever no response. Um chunk. Cada pedaço/fragmento que eu conseguir ler do createReadStream vai fazendo o pipe pro write e depois eu posso redirecionar para o cliente
        async write(chunk) {
          // Eu vou mandando os dados sob demanda de 1 em 1 segundo, esperando sempre o write terminar para mandar o proximo. Diferente de uma API rest que acumula tudo dentro de uma memoria e mandar tudo de uma vez pro HTML, no nosso caso estamos recebendo os dados sob demanda
          await setTimeout(1000)
          items++
          // Escrevemos os dados no response, ate terminar de ler o arquivo
          res.write(chunk)
        },
        // Depois que colhemos toda info do nosso arquivo
        // Usamos o close para fechar a conexão
        close() {
          // console.log(`Total de itens: ${items}`)
          res.end()
        }
      })
    )

  // Aqui é pros demais metodos(Verbos) http
  res.writeHead(200, headers)
})
  .listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`)
  })
  .on('listening', () => {
    console.log('Listening...')
  })
  .on('error', err => {
    console.error(err)
  })
