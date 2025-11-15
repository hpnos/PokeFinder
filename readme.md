# PokéPaís Finder 🗺️
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Bem-vindo ao PokéPaís Finder! Esta é uma aplicação web divertida que combina o universo dos Países com o dos Pokémon.

A aplicação permite que o usuário digite o nome de um país (ex: "Brasil", "Japan") e, em troca, descobre um Pokémon que "combinaria" com o habitat daquela região. O resultado é exibido em uma interface de PokéDex clássica e estilizada.

![Demonstração do PokéPaís Finder](./pagina/images/demo.png)

## ✨ Funcionalidades

* **Consumo de API Dupla:** Utiliza a API [REST Countries](https://restcountries.com/) para identificar a região de um país (ex: "Brasil" -> "Americas").
* **Lógica de "Mashup":** Mapeia a região do país para um habitat da [PokéAPI](https://pokeapi.co/) (ex: "Americas" -> "forest").
* **Descoberta Aleatória:** Sorteia um Pokémon daquele habitat e busca seus dados (ex: "Shedinja").
* **Interface Temática:** Exibe o Pokémon, a bandeira do país e os dados em uma interface de PokéDex fiel ao design de referência.

## 🛠️ Arquitetura

Este projeto utiliza uma arquitetura Cliente-Servidor simples, ideal para "mashups" de API:

* **Backend (Servidor):** Um servidor `Node.js` com `Express` (`server.js`). Ele é responsável por:
    * Servir os arquivos estáticos (HTML/CSS/JS) da pasta `/pagina`.
    * Expor uma API REST interna (`GET /api/pokemon-por-pais`).
    * Lidar com toda a lógica de chamar as APIs públicas (REST Countries e PokéAPI).
    * Enviar um único objeto JSON combinado para o cliente.

* **Frontend (Cliente):** Uma página web ("Single Page Application") construída com HTML, CSS e JavaScript puro (`index.html`, `style.css`, `app.js`). Ela é responsável por:
    * Capturar a entrada do usuário.
    * Chamar a API do *nosso* backend (`fetch`).
    * Receber o JSON e usar o DOM para exibir os resultados.

## 🚀 Como Executar Localmente

### Pré-requisitos
* [Node.js](https://nodejs.org/) (versão 18 ou superior)
* `npm` (instalado com o Node.js)

### Passos
1.  Clone este repositório para sua máquina local:
    ```sh
    git clone [https://github.com/hpnos/PokeFinder.git](https://github.com/hpnos/PokeFinder.git)
    ```
2.  Navegue até a pasta do projeto:
    ```sh
    cd PokeFinder
    ```
3.  Instale as dependências do Node.js (apenas o `express`):
    ```sh
    npm install
    ```
4.  Inicie o servidor:
    ```sh
    npm start
    ```
5.  O console mostrará: `Servidor rodando em http://localhost:3000`
6.  Abra seu navegador e acesse [http://localhost:3000](http://localhost:3000).

---

## 📚 Documentação da API Interna

O servidor expõe uma única rota REST para o frontend.

### `GET /api/pokemon-por-pais`

Executa a lógica principal da aplicação.

* **Query Parameter:**
    * `pais` (obrigatório): O nome do país a ser pesquisado.
    * *Exemplo de Chamada:* `/api/pokemon-por-pais?pais=Brasil`

* **Resposta (Sucesso 200 OK):**
    ```json
    {
      "pokemon": {
        "nome": "shedinja",
        "imagem": "url-da-imagem.png",
        "habitat": "forest"
      },
      "pais": {
        "nome": "Brazil",
        "bandeira": "url-da-bandeira.svg",
        "regiao": "Americas"
      }
    }
    ```

* **Respostas (Erro):**
    ```json
    // Erro 400 (Parâmetro Faltando)
    { "erro": "O nome do país é obrigatório." }

    // Erro 404 (País Não Encontrado)
    { "erro": "País 'Brasil' não foi encontrado." }

    // Erro 500 (Falha Interna)
    { "erro": "Falha interna do servidor." }
    ```

### APIs Públicas Utilizadas
* **REST Countries:** `GET /v3.1/name/{pais}`
* **PokéAPI:** `GET /api/v2/pokemon-habitat/{habitat}` e `GET /api/v2/pokemon/{nome}`
