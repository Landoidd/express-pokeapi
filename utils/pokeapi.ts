import axios from "axios";

const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";

export interface Pokemon {
  id: number;
  name: string;
  types: Array<{
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }>;
}


export class PokeAPIService {
  private static instance: PokeAPIService;
  private cache: Map<string, any> = new Map();

  public static getInstance(): PokeAPIService {
    if (!PokeAPIService.instance) {
      PokeAPIService.instance = new PokeAPIService();
    }
    return PokeAPIService.instance;
  }

  private async fetchWithCache<T>(url: string): Promise<T> {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    try {
      const response = await axios.get<T>(url, {
        timeout: 5000,
        headers: {
          "User-Agent": "Hillpointe-Pokemon-App/1.0.0",
        },
      });

      this.cache.set(url, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching from PokeAPI: ${url}`, error);
      throw new Error(`Failed to fetch Pokemon data: ${error}`);
    }
  }

  async getPokemon(identifier: string | number): Promise<Pokemon> {
    const url = `${POKEAPI_BASE_URL}/pokemon/${identifier
      .toString()
      .toLowerCase()}`;
    return this.fetchWithCache<Pokemon>(url);
  }
}

export const pokeAPI = PokeAPIService.getInstance();
