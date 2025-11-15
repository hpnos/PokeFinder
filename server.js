// Importa o framework 'express', que é usado para criar e gerenciar o servidor web.
import express from 'express';
// Importa o módulo 'path' do Node.js, que ajuda a lidar com caminhos de arquivos e diretórios.
import path from 'path';
// Importa a função 'fileURLToPath' para converter 'URLs de arquivo' (padrão de módulos ES) em caminhos de arquivo comuns.
import { fileURLToPath } from 'url';

// --- Configuração Inicial ---

// Cria uma instância (um aplicativo) do Express. 'app' será nosso servidor.
const app = express();
// Define a porta em que o servidor irá rodar.
// Ele tenta usar a variável de ambiente 'PORT' (comum em servidores de produção) ou usa a porta 3000 se ela não estiver definida.
const PORT = process.env.PORT || 3000;

// Obtém o caminho absoluto do arquivo atual (server.js) usando 'import.meta.url'.
const __filename = fileURLToPath(import.meta.url);
// Obtém o caminho absoluto do diretório onde o 'server.js' está localizado.
const __dirname = path.dirname(__filename);

// --- Funções de Lógica da API ---

// Define uma função auxiliar para "traduzir" a Região (vinda da API de Países) em um Habitat (da PokéAPI).
function mapearRegiaoParaHabitat(regiao) {
  // Verifica se a 'regiao' é nula ou indefinida (um Pokémon lendário, por exemplo) e retorna 'rare' como padrão.
  if (!regiao) return 'rare';
  // Converte a string da região para minúsculas para garantir que o 'switch' funcione corretamente.
  switch (regiao.toLowerCase()) {
    // Agrupa 'americas' para o habitat 'forest' (floresta).
    case 'americas':
      return 'forest';
    // Agrupa 'asia' para o habitat 'mountain' (montanha).
    case 'asia':
      return 'mountain';
    // Agrupa 'europe' para o habitat 'urban' (urbano).
    case 'europe':
      return 'urban';
    // Agrupa 'africa' para o habitat 'grassland' (campo/pradaria).
    case 'africa':
      return 'grassland';
    // Agrupa 'oceania' para o habitat 'waters-edge' (beira d'água).
    case 'oceania':
      return 'waters-edge';
    // Agrupa 'antarctic' para 'cave' (caverna), como uma aproximação para "gelo".
    case 'antarctic':
      return 'cave';
    // Define um caso padrão ('default') se a região não for nenhuma das anteriores.
    default:
      return 'rare';
  }
}

// --- Middlewares ---

// Configura o middleware 'express.static'.
// Isso diz ao Express para servir arquivos estáticos (como HTML, CSS, JS, imagens)
// diretamente da pasta 'pagina' (que está no mesmo diretório do 'server.js').
app.use(express.static(path.join(__dirname, 'pagina')));

// --- Rotas da API (Arquitetura REST) ---

// Define a rota principal da nossa API, que será acessada via método GET no caminho '/api/pokemon-por-pais'.
// A função é declarada como 'async' para que possamos usar 'await' dentro dela para esperar as chamadas 'fetch'.
app.get('/api/pokemon-por-pais', async (req, res) => {
  
  // Extrai o parâmetro de consulta 'pais' da URL da requisição (ex: ...?pais=Brasil).
  // 'req' (request) contém os dados da requisição do cliente.
  const { pais } = req.query;

  // Validação de entrada: Verifica se o parâmetro 'pais' não foi fornecido ou está vazio (apenas espaços).
  if (!pais || pais.trim() === '') {
    // Se for inválido, retorna um status 400 (Bad Request) e uma mensagem de erro em JSON.
    return res.status(400).json({ erro: "O nome do país é obrigatório." });
  }

  // Inicia um bloco 'try...catch' para lidar com possíveis erros das chamadas de API externas.
  try {
    
    // --- API 1: REST Countries (Descobrir a Região) ---
    // Constrói a URL para a API de Países. 'encodeURIComponent' formata o nome do país para ser seguro em uma URL (ex: "United States" vira "United%20States").
    const urlPais = `https://restcountries.com/v3.1/name/${encodeURIComponent(pais)}`;
    // Executa a chamada 'fetch' (busca) para a API de Países e 'await' (aguarda) a resposta.
    const responsePais = await fetch(urlPais);

    // Validação da Resposta 1: Verifica se a propriedade 'ok' da resposta é 'false' (ex: erro 404 - Não Encontrado).
    if (!responsePais.ok) {
      // Se a API de Países falhar, retorna o mesmo status de erro (ex: 404) e uma mensagem de erro JSON.
      return res.status(responsePais.status).json({ erro: `País '${pais}' não foi encontrado ou a requisição falhou.` });
    }
    
    // Converte o corpo da resposta da API de Países para JSON e aguarda o resultado.
    const dataPaisLista = await responsePais.json();
    // A API de Países retorna uma lista, então pegamos o primeiro item (índice 0).
    const dataPais = dataPaisLista[0];
    
    // --- Lógica 1: Mapear Região para Habitat ---
    // Extrai a propriedade 'region' (região) dos dados do país (ex: "Americas").
    const regiao = dataPais.region;
    // Usa nossa função auxiliar para "traduzir" a região (ex: "Americas") em um habitat (ex: "forest").
    const habitat = mapearRegiaoParaHabitat(regiao);
    
    // --- API 2 (Chamada 1): PokéAPI (Buscar Pokémon por Habitat) ---
    // Constrói a URL para a PokéAPI usando o 'habitat' que encontramos.
    const urlHabitat = `https://pokeapi.co/api/v2/pokemon-habitat/${habitat}`;

    // Executa a chamada 'fetch' para a API de habitats e aguarda a resposta.
    const responseHabitat = await fetch(urlHabitat);

    // Validação da Resposta 2: Verifica se a resposta da PokéAPI (habitat) foi bem-sucedida.
    if (!responseHabitat.ok) {
      // Se falhar, retorna um erro informando que o habitat não foi encontrado.
      return res.status(responseHabitat.status).json({ erro: `Não foi possível encontrar o habitat '${habitat}'.` });
    }

    // Converte o corpo da resposta da API de habitats para JSON.
    const dataHabitat = await responseHabitat.json();
    
    // --- Lógica 2: Sortear um Pokémon da lista ---
    // Extrai a lista de espécies de Pokémon ('pokemon_species') que vivem nesse habitat.
    const listaPokemon = dataHabitat.pokemon_species;
    // Validação: Verifica se a lista de Pokémon está vazia.
    if (!listaPokemon || listaPokemon.length === 0) {
      // Retorna um erro 404 se nenhum Pokémon for listado para esse habitat.
      return res.status(404).json({ erro: `Não há Pokémon listados para o habitat '${habitat}'.` });
    }
    // Sorteia um Pokémon aleatório da lista (usando Math.random).
    const pokemonSorteado = listaPokemon[Math.floor(Math.random() * listaPokemon.length)];
    // Pega o nome do Pokémon sorteado (ex: "shedinja").
    const nomePokemonSorteado = pokemonSorteado.name;
    
    // --- API 2 (Chamada 2): PokéAPI (Buscar detalhes/imagem do Pokémon) ---
    // Constrói a URL para a terceira chamada (segunda à PokéAPI) para obter os detalhes (e a imagem) do Pokémon sorteado.
    const urlPokemon = `https://pokeapi.co/api/v2/pokemon/${nomePokemonSorteado}`;
    // Executa a chamada 'fetch' para a API de Pokémon e aguarda a resposta.
    const responsePokemon = await fetch(urlPokemon);

    // Validação da Resposta 3: Verifica se a resposta da API de Pokémon foi bem-sucedida.
    if (!responsePokemon.ok) {
      // Retorna um erro se os dados do Pokémon específico não forem encontrados.
      return res.status(responsePokemon.status).json({ erro: `Não foi possível encontrar dados do Pokémon '${nomePokemonSorteado}'.` });
    }

    // Converte o corpo da resposta da API de Pokémon para JSON.
    const dataPokemon = await responsePokemon.json();

    // --- Resposta Final: Combinar tudo ---
    // Monta o objeto JSON final que será enviado de volta ao cliente (frontend).
    const respostaCombinada = {
      // Agrupa os dados do Pokémon.
      pokemon: {
        nome: dataPokemon.name, // Nome do Pokémon
        imagem: dataPokemon.sprites.front_default, // URL da imagem (sprite)
        habitat: habitat, // Habitat que usamos para encontrá-lo
      },
      // Agrupa os dados do País.
      pais: {
        nome: dataPais.name.common, // Nome comum do país
        bandeira: dataPais.flags.svg, // URL da imagem da bandeira (SVG)
        regiao: regiao, // Região do país
      }
    };

    // Envia a resposta JSON combinada de volta ao cliente (frontend).
    // 'res' (response) é usado para enviar dados de volta ao cliente.
    res.json(respostaCombinada);

  // O bloco 'catch' captura qualquer erro que tenha ocorrido no bloco 'try' (ex: falha de rede, erro de sintaxe).
  } catch (error) {
    // Imprime o erro detalhado no console do servidor (para o desenvolvedor).
    console.error("Erro fatal no servidor:", error);
    // Envia uma resposta de erro 500 (Erro Interno do Servidor) genérica para o cliente.
    res.status(500).json({ erro: "Falha interna do servidor." });
  }
});

// --- Inicialização do Servidor ---

// Inicia o servidor e o faz "escutar" por requisições na porta que definimos (PORT).
app.listen(PORT, () => {
  // Imprime uma mensagem no console do servidor informando que ele está pronto e em qual URL.
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});