document.addEventListener('DOMContentLoaded', () => {
    
    const form = document.querySelector('.form');
    const input = document.querySelector('.input__search');
    const botao = document.querySelector('#gerar-btn');
    
    const screen = document.querySelector('.pokemon__display');
    
    const pokemonNameDisplay = document.querySelector('#pokemon-name-container');
    const countryDataDisplay = document.querySelector('#country-data-container');

    const initialCountryMessage = countryDataDisplay.innerHTML;

    function exibirResultados(data) {
        screen.innerHTML = '';
        pokemonNameDisplay.innerHTML = '';
        countryDataDisplay.innerHTML = '';

        const pokeImg = document.createElement('img');
        pokeImg.src = data.pokemon.imagem;
        pokeImg.alt = data.pokemon.nome;
        pokeImg.className = 'pokemon';
        screen.appendChild(pokeImg);

        const flagImg = document.createElement('img');
        flagImg.src = data.pais.bandeira;
        flagImg.alt = data.pais.nome;
        flagImg.className = 'flag';
        screen.appendChild(flagImg);

        pokemonNameDisplay.innerHTML = `<span class="pokemon__name">${data.pokemon.nome}</span>`;

        countryDataDisplay.innerHTML = `
            <p class="details">Habitat: ${data.pokemon.habitat}</p>
            <p class="name">${data.pais.nome}</p>
            <p class="details">Região: ${data.pais.regiao}</p>
        `;
    }

    function exibirErro(mensagem) {
        screen.innerHTML = '';
        pokemonNameDisplay.innerHTML = '';
        countryDataDisplay.innerHTML = `<p class="name">Erro!</p><p class="details">${mensagem}</p>`;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        const nomePais = input.value;
        if (!nomePais) return;

        screen.innerHTML = '';
        pokemonNameDisplay.innerHTML = '';
        countryDataDisplay.innerHTML = '<p class="name">Buscando...</p>';
        botao.disabled = true;
        botao.innerHTML = '...';

        try {
            const encodedPais = encodeURIComponent(nomePais);
            const response = await fetch(`/api/pokemon-por-pais?pais=${encodedPais}`);
            
            if (!response.ok) {
                const erroData = await response.json();
                throw new Error(erroData.erro || "O servidor retornou um erro.");
            }
            
            const data = await response.json();
            exibirResultados(data);

        } catch (error) {
            console.error("Houve um erro:", error.message);
            exibirErro(error.message);
        } finally {
            botao.disabled = false;
            botao.innerHTML = 'Buscar';
        }
    });

    input.addEventListener('focus', () => {
        screen.innerHTML = '';
        pokemonNameDisplay.innerHTML = '';
        countryDataDisplay.innerHTML = initialCountryMessage;
    });
});