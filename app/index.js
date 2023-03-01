const API_URL = 'http://localhost:3333'
let count = 0

async function consumeAPI(signal) {
  const response = await fetch(API_URL, {
    signal
  })

  // Para consumir os dados de uma stream usamos o getReader(). No node estavamos fazendo a partir de uma stream do node, convertemos ela para web stream e mandamos para casa. Aqui basicamente estou consumindo ela como uma api do browser do JS. So com isso a gente ja pegaria os dados da api
  // const reader = response.body
  // .getReader()

  // Mas com boa praticas, usando o paradigma das streams
  const reader = response.body
    // Aqui eu estou convertendo o dado para string. O dado que vem da api é um binario, então eu converto para string JSON
    /*
      O TextDecoderStream é uma classe do JavaScript que faz parte da API de Streams, introduzida no ECMAScript 2018. Ela é usada para decodificar sequências de bytes em strings, permitindo que você leia dados de uma fonte em formato de byte e converta em texto.

      O TextDecoderStream pode ser utilizado para decodificar dados binários de várias codificações, como UTF-8, UTF-16 e ISO-8859-1. Ele recebe como entrada um fluxo de dados de entrada (por exemplo, um objeto ReadableStream ou um Blob), e retorna um novo fluxo de saída contendo as strings decodificadas.

      Ao usar o TextDecoderStream, você pode ler dados de uma fonte em formato binário e convertê-los em texto conforme eles chegam, em vez de ter que esperar que todos os dados sejam carregados antes de decodificar o texto. Isso permite que você processe arquivos grandes e economize memória, além de permitir que você manipule dados em tempo real, como em uma aplicação de chat.

      Em resumo, o TextDecoderStream é uma ferramenta útil para ler e decodificar dados binários em tempo real, tornando mais fácil para os desenvolvedores lidar com dados em formato de byte e convertê-los em texto.
    */
    .pipeThrough(new TextDecoderStream())
    // Convertemos de JSON string para JSON
    .pipeThrough(parseNDJOSN())
  // Iremos fazer o passo final no final, onde vamos colocar no HTML
  // .pipeTo(
  //   new WritableStream({
  //     write(chunk) {
  //       console.log(++count, 'chunk', chunk)
  //     }
  //   })
  // )

  return reader
}

// Colocar no HTML
function appendToHtml(element) {
  // Aqui eu estou criando um writable stream, que vai receber os dados que foram processados e vai colocar no HTML
  return new WritableStream({
    write({ title, description, url_anime }) {
      const card = `
      <article>
        <div class="text">
          <h3>[${++count}] ${title}</h3>
          <p>Descrição do anime: ${description.slice(0, 100)}...</p>
          <a href="${url_anime}">Link do anime ${title}</a>
        </div>
      </article> 
      `
      element.innerHTML += card
    },
    abort(reason) {
      element.innerHTML += '<p>Processo abortado</p>', reason
    }
  })
}

// Essa função vai se certificar que caso dois chunks cheguem em uma unica transmissão, ele vai separar cada um deles, convertendo corretamente para JSON. Ex:
// Dado/chunk1: '{"name":"Erick"}\n{"name":"Wendel"} se ele chegar dessa forma, ele vai separar em dois objetos json, assim:
// chunk1: '{"name":"Erick"}'
// chunk2: '{"name":"Wendel"}'
function parseNDJOSN() {
  let ndjsonBuffer = ''
  return new TransformStream({
    transform(chunk, controller) {
      // Cada chunk, ou seja cada dado/linha que chega, é um JSON string e ai vamos agrupando nessa variavel ndjsonBuffer
      ndjsonBuffer += chunk
      // Separamos cada linha
      const items = ndjsonBuffer.split('\n')
      // Convertemos cada linha para JSON, e não JSON string, que é o que o server nos retorna
      items.slice(0, -1).forEach(item => controller.enqueue(JSON.parse(item)))

      // Aqui eu pego os que não foram convertidos para JSON, e os deixo na variavel ndjsonBuffer, para que no proximo chunk, ele possa ser convertido
      ndjsonBuffer = items[items.length - 1]
    },
    // O flush é para verificar antes de encerrar o processamento se aqui ainda tenha algo para processar ainda/que ficou parado, nos processamos no final
    flush(controller) {
      // Se não tiver nada, não faz nada
      if (!ndjsonBuffer) return
      // Se tiver algo, converte para JSON e envia para o controller
      controller.enqueue(JSON.parse(ndjsonBuffer))
    }
  })
}

const [start, stop, cards] = ['start', 'stop', 'cards'].map(id =>
  document.getElementById(id)
)

let abortController = new AbortController()
// Quando clicar no botão start, ele vai consumir a api
start.addEventListener('click', async () => {
  const readable = await consumeAPI(abortController.signal)
  // Passo final, onde eu pego o que foi processado na consumeAPI e coloco no HTML
  readable.pipeTo(appendToHtml(cards))
})

stop.addEventListener('click', () => {
  // Cancela todas as outras operações
  // Da para usar no react para cancelar uma requisição https://www.youtube.com/watch?v=xYC95EXsh8M
  abortController.abort()
  console.log('abortando o processo')
  // Cria um novo abortController
  abortController = new AbortController()
})

// Cancela todas as outras operações
// abortController.abort()
