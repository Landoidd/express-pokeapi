export type Gym = {
  _id: string;
  gymName: string;
  gymLeader: string;
  gymBadge: string;
  gymMembers: Trainer[];
};

export type Trainer = {
  _id: string;
  name: string;
  email: string;
  badges: string[];
  pokemon: PokemonTeamMember[];
  password: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PokemonTeamMember = {
  pokemonId: number;
  name: string;
  types: string[];
  dateAdded: Date;
  nickname: string;
  level: number;
};

export type Badge = {
  name: string;
  gymName: string;
  dateEarned: Date;
  gymLeader: string;
};