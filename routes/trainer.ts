import express from "express";
import { Trainer } from "../models/Trainer.js";
import {
  authenticateToken,
  AuthenticatedRequest,
} from "../utils/middleware.js";
import { addPokemonSchema, updatePokemonSchema } from "../utils/validation.js";
import { pokeAPI } from "../utils/pokeapi.js";
import { PokemonTeamMember } from "../utils/types.js";

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const trainer = await Trainer.findById(req.trainer._id).select(
        "-password"
      );
      if (!trainer) {
        return res.status(404).json({ message: "Trainer not found" });
      }
      res.json({ trainer });
    } catch (error) {
      console.error("Error fetching trainer profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post(
  "/pokemon/add",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name } = addPokemonSchema.parse(
        req.body
      );

      const trainer = await Trainer.findById(req.trainer._id);
      if (!trainer) {
        return res.status(404).json({ message: "Trainer not found" });
      }

      if (trainer.pokemon.length >= 6) {
        return res
          .status(400)
          .json({ message: "Cannot have more than 6 Pokemon in your team" });
      }

      const pokemonData = await pokeAPI.getPokemon(
        name.toLowerCase()
      );

      const existingPokemon = trainer.pokemon.find(
        (p) => p.pokemonId === pokemonData.id
      );
      if (existingPokemon) {
        return res
          .status(400)
          .json({ message: "This Pokemon is already in your team" });
      }

      const newPokemon = {
        pokemonId: pokemonData.id,
        name: pokemonData.name,
        types: pokemonData.types.map((t) => t.type.name),
        dateAdded: new Date(),
        level: 1,
        nickname: "",
      };

      trainer.pokemon.push(newPokemon as PokemonTeamMember);
      await trainer.save();

      res.status(201).json({
        message: "Pokemon added to team successfully",
        team: trainer.pokemon,
      });
    } catch (error) {
      console.error("Error adding Pokemon:", error);
      if (
        error instanceof Error &&
        error.message.includes("Failed to fetch Pokemon data")
      ) { 
        res.status(400).json({ message: "Pokemon not found in PokeAPI" });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
);

router.put(
  "/pokemon/update/:pokemonId",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { pokemonId } = req.params;
      const { nickname, level } = updatePokemonSchema.parse(req.body);

      const trainer = await Trainer.findById(req.trainer._id);
      if (!trainer) {
        return res.status(404).json({ message: "Trainer not found" });
      }

      const pokemonIndex = trainer.pokemon.findIndex(
        (p) => p.pokemonId.toString() === pokemonId
      );
      if (pokemonIndex === -1) {
        return res
          .status(404)
          .json({ message: "Pokemon not found in your team" });
      }



      if (nickname !== undefined) {
        trainer.pokemon[pokemonIndex].nickname = nickname;
      }
      if (level !== undefined) {
        trainer.pokemon[pokemonIndex].level = level;
      }

      await trainer.save();

      res.json({
        message: "Pokemon updated successfully",
        pokemon: trainer.pokemon[pokemonIndex],
      });
    } catch (error) {
      console.error("Error updating Pokemon:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.delete(
  "/pokemon/remove/:pokemonId",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { pokemonId } = req.params;

      const trainer = await Trainer.findById(req.trainer._id);
      if (!trainer) {
        return res.status(404).json({ message: "Trainer not found" });
      }

      const pokemonIndex = trainer.pokemon.findIndex(
        (p) => p.pokemonId.toString() === pokemonId
      );
      if (pokemonIndex === -1) {
        return res
          .status(404)
          .json({ message: "Pokemon not found in your team" });
      }

      trainer.pokemon[pokemonIndex];
      trainer.pokemon.splice(pokemonIndex, 1);
      await trainer.save();

      res.json({
        message: "Pokemon removed from team successfully",
        team: trainer.pokemon,
      });
    } catch (error) {
      console.error("Error removing Pokemon:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
