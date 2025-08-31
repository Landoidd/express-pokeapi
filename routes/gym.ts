import express from "express";
import { Gym } from "../models/Gym.js";
import { Trainer } from "../models/Trainer.js";
import {
  authenticateToken,
  AuthenticatedRequest,
} from "../utils/middleware.js";
import { createGymSchema, assignBadgeSchema } from "../utils/validation.js";
import { Badge } from "../utils/types.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = {};
    if (search) {
      query = {
        $or: [
          { gymName: { $regex: search, $options: "i" } },
          { gymLeader: { $regex: search, $options: "i" } },
          { gymBadge: { $regex: search, $options: "i" } },
        ],
      };
    }

    const gyms = await Gym.find(query)
      .populate("gymMembers", "name badges pokemon")
      .skip(skip)
      .limit(Number(limit))
      .sort({ gymName: 1 });

    const total = await Gym.countDocuments(query);

    res.json({
      gyms,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching gyms:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const gym = await Gym.findById(req.params.id).populate(
      "gymMembers",
      "name email badges pokemon"
    );

    if (!gym) {
      return res.status(404).json({ message: "Gym not found" });
    }

    res.json({ gym });
  } catch (error) {
    console.error("Error fetching gym:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { gymName, gymLeader, gymBadge } = createGymSchema.parse(req.body);

    const existingGym = await Gym.findOne({ gymName });
    if (existingGym) {
      return res.status(400).json({ message: "Gym name already exists" });
    }

    const existingBadge = await Gym.findOne({ gymBadge });
    if (existingBadge) {
      return res.status(400).json({ message: "Badge name already exists" });
    }

    const gym = await Gym.create({
      gymName,
      gymLeader,
      gymBadge,
      gymMembers: [],
    });

    res.status(201).json({
      message: "Gym created successfully",
      gym,    
    });
  } catch (error) {
    console.error("Error creating gym:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post(
  "/:id/join",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const gym = await Gym.findById(req.params.id);
      if (!gym) {
        return res.status(404).json({ message: "Gym not found" });
      }

      if (gym.gymMembers.includes(req.trainer._id)) {
        return res
          .status(400)
          .json({ message: "You are already a member of this gym" });
      }

      gym.gymMembers.push(req.trainer._id);
      await gym.save();

      res.json({
        message: `Successfully joined ${gym.gymName}`,
        gym,
      });
    } catch (error) {
      console.error("Error joining gym:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post(
  "/:id/leave",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const gym = await Gym.findById(req.params.id);
      if (!gym) {
        return res.status(404).json({ message: "Gym not found" });
      }

      const memberIndex = gym.gymMembers.indexOf(req.trainer._id);
      if (memberIndex === -1) {
        return res
          .status(400)
          .json({ message: "You are not a member of this gym" });
      }

      gym.gymMembers.splice(memberIndex, 1);
      await gym.save();

      res.json({
        message: `Successfully left ${gym.gymName}`,
        gym,
      });
    } catch (error) {
      console.error("Error leaving gym:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post(
  "/:id/claim",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { trainerId } = assignBadgeSchema.parse(req.body);

      const gym = await Gym.findById(req.params.id);
      if (!gym) {
        return res.status(404).json({ message: "Gym not found" });
      }


      const targetTrainer = await Trainer.findById(trainerId);
      if (!targetTrainer) {
        return res.status(404).json({ message: "Target trainer not found" });
      }

      const existingBadge = targetTrainer.badges.find(
        (badge) => badge.name === gym.gymBadge
      );
      if (existingBadge) {
        return res
          .status(400)
          .json({ message: "Trainer already has this badge" });
      }

      const newBadge = {
        name: gym.gymBadge,
        gymName: gym.gymName,
        dateEarned: new Date(),
        gymLeader: gym.gymLeader,
      };

      targetTrainer.badges.push(newBadge as Badge);
      await targetTrainer.save();

      res.json({
        message: `Successfully assigned ${gym.gymBadge} badge to ${targetTrainer.name}`,
        badges: targetTrainer.badges,
      });
    } catch (error) {
      console.error("Error assigning badge:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);


export default router;
