const express = require("express");
const router = express.Router();
const MachineDetails = require("../models/machineDetails.js");

// GET all machines
router.get("/", async (req, res) => {
    try {
        const machines = await MachineDetails.find().sort({ createdAt: -1 });
        res.status(200).json(machines);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET single machine by ID
router.get("/:id", async (req, res) => {
    try {
        const machine = await MachineDetails.findById(req.params.id);
        if (!machine) {
            return res.status(404).json({ message: "Machine not found" });
        }
        res.status(200).json(machine);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create new machine
router.post("/", async (req, res) => {
    const machineData = new MachineDetails({
        machine_no: req.body.machine_no,
        machine_name: req.body.machine_name,
        location: req.body.location,
        image: req.body.image,
        specifications: req.body.specifications || []
    });

    try {
        const savedMachine = await machineData.save();
        res.status(201).json(savedMachine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT update machine
router.put("/:id", async (req, res) => {
    try {
        const updatedMachine = await MachineDetails.findByIdAndUpdate(
            req.params.id,
            {
                machine_no: req.body.machine_no,
                machine_name: req.body.machine_name,
                location: req.body.location,
                image: req.body.image,
                specifications: req.body.specifications
            },
            { new: true }
        );
        if (!updatedMachine) {
            return res.status(404).json({ message: "Machine not found" });
        }
        res.status(200).json(updatedMachine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE machine
router.delete("/:id", async (req, res) => {
    try {
        const deletedMachine = await MachineDetails.findByIdAndDelete(req.params.id);
        if (!deletedMachine) {
            return res.status(404).json({ message: "Machine not found" });
        }
        res.status(200).json({ message: "Machine deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
